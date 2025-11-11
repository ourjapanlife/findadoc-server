import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { hasSpecialCharacters } from '../../utils/stringUtils.js'
import { validateSubmissionSearchFilters, validateCreateSubmissionInputs } from '../validation/validateSubmissions.js'
import { logger } from '../logger.js'
import { getFacilityDetailsForSubmission } from '../../utils/submissionDataFromGoogleMaps.js'
import { getSupabaseClient } from '../supabaseClient.js'
import { createAuditLogSQL } from './auditLogServiceSupabase.js'
import { createFacility } from './facilityService-pre-migration.js'
import { createHealthcareProfessional } from './healthcareProfessionalService-pre-migration.js'

function makeMinimalAddress(): gqlTypes.PhysicalAddressInput {
    return {
        addressLine1En: '',
        addressLine2En: '',
        addressLine1Ja: '',
        addressLine2Ja: '',
        cityEn: '',
        cityJa: '',
        prefectureEn: '',
        prefectureJa: '',
        postalCode: ''
    }
}

function makeMinimalContact(googleMapsUrl?: string): gqlTypes.ContactInput {
    return {
        address: makeMinimalAddress(),
        email: '',
        phone: '',
        website: '',
        googleMapsUrl: googleMapsUrl ?? ''
    }
}

function dedupeLocales(locales: (gqlTypes.Locale | null | undefined)[] | null | undefined): gqlTypes.Locale[] {
    if (!locales) return []
    const clean = locales.filter((l): l is gqlTypes.Locale => !!l)
    return Array.from(new Set(clean))
}

function splitPersonName(full: string): { firstName: string; lastName: string; middleName?: string } {
    const parts = full.trim().split(/\s+/).filter(Boolean)

    if (parts.length === 1) {
        return { firstName: parts[0], lastName: 'Unknown' }
    }
    if (parts.length === 2) {
        return { firstName: parts[0], lastName: parts[1] }
    }
    return {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        middleName: parts.slice(1, -1).join(' ')
    }    
}

type HasIlike<B> = { 
    ilike: (column: string, pattern: string) => B
}
type HasContains<B> = {
    //eslint-disable-next-line
    contains: (column: string, value: string | readonly any[] | Record<string, unknown>) => B
}
type HasEq<B> = {
    eq: (column: string, value: unknown) => B
}

//Applies filters to a Supabase query builder for the submissions table
function applySubmissionFilters<B extends HasIlike<B> & HasContains<B> & HasEq<B>>(
  queryBuilder: B,
  filters: gqlTypes.SubmissionSearchFilters
): B {
  let query = queryBuilder

  if (filters.googleMapsUrl) {
    query = query.ilike('googleMapsUrl', `%${filters.googleMapsUrl}%`)
  }

  if (filters.healthcareProfessionalName) {
    query = query.ilike('healthcareProfessionalName', `%${filters.healthcareProfessionalName}%`)
  }

  // 👇 niente contains qui (lo facciamo dopo)

  const trueFlags = [
    filters.isUnderReview ? 'under_review' : null,
    filters.isApproved ? 'approved' : null,
    filters.isRejected ? 'rejected' : null
  ].filter(Boolean) as Array<'under_review' | 'approved' | 'rejected'>

  if (trueFlags.length > 1) {
    throw Object.assign(new Error('Conflicting status filters'), { httpStatus: 400 })
  }

  if (trueFlags.length === 1) {
    query = query.eq('status', trueFlags[0])
  }

  if (filters.createdDate) {
    query = query.eq('createdDate', filters.createdDate)
  }

  if (filters.updatedDate) {
    query = query.eq('updatedDate', filters.updatedDate)
  }

  return query
}

/**
 * Gets the Submission from the database that matches the id.
 * @param id The ID of the Submission row in the database.
 * @returns A Submission object.
 */
export const getSubmissionById = async (
    id: string
): Promise<Result<gqlTypes.Submission>> => {
    try {
        const supabase = getSupabaseClient()

        // Query the 'submissions' table using the ID and expect exactly one row because of .single()
        const { data: submissionRow, error: submissionRowError } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', id)
            .single()

        // PGRST116 = no rows found for single()
        if (submissionRowError?.code === 'PGRST116' || !submissionRow) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'id', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
            }
        }

        // Map DB → GQL
        const gqlSubmission = mapDbEntityTogqlEntity(submissionRow as dbSchema.SubmissionRow)

        return { data: gqlSubmission, hasErrors: false }
    } catch (err) {
        logger.error(`ERROR: Error retrieving submission by id ${id}: ${err}`)
        return {
            data: {} as gqlTypes.Submission,
            hasErrors: true,
            errors: [{
                field: 'getSubmissionById',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Searches for submissions in the database based on provided filters.
 * Returns a paginated list of submissions.
 * This function is designed to serve the GraphQL query that returns only the array of submissions.
 * @param filters The search filters to apply.
 * @returns An object containing data (an array of GraphQL Submissions)
 */
export async function searchSubmissions(
  filters: gqlTypes.SubmissionSearchFilters = {}
): Promise<Result<gqlTypes.Submission[]>> {
  try {
    const validation = validateSubmissionSearchFilters(filters)
    if (validation.hasErrors) {
      return { data: [], hasErrors: true, errors: validation.errors }
    }

    const limit = filters.limit ?? 20
    const offset = filters.offset ?? 0

    const supabase = getSupabaseClient()

    let base = applySubmissionFilters(
      supabase.from('submissions').select('*'),
      filters
    )

    // order by
    const orderBy = filters.orderBy?.[0]
    if (orderBy?.fieldToOrder) {
      base = base.order(orderBy.fieldToOrder, {
        ascending: orderBy.orderDirection !== 'desc'
      })
    } else {
      base = base.order('createdDate', { ascending: false })
    }

    const { data: rows, error } = await base.range(offset, offset + limit - 1)
    if (error) throw error

    let listSubmissions = (rows ?? []).map(row => mapDbEntityTogqlEntity(row as dbSchema.SubmissionRow))

    // 👇 filtro lingua lato JS per evitare errori SQL
    const langs = (filters.spokenLanguages ?? []).filter((l): l is gqlTypes.Locale => !!l)
    if (langs.length > 0) {
      listSubmissions = listSubmissions.filter(sub =>
        (sub.spokenLanguages ?? []).some(l => langs.includes(l))
      )
    }

    return { data: listSubmissions, hasErrors: false }
  } catch (err) {
    logger.error(`ERROR: searchSubmissions ${JSON.stringify(filters)} -> ${err}`)
    return {
      data: [],
      hasErrors: true,
      errors: [{
        field: 'searchSubmissions',
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        httpStatus: 500
      }]
    }
  }
}


/**
 * Gets the total count of submissions matching the given filters.
 * This function is specifically for retrieving only the total count, separate from the paginated data.
 * It also preserves your existing return object structure for error handling.
 *
 * @param filters An object that contains parameters to filter on.
 * @returns An object containing data (the total count), hasErrors flag, and optional errors array.
 */
export async function countSubmissions(
  filters: gqlTypes.SubmissionSearchFilters = {}
): Promise<Result<number>> {
    try {
        const validation = validateSubmissionSearchFilters(filters)

        if (validation.hasErrors) {
            return { data: 0, hasErrors: true, errors: validation.errors }
        }

        const supabase = getSupabaseClient()

        //PostgrestFilterBuilder
        const headSelect = supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })

        const { count: countSubs, error: countSubsErr } = await applySubmissionFilters(headSelect, filters)

        if (countSubsErr) { throw countSubsErr }

        return { data: countSubs ?? 0, hasErrors: false }
    } catch (err) {
        logger.error(`ERROR: countSubmissions ${JSON.stringify(filters)} -> ${err}`)
        return {
            data: 0,
            hasErrors: true,
            errors: [{
                field: 'countSubmissions',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

export const createSubmission = async (
  submissionInput: gqlTypes.CreateSubmissionInput,
  updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
  try {
    const validationResults = validateCreateSubmissionInputs(submissionInput)

    const filteredErrors = (validationResults.errors ?? []).filter(e => e.field !== 'id')

    if (validationResults.hasErrors && filteredErrors.length > 0) {
      return {
        data: {} as gqlTypes.Submission,
        hasErrors: true,
        errors: filteredErrors
      }
    }

    const newSubmission = mapGqlEntityToDbEntity(submissionInput)

    const supabase = getSupabaseClient()
    const { data: inserted, error } = await supabase
      .from('submissions')
      .insert(newSubmission)
      .select('*')
      .single()

    if (error) throw error

    const gqlSubmission = mapDbEntityTogqlEntity(inserted as dbSchema.SubmissionRow)

    await createAuditLogSQL({
      actionType: 'CREATE',
      objectType: 'Submission',
      updatedBy,
      newValue: gqlSubmission
    })

    return { data: gqlSubmission, hasErrors: false }
  } catch (error) {
    logger.error(`ERROR: Error creating submission: ${error}`)
    return {
      data: {} as gqlTypes.Submission,
      hasErrors: true,
      errors: [{
        field: 'createSubmission',
        errorCode: ErrorCode.SERVER_ERROR,
        httpStatus: 500
      }]
    }
  }
}


/**
 * Updates a submission.
 * @param submissionId the submission to update
 * @param fieldsToUpdate the fields to update
 * @returns The submission that was updated.
 */
export const updateSubmission = async (
  submissionId: string,
  fieldsToUpdate: Partial<gqlTypes.UpdateSubmissionInput>,
  updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
  try {
    if (fieldsToUpdate.isApproved === true) {
      return await approveSubmission(submissionId, updatedBy)
    }

    const supabase = getSupabaseClient()
    const { data: current, error: readErr } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (readErr || !current) {
      return {
        data: {} as gqlTypes.Submission,
        hasErrors: true,
        errors: [{ field: 'id', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
      }
    }

    if (fieldsToUpdate.autofillPlaceFromSubmissionUrl && current.autofillPlaceFromSubmissionUrl) {
      return {
        data: {} as gqlTypes.Submission,
        hasErrors: true,
        errors: [{
          field: 'autofillPlaceFromSubmissionUrl',
          errorCode: ErrorCode.AUTOFILL_FAILURE,
          httpStatus: 400
        }]
      }
    }
    if (fieldsToUpdate.autofillPlaceFromSubmissionUrl && !current.autofillPlaceFromSubmissionUrl) {
      return await autoFillPlacesInformation(
        submissionId,
        fieldsToUpdate.googleMapsUrl ?? current.googleMapsUrl,
        updatedBy
      )
    }

    const oldValue = mapDbEntityTogqlEntity(current as dbSchema.SubmissionRow)

    const statusFlags = [
      fieldsToUpdate.isUnderReview ? 'under_review' : null,
      fieldsToUpdate.isApproved ? 'approved' : null,
      fieldsToUpdate.isRejected ? 'rejected' : null
    ].filter(Boolean) as Array<'under_review' | 'approved' | 'rejected'>

    if (statusFlags.length > 1) {
      return {
        data: {} as gqlTypes.Submission,
        hasErrors: true,
        errors: [{
          field: 'status',
          errorCode: ErrorCode.INVALID_ID,
          httpStatus: 400
        }]
      }
    }

    const newStatus = statusFlags.length === 1 ? statusFlags[0] : current.status

    const patch: Partial<dbSchema.SubmissionRow> = {
      googleMapsUrl: fieldsToUpdate.googleMapsUrl ?? current.googleMapsUrl,
      healthcareProfessionalName: fieldsToUpdate.healthcareProfessionalName ?? current.healthcareProfessionalName,
      spokenLanguages: fieldsToUpdate.spokenLanguages ?? current.spokenLanguages,
      notes: fieldsToUpdate.notes ?? current.notes,
      autofillPlaceFromSubmissionUrl:
        fieldsToUpdate.autofillPlaceFromSubmissionUrl ?? current.autofillPlaceFromSubmissionUrl,
      status: newStatus,
      updatedDate: new Date().toISOString()
    }

    const { error: updErr } = await supabase
      .from('submissions')
      .update(patch)
      .eq('id', submissionId)

    if (updErr) throw updErr

    const refreshed = await getSubmissionById(submissionId)
    if (refreshed.hasErrors || !refreshed.data) {
      throw new Error('Could not reload updated submission.')
    }

    await createAuditLogSQL({
      actionType: 'UPDATE',
      objectType: 'Submission',
      updatedBy,
      oldValue,
      newValue: refreshed.data
    })

    return { data: refreshed.data, hasErrors: false }
  } catch (error) {
    logger.error(`ERROR: Error updating submission ${submissionId}: ${error}`)
    return {
      data: {} as gqlTypes.Submission,
      hasErrors: true,
      errors: [{ field: 'updateSubmission', errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
    }
  }
}

export const autoFillPlacesInformation = async (
    submissionId: string,
    googleMapsUrl: gqlTypes.InputMaybe<string> | undefined,
    updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
    try {
        const supabase = getSupabaseClient()
        const { data: current, error: readErr } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single()

        if (readErr || !current) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'submissionId', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
            }
        }

        if (!googleMapsUrl) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'googleMapsUrl', errorCode: ErrorCode.AUTOFILL_FAILURE, httpStatus: 400 }]
            }
        }

        const oldValue = mapDbEntityTogqlEntity(current as dbSchema.SubmissionRow)

        const places = await getFacilityDetailsForSubmission(googleMapsUrl as string)

        if (!places) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'googleMapsUrl', errorCode: ErrorCode.AUTOFILL_FAILURE, httpStatus: 400 }]
            }
        }

        const facilityPartial: gqlTypes.FacilitySubmission = {
            id: undefined,
            nameEn: places.extractedNameEn,
            nameJa: places.extractedNameJa ?? places.extractedNameEn,
            contact: {
                phone: places.extractedPhoneNumber,
                email: undefined,
                website: places.extractedWebsite,
                googleMapsUrl: places.extractedGoogleMapsURI,
                address: {
                    addressLine1En: places.extractedAddressLine1En,
                    addressLine2En: undefined,
                    cityEn: places.extractedCityEn ?? '',
                    prefectureEn: places.extractPrefectureEnFromInformation,
                    postalCode: places.extractedPostalCodeFromInformation,
                    addressLine1Ja: places.extractedAddressLine1Ja ?? '',
                    addressLine2Ja: undefined,
                    cityJa: places.extractedCityJa ?? '',
                    prefectureJa: places.extractedPrefectureJa ?? ''
                }
            },
            mapLatitude: places.extractedMapLatitude,
            mapLongitude: places.extractedMapLongitude,
            healthcareProfessionalIds: []
        }

        const patch: Partial<dbSchema.SubmissionRow> = {
            googleMapsUrl: places.extractedGoogleMapsURI ?? current.googleMapsUrl,
            //eslint-disable-next-line
            facility_partial: facilityPartial as any,
            status: 'under_review',
            autofillPlaceFromSubmissionUrl: true,
            updatedDate: new Date().toISOString()
        }

        const { error: updErr } = await supabase
            .from('submissions')
            .update(patch)
            .eq('id', submissionId)

        if (updErr) { throw updErr }

        const refreshed = await getSubmissionById(submissionId)

        if (refreshed.hasErrors || !refreshed.data) {
            throw new Error('Could not reload updated submission after autofill.')
        }

        await createAuditLogSQL({
            actionType: 'UPDATE',
            objectType: 'Submission',
            updatedBy,
            oldValue,
            newValue: refreshed.data
        })

        return { data: refreshed.data, hasErrors: false }
    } catch (error) {
        logger.error(`Error updating submission ${submissionId} (autofill): ${error}`)
        return {
            data: {} as gqlTypes.Submission,
            hasErrors: true,
            errors: [{ field: 'autofillPlaceFromSubmissionUrl', errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
        }
    }
}

function isValidHpInput(hp: gqlTypes.CreateHealthcareProfessionalInput | null | undefined): boolean {
  if (!hp) return false
  if (!Array.isArray(hp.names) || hp.names.length === 0) return false

  const first = hp.names[0]
  if (!first.locale) return false
  if (!first.firstName) return false
  if (!first.lastName) return false

  return true
}

export const approveSubmission = async (
  submissionId: string,
  updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
  try {
    const supabase = getSupabaseClient()
    const { data: current, error: readErr } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (readErr || !current) {
      return {
        data: {} as gqlTypes.Submission,
        hasErrors: true,
        errors: [{ field: 'submissionId', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
      }
    }

    if (current.status === 'approved') {
      return {
        data: {} as gqlTypes.Submission,
        hasErrors: true,
        errors: [{ field: 'status', errorCode: ErrorCode.SUBMISSION_ALREADY_APPROVED, httpStatus: 400 }]
      }
    }

    const oldValue = mapDbEntityTogqlEntity(current as dbSchema.SubmissionRow)

    let createdFacilityId: string | undefined
    let finalFacilityId: string | null = current.facilities_id
    let createdHpId: string | undefined

    // 1) facility
    if (!finalFacilityId) {
      let facilityInput: gqlTypes.CreateFacilityInput
      if (current.facility_partial) {
        facilityInput = current.facility_partial as gqlTypes.CreateFacilityInput
      } else {
        facilityInput = {
          nameEn: 'Unknown Facility',
          nameJa: 'Unknown Facility',
          contact: makeMinimalContact(current.googleMapsUrl ?? ''),
          mapLatitude: 0,
          mapLongitude: 0,
          healthcareProfessionalIds: []
        }
      }

      const facilityRes = await createFacility(facilityInput, updatedBy)
      if (facilityRes.hasErrors || !facilityRes.data) {
        return {
          data: {} as gqlTypes.Submission,
          hasErrors: true,
          errors: [{ field: 'facility', errorCode: ErrorCode.INTERNAL_SERVER_ERROR, httpStatus: 500 }]
        }
      }
      finalFacilityId = facilityRes.data.id
      createdFacilityId = finalFacilityId
    }

    // 2) HP (solo se riusciamo a montare un input valido)
    if (!current.hps_id && finalFacilityId) {
      let hpInput: gqlTypes.CreateHealthcareProfessionalInput | null = null

      // caso: c'è il partial
      if (current.healthcare_professionals_partial && current.healthcare_professionals_partial.length > 0) {
        const firstHp = current.healthcare_professionals_partial[0]
        const hasNames = Array.isArray(firstHp.names) && firstHp.names.length > 0

        if (hasNames) {
          hpInput = {
            names: firstHp.names!,
            spokenLanguages: dedupeLocales(
              (firstHp.spokenLanguages ?? []) as (gqlTypes.Locale | null | undefined)[]
            ),
            degrees: firstHp.degrees ?? [],
            specialties: firstHp.specialties ?? [],
            acceptedInsurance: firstHp.acceptedInsurance ?? [],
            additionalInfoForPatients: firstHp.additionalInfoForPatients ?? '',
            facilityIds: [finalFacilityId]
          }
        } else if (current.healthcareProfessionalName?.trim()) {
          const parsed = splitPersonName(current.healthcareProfessionalName.trim())
          const localeFromSubmission =
            (current.spokenLanguages?.[0] as gqlTypes.Locale) ?? gqlTypes.Locale.EnUs

          hpInput = {
            names: [{
              locale: localeFromSubmission,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              ...(parsed.middleName ? { middleName: parsed.middleName } : {})
            }],
            degrees: [],
            specialties: [],
            spokenLanguages: dedupeLocales(
              current.spokenLanguages as (gqlTypes.Locale | null | undefined)[]
            ),
            acceptedInsurance: [],
            additionalInfoForPatients: current.notes ?? null,
            facilityIds: [finalFacilityId]
          }
        }
      }
      // caso: niente partial ma c’è la stringa nome
      else if (current.healthcareProfessionalName?.trim()) {
        const parsed = splitPersonName(current.healthcareProfessionalName.trim())
        const localeFromSubmission =
          (current.spokenLanguages?.[0] as gqlTypes.Locale) ?? gqlTypes.Locale.EnUs

        hpInput = {
          names: [{
            locale: localeFromSubmission,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            ...(parsed.middleName ? { middleName: parsed.middleName } : {})
          }],
          degrees: [],
          specialties: [],
          spokenLanguages: dedupeLocales(
            current.spokenLanguages as (gqlTypes.Locale | null | undefined)[]
          ),
          acceptedInsurance: [],
          additionalInfoForPatients: current.notes ?? null,
          facilityIds: [finalFacilityId]
        }
      }

      // 👇 QUI la guardia decisiva
      if (isValidHpInput(hpInput)) {
        const hpRes = await createHealthcareProfessional(hpInput!, updatedBy)
        if (hpRes.hasErrors || !hpRes.data) {
          // invece di far fallire tutto, approviamo lo stesso
          logger.warn(`approveSubmission: could not create HP for submission ${submissionId}, continuing anyway`)
        } else {
          createdHpId = hpRes.data.id
        }
      } else {
        // niente dati buoni → non provo nemmeno
        logger.info(`approveSubmission: skipping HP creation for submission ${submissionId} due to insufficient data`)
      }
    }

    // 3) update submission
    const patch: Partial<dbSchema.SubmissionRow> = {
      status: 'approved',
      facilities_id: createdFacilityId ?? current.facilities_id ?? finalFacilityId,
      hps_id: createdHpId ?? current.hps_id ?? null,
      updatedDate: new Date().toISOString()
    }

    const { error: updatedErr } = await supabase
      .from('submissions')
      .update(patch)
      .eq('id', submissionId)

    if (updatedErr) {
      throw updatedErr
    }

    const refreshed = await getSubmissionById(submissionId)
    if (refreshed.hasErrors || !refreshed.data) {
      throw new Error('Could not reload approved submission.')
    }

    await createAuditLogSQL({
      actionType: 'UPDATE',
      objectType: 'Submission',
      updatedBy,
      oldValue,
      newValue: refreshed.data
    })

    return { data: refreshed.data, hasErrors: false }
  } catch (error) {
    logger.error(`Error approving submission ${submissionId}: ${error}`)
    return {
      data: {} as gqlTypes.Submission,
      hasErrors: true,
      errors: [{ field: 'status', errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
    }
  }
}



/**
 * This deletes a Submission from the database. If the submission doesn't exist, it will return a validation error.
 * @param id The ID of the submission in the database to delete.
 */
export async function deleteSubmission(
  id: string,
  updatedBy: string
): Promise<Result<gqlTypes.DeleteResult>> {
    try {
        const validation = validateIdInput(id)

        if (validation.hasErrors) {
            logger.warn(`Validation Error: invalid id for deleteSubmission: ${id}`)
            return {
                data: { isSuccessful: false },
                hasErrors: true,
                errors: validation.errors
            }
        }

        // Ensure the submission exists (utile per messaggi e audit)
        const existing = await getSubmissionById(id)

        if (existing.hasErrors || !existing.data) {
            logger.warn(`deleteSubmission: submission not found: ${id}`)
            return {
                data: { isSuccessful: false },
                hasErrors: true,
                errors: [{
                    field: 'deleteSubmission',
                    errorCode: ErrorCode.INVALID_ID,
                    httpStatus: 404
                }]
            }
        }

        const supabase = getSupabaseClient()
        // Delete
        const { error: delErr } = await supabase
            .from('submissions')
            .delete()
            .eq('id', id)

        if (delErr) {
            throw new Error(`Failed to delete submission: ${delErr.message}`)
        }

        await createAuditLogSQL({
            actionType: 'DELETE',
            objectType: 'Submission',
            updatedBy,
            oldValue: existing.data
        })

        logger.info(`\nDB-DELETE: submission ${id} was deleted.\nEntity: ${JSON.stringify(id)}`)

        return {
            data: { isSuccessful: true },
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error deleting submission ${id}: ${error}`)
        return {
            data: { isSuccessful: false },
            hasErrors: true,
            errors: [{
                field: 'deleteSubmission',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

export function mapDbEntityTogqlEntity(row: dbSchema.SubmissionRow): gqlTypes.Submission {
    return {
        id: row.id,
        googleMapsUrl: row.googleMapsUrl,
        healthcareProfessionalName: row.healthcareProfessionalName,
        spokenLanguages: row.spokenLanguages as gqlTypes.Locale[],
        autofillPlaceFromSubmissionUrl: row.autofillPlaceFromSubmissionUrl,
        facility: row.facility_partial ? {
            ...row.facility_partial,
            healthcareProfessionalIds: row.facility_partial.healthcareProfessionalIds ?? [] // ← FIX!
        } : undefined,
        healthcareProfessionals: row.healthcare_professionals_partial ?? [],
        isUnderReview: row.status === 'under_review',
        isApproved: row.status === 'approved',
        isRejected: row.status === 'rejected',
        createdDate: row.createdDate,
        updatedDate: row.updatedDate,
        notes: row.notes ?? undefined
    }
}

function validateIdInput(id: string): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (!id) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
        return validationResults
    }

    const okId = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

    if (!okId.test(id) || id.length > 4096) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
    }

    return validationResults
}

export function mapGqlEntityToDbEntity(
    input: gqlTypes.CreateSubmissionInput
): dbSchema.SubmissionInsertRow {
    return {
        status: 'pending',
        googleMapsUrl: input.googleMapsUrl ?? '',
        healthcareProfessionalName: input.healthcareProfessionalName ?? '',
        spokenLanguages: (input.spokenLanguages ?? []) as gqlTypes.Locale[],
        autofillPlaceFromSubmissionUrl: false,
        
        //eslint-disable-next-line
        facility_partial: null,
        //eslint-disable-next-line
        healthcare_professionals_partial: null,
        
        //eslint-disable-next-line
        hps_id: null,
        //eslint-disable-next-line
        facilities_id: null,
        
        notes: input.notes ?? null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    }
}
