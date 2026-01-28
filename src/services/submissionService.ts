import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { validateSubmissionSearchFilters, validateCreateSubmissionInputs, validateIdInput, isValidHpInput } from '../validation/validateSubmissions.js'
import { logger } from '../logger.js'
import { getFacilityDetailsForSubmission } from '../../utils/submissionDataFromGoogleMaps.js'
import { getSupabaseClient } from '../supabaseClient.js'
import { createAuditLog } from './auditLogServiceSupabase.js'
import type { Transaction } from 'kysely'
import type { Database } from '../typeDefs/kyselyTypes.js'
import type { SubmissionsTable } from '../typeDefs/kyselyTypes.js'
import type { Selectable } from 'kysely'
import { db } from '../kyselyClient.js'
import { mapKyselySubmissionToGraphQL, mapDbEntityTogqlEntity } from '../services/mappersEntityService.js'
import { asJsonb } from '../../utils/dbUtils.js'

/**
 * Builds a minimal, empty address object.
 * Used when a submission does not contain address details,
 * but a complete shape is required to avoid null references.
 */
function createBlankAddress(): gqlTypes.PhysicalAddressInput {
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

/**
 * Builds a minimal contact object.
 * Ensures all required fields are defined, even if empty.
 * @param googleMapsUrl Optional pre-filled Google Maps URL.
 */

function createBlankContact(googleMapsUrl?: string): gqlTypes.ContactInput {
    return {
        address: createBlankAddress(),
        email: '',
        phone: '',
        website: '',
        googleMapsUrl: googleMapsUrl ?? ''
    }
}

/**
 * Deduplicates and sanitizes a list of locale codes.
 * Removes null/undefined entries and returns unique Locale values.
 * @param locales Possibly null or undefined list of Locale values.
 * @returns Array of unique, valid locales.
 */
function sanitizeLocales(locales: (gqlTypes.Locale | null | undefined)[] | null | undefined): gqlTypes.Locale[] {
    if (!locales) { return [] }
    // Filter out null/undefined entries
    const clean = locales.filter((local): local is gqlTypes.Locale => !!local)

    return Array.from(new Set(clean))
}

/**
 * Splits a full name string into first, last, and optional middle name parts.
 * If only one part is found, assigns 'Unknown' as a fallback last name.
 * @example
 * splitPersonName("John Smith") → { firstName: "John", lastName: "Smith" }
 * splitPersonName("Madonna") → { firstName: "Madonna", lastName: "Unknown" }
 */
function splitPersonName(full: string): { firstName: string; lastName: string; middleName?: string } {
    // Split by any whitespace and remove empty parts
    const parts = full.trim().split(/\s+/).filter(Boolean)

    if (parts.length === 1) {
        return { firstName: parts[0], lastName: 'Unknown' }
    }
    if (parts.length === 2) {
        return { firstName: parts[0], lastName: parts[1] }
    }
    // For 3+ parts: treat the first as firstName, last as lastName, and join the rest as middleName
    return {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        middleName: parts.slice(1, -1).join(' ')
    }    
}

/**
 * Applies filtering logic to a Supabase query builder for the `submissions` table.
 * It handles text search, status flag logic, and date equality filters.
 *
 * @template B Query builder type
 * @param queryBuilder The base Supabase query builder instance.
 * @param filters Filters provided via GraphQL submission search input.
 * @returns Modified query builder with applied filters.
 */
//eslint-disable-next-line
function applySubmissionQueryFilters<T extends Record<string, any>>(
  queryBuilder: T,
  filters: gqlTypes.SubmissionSearchFilters
): T {
    let query = queryBuilder

    // Apply case-insensitive partial match on googleMapsUrl
    if (filters.googleMapsUrl) {
        query = query.ilike('google_maps_url', `%${filters.googleMapsUrl}%`) as T
    }

    if (filters.healthcareProfessionalName) {
        query = query.ilike(
            'healthcare_professional_name',
            `%${filters.healthcareProfessionalName}%`
        ) as T
    }

    // Build array of requested status filters using constants
    const requestedStatuses: dbSchema.SubmissionStatusValue[] = []

    if (filters.isUnderReview) {
        requestedStatuses.push(dbSchema.SUBMISSION_STATUS.UNDER_REVIEW)
    }
    if (filters.isApproved) {
        requestedStatuses.push(dbSchema.SUBMISSION_STATUS.APPROVED)
    }
    if (filters.isRejected) {
        requestedStatuses.push(dbSchema.SUBMISSION_STATUS.REJECTED)
    }

    // Validate: conflicting status filters
    if (requestedStatuses.length > 1) {
        throw Object.assign(new Error('Conflicting status filters'), { httpStatus: 400 })
    }

    // Apply status filter if exactly one was requested
    if (requestedStatuses.length === 1) {
        query = query.eq('status', requestedStatuses[0]) as T
    }

    if (filters.createdDate) {
        query = query.eq('created_date', filters.createdDate) as T
    }

    if (filters.updatedDate) {
        query = query.eq('updated_date', filters.updatedDate) as T
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

        let base = applySubmissionQueryFilters(
            supabase.from('submissions').select('*'),
            filters
        )

        const orderBy = filters.orderBy?.[0]

        if (orderBy?.fieldToOrder) {
            base = base.order(orderBy.fieldToOrder, {
                ascending: orderBy.orderDirection !== 'desc'
            })
        } else {
            base = base.order('created_date', { ascending: false })
        }

        // Apply pagination
        const { data: rows, error: paginationError } = await base.range(offset, offset + limit - 1)

        if (paginationError) { throw paginationError }

        // Convert DB → GQL
        let listSubmissions = (rows ?? []).map(row => mapDbEntityTogqlEntity(row as dbSchema.SubmissionRow))

        const langs = (filters.spokenLanguages ?? []).filter((l): l is gqlTypes.Locale => !!l)

        if (langs.length > 0) {
            listSubmissions = listSubmissions.filter(sub =>
                (sub.spokenLanguages ?? []).some(l => langs.includes(l)))
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

        // Build a HEAD query that returns only the count
        const headSelect = supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })

        // Apply the same filtering logic as searchSubmissions
        const { count: countSubs, error: countSubsErr } = await applySubmissionQueryFilters(headSelect, filters)

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

        // Filter out validation errors related to ID (not user-supplied)
        const filteredErrors = (validationResults.errors ?? []).filter(e => e.field !== 'id')

        if (validationResults.hasErrors && filteredErrors.length > 0) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: filteredErrors
            }
        }

        const gqlSubmission = await db.transaction().execute(async transaction => {
            // Insert submission
            const insertedSubmission = await transaction
                .insertInto('submissions')
                .values({
                    status: 'pending',
                    google_maps_url: submissionInput.googleMapsUrl ?? '',
                    healthcare_professional_name: submissionInput.healthcareProfessionalName ?? '',
                    spoken_languages: asJsonb<gqlTypes.Locale[]>(submissionInput.spokenLanguages ?? []),
                    autofill_place_from_submission_url: false,
                    facility_partial: null,
                    healthcare_professionals_partial: null,
                    hps_id: null,
                    facilities_id: null,
                    notes: submissionInput.notes ?? null,
                    created_date: new Date().toISOString(),
                    updated_date: new Date().toISOString()
                })
                .returningAll()
                .executeTakeFirstOrThrow()

            // Map to GraphQL
            const plainGqlSubmission = mapKyselySubmissionToGraphQL(insertedSubmission)
            
            await createAuditLog(transaction, {
                actionType: gqlTypes.ActionType.Create,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                newValue: plainGqlSubmission
            })

            return plainGqlSubmission
        })

        logger.info(`DB-CREATE: submission ${gqlSubmission.id} created`)
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
 * Updates a submission record in the database.
 * 
 * IMPORTANT REDIRECT LOGIC:
 * - If isApproved=true → redirects to approveSubmission()
 * - If autofillPlaceFromSubmissionUrl=true → redirects to autoFillPlacesInformation()
 * 
 * These redirects happen BEFORE starting the transaction to avoid nested
 * transaction complexity and external API calls (Google Places) inside transactions.
 * 
 * TRANSACTION BEHAVIOR:
 * - Throws special error codes (NOT_FOUND, AUTOFILL_FAILURE, etc.) to signal specific failures
 * - These are caught in the outer catch block and converted to proper Result objects
 * - This pattern avoids multiple return statements inside the transaction
 */
export const updateSubmission = async (
    submissionId: string,
    fieldsToUpdate: Partial<gqlTypes.UpdateSubmissionInput>,
    updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
    try {
        // Redirect to approveSubmission if isApproved flag is set
        if (fieldsToUpdate.isApproved === true) {
            return await approveSubmission(submissionId, updatedBy)
        }

        const gqlSubmission = await db.transaction().execute(async transaction => {
            // Load the current submission state
            const currentSubmission = await transaction
                .selectFrom('submissions')
                .selectAll()
                .where('id', '=', submissionId)
                .executeTakeFirst()

            if (!currentSubmission) {
                throw new Error('NOT_FOUND')
            }

            /*
            * AUTOFILL VALIDATION
            * A submission can autofill itself only once.
            * If the DB already has autofillPlaceFromSubmissionUrl=true,
            * and the user requests autofill again, reject the update.
            */
            if (fieldsToUpdate.autofillPlaceFromSubmissionUrl && currentSubmission.autofill_place_from_submission_url) {
                throw new Error('AUTOFILL_FAILURE')
            }

            // If the user is requesting autofill and this submission has NOT used autofill yet,
            // we need to redirect to autoFillPlacesInformation.
            // 
            // CRITICAL: We cannot call autoFillPlacesInformation directly here because:
            // - It makes external API calls (Google Places) which should not be in transactions
            // - It would create nested transactions (autoFillPlacesInformation starts its own transaction)
            // 
            // Solution: Throw a special error that the outer catch block will handle
            // by calling autoFillPlacesInformation AFTER the transaction is rolled back.
            if (fieldsToUpdate.autofillPlaceFromSubmissionUrl && !currentSubmission.autofill_place_from_submission_url) {
                throw new Error('REDIRECT_TO_AUTOFILL')
            }

            // Map boolean flags to status value
            let newStatus = currentSubmission.status

            // Build array of requested status changes
            const requestedStatuses: ('under_review' | 'approved' | 'rejected')[] = []
            
            if (fieldsToUpdate.isUnderReview) {
                requestedStatuses.push('under_review')
            }
            if (fieldsToUpdate.isApproved) {
                requestedStatuses.push('approved')
            }
            if (fieldsToUpdate.isRejected) {
                requestedStatuses.push('rejected')
            }

            // Validate: only one status can be set at a time
            if (requestedStatuses.length > 1) {
                throw new Error('INVALID_INPUT')
            }

            // Apply the new status if one was requested
            if (requestedStatuses.length === 1) {
                newStatus = requestedStatuses[0]
            }

            // Build the patch
            const patch: Record<string, unknown> = {
                updated_date: new Date().toISOString(),
                status: newStatus
            }

            if (fieldsToUpdate.googleMapsUrl !== undefined) {
                patch.google_maps_url = fieldsToUpdate.googleMapsUrl
            }

            if (fieldsToUpdate.healthcareProfessionalName !== undefined) {
                patch.healthcare_professional_name = fieldsToUpdate.healthcareProfessionalName
            }

            if (fieldsToUpdate.notes !== undefined) {
                patch.notes = fieldsToUpdate.notes
            }

            if (fieldsToUpdate.autofillPlaceFromSubmissionUrl !== undefined) {
                patch.autofill_place_from_submission_url = fieldsToUpdate.autofillPlaceFromSubmissionUrl
            }

            if (fieldsToUpdate.spokenLanguages !== undefined) {
                patch.spoken_languages = asJsonb<gqlTypes.Locale[]>(fieldsToUpdate.spokenLanguages ?? [])
            }

            if (fieldsToUpdate.healthcareProfessionals !== undefined) {
                patch.healthcare_professionals_partial = asJsonb(fieldsToUpdate.healthcareProfessionals ?? [])
            }

            if (fieldsToUpdate.facility !== undefined) {
                patch.facility_partial = asJsonb(fieldsToUpdate.facility ?? null)
            }
            // Update the submission
            const updatedSubmission = await transaction
                .updateTable('submissions')
                .set(patch)
                .where('id', '=', submissionId)
                .returningAll()
                .executeTakeFirstOrThrow()

            // Map to GraphQL for audit log
            const oldGqlSubmission = mapKyselySubmissionToGraphQL(currentSubmission)
            const newGqlSubmission = mapKyselySubmissionToGraphQL(updatedSubmission)

            // Create audit log entry
            await createAuditLog(transaction, {
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: oldGqlSubmission,
                newValue: newGqlSubmission
            })

            return newGqlSubmission
        })

        return { data: gqlSubmission, hasErrors: false }
    } catch (error) {
        const errorMessage = (error as Error).message

        // Handle NOT_FOUND error
        if (errorMessage === 'NOT_FOUND') {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'id', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
            }
        }

        // Handle AUTOFILL_FAILURE error
        if (errorMessage === 'AUTOFILL_FAILURE') {
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

        // Handle REDIRECT_TO_AUTOFILL special case
        if (errorMessage === 'REDIRECT_TO_AUTOFILL') {
            return await autoFillPlacesInformation(
                submissionId,
                fieldsToUpdate.googleMapsUrl,
                updatedBy
            )
        }

        // Handle INVALID_INPUT error (multiple status flags)
        if (errorMessage === 'INVALID_INPUT') {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{
                    field: 'status',
                    errorCode: ErrorCode.INVALID_INPUT,
                    httpStatus: 400
                }]
            }
        }

        // Generic error
        logger.error(`ERROR: Error updating submission ${submissionId}: ${error}`)
        return {
            data: {} as gqlTypes.Submission,
            hasErrors: true,
            errors: [{ field: 'updateSubmission', errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
        }
    }
}

/**
 * Performs automatic enrichment of a Submission using Google Maps / Places data.
 * CRITICAL DESIGN PATTERN:
 * - External API call happens OUTSIDE the transaction (getFacilityDetailsForSubmission)
 * - Only after successful API response, we start the Kysely transaction
 * - This prevents:
 *    - Long-running transactions (bad for DB performance)
 *    - Transaction timeout during slow API calls
 *    - Unnecessary transaction rollback if API fails
 */
export const autoFillPlacesInformation = async (
    submissionId: string,
    googleMapsUrl: gqlTypes.InputMaybe<string> | undefined,
    updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
    try {
        if (!googleMapsUrl) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'googleMapsUrl', errorCode: ErrorCode.AUTOFILL_FAILURE, httpStatus: 400 }]
            }
        }

        // Fetch Google Places data (outside transaction - external API call)
        const places = await getFacilityDetailsForSubmission(googleMapsUrl as string)

        if (!places) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'googleMapsUrl', errorCode: ErrorCode.AUTOFILL_FAILURE, httpStatus: 400 }]
            }
        }

        const gqlSubmission = await db.transaction().execute(async transaction => {
            // Fetch current submission
            const currentSubmission = await transaction
                .selectFrom('submissions')
                .selectAll()
                .where('id', '=', submissionId)
                .executeTakeFirst()

            if (!currentSubmission) {
                throw new Error(`Submission not found: ${submissionId}`)
            }

            // Build facility partial
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

            // Update submission with autofill data
            const updatedSubmission = await transaction
                .updateTable('submissions')
                .set({
                    google_maps_url: places.extractedGoogleMapsURI ?? currentSubmission.google_maps_url,
                    //eslint-disable-next-line
                    facility_partial: asJsonb<gqlTypes.FacilitySubmission>(facilityPartial),
                    status: 'under_review',
                    autofill_place_from_submission_url: true,
                    updated_date: new Date().toISOString()
                })
                .where('id', '=', submissionId)
                .returningAll()
                .executeTakeFirstOrThrow()

            // Map to GraphQL
            const oldGqlSubmission = mapKyselySubmissionToGraphQL(currentSubmission)
            const newGqlSubmission = mapKyselySubmissionToGraphQL(updatedSubmission)

            // Audit log
            await createAuditLog(transaction, {
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: oldGqlSubmission,
                newValue: newGqlSubmission
            })

            return newGqlSubmission
        })

        return { data: gqlSubmission, hasErrors: false }
    } catch (error) {
        const errorMessage = (error as Error).message

        if (errorMessage.includes('Submission not found')) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'submissionId', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
            }
        }

        logger.error(`Error updating submission ${submissionId} (autofill): ${error}`)
        return {
            data: {} as gqlTypes.Submission,
            hasErrors: true,
            errors: [{ field: 'autofillPlaceFromSubmissionUrl', errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
        }
    }
}

/**
 * Creates HP within an existing Kysely transaction (for approveSubmission). 
 * WHY THIS FUNCTION EXISTS:
 * - The original tryCreateHealthcareProfessionalForSubmission uses Supabase
 * - It cannot be called inside a Kysely transaction (different connection pools)
 * - This version does inline INSERT using the same transaction object
 * 
 * TRANSACTION-SAFE DESIGN:
 * - Uses transaction.insertInto() instead of Supabase client
 * - Shares the same transaction as approveSubmission
 * - If HP creation fails, entire approval is rolled back atomically
 * @param transaction - Kysely transaction object from parent function
 * @param current - Current submission row from DB
 * @param finalFacilityId - Facility ID to link the HP to
 * @param updatedBy - User performing the action (for audit)
 * @returns HP ID if created, undefined if skipped
 */
async function tryCreateHealthcareProfessionalForSubmissionInTransaction(
    transaction: Transaction<Database>,
    current: Selectable<SubmissionsTable>,
    finalFacilityId: string,
    updatedBy: string
): Promise<string | undefined> {
    if (current.hps_id) {
        return undefined
    }

    let hpInput: gqlTypes.CreateHealthcareProfessionalInput | null = null

    // Case A: healthcare_professionals_partial
    if (current.healthcare_professionals_partial && current.healthcare_professionals_partial.length > 0) {
        const firstHp = current.healthcare_professionals_partial[0]
        const hasNames = Array.isArray(firstHp.names) && firstHp.names.length > 0

        if (hasNames) {
            hpInput = {
                names: firstHp.names!,
                spokenLanguages: sanitizeLocales(
                    (firstHp.spokenLanguages ?? []) as (gqlTypes.Locale | null | undefined)[]
                ),
                degrees: firstHp.degrees ?? [],
                specialties: firstHp.specialties ?? [],
                acceptedInsurance: firstHp.acceptedInsurance ?? [],
                additionalInfoForPatients: firstHp.additionalInfoForPatients ?? '',
                facilityIds: [finalFacilityId]
            }
        } else if (current.healthcare_professional_name?.trim()) {
            const parsed = splitPersonName(current.healthcare_professional_name.trim())
            const localeFromSubmission = (current.spoken_languages?.[0] as gqlTypes.Locale) ?? gqlTypes.Locale.EnUs

            hpInput = {
                names: [{
                    locale: localeFromSubmission,
                    firstName: parsed.firstName,
                    lastName: parsed.lastName,
                    ...(parsed.middleName ? { middleName: parsed.middleName } : {})
                }],
                degrees: [],
                specialties: [],
                spokenLanguages: sanitizeLocales(current.spoken_languages as (gqlTypes.Locale | null | undefined)[]),
                acceptedInsurance: [],
                additionalInfoForPatients: current.notes ?? null,
                facilityIds: [finalFacilityId]
            }
        }
    } else if (current.healthcare_professional_name?.trim()) {
        // Case B: Only healthcareProfessionalName
        const parsed = splitPersonName(current.healthcare_professional_name.trim())
        const localeFromSubmission = (current.spoken_languages?.[0] as gqlTypes.Locale) ?? gqlTypes.Locale.EnUs

        hpInput = {
            names: [{
                locale: localeFromSubmission,
                firstName: parsed.firstName,
                lastName: parsed.lastName,
                ...(parsed.middleName ? { middleName: parsed.middleName } : {})
            }],
            degrees: [],
            specialties: [],
            spokenLanguages: sanitizeLocales(current.spoken_languages as (gqlTypes.Locale | null | undefined)[]),
            acceptedInsurance: [],
            additionalInfoForPatients: current.notes ?? null,
            facilityIds: [finalFacilityId]
        }
    }

    if (!isValidHpInput(hpInput)) {
        return undefined
    }

    // Create HP inline in transaction (NO Supabase calls!)
    const insertedHp = await transaction
        .insertInto('hps')
        .values({
            names: asJsonb<gqlTypes.LocalizedName[]>(hpInput!.names),
            degrees: asJsonb<gqlTypes.Degree[]>(hpInput!.degrees ?? []),
            specialties: asJsonb<gqlTypes.Specialty[]>(hpInput!.specialties ?? []),
            spoken_languages: asJsonb<gqlTypes.Locale[]>(hpInput!.spokenLanguages ?? []),
            accepted_insurance: asJsonb<gqlTypes.Insurance[]>(hpInput!.acceptedInsurance ?? []),
            email: null,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
        })
        .returningAll()
        .executeTakeFirstOrThrow()

    // Create HP-Facility relation
    await transaction
        .insertInto('hps_facilities')
        .values({
            //eslint-disable-next-line
            hps_id: insertedHp.id,
            //eslint-disable-next-line
            facilities_id: finalFacilityId
        })
        .execute()

    return insertedHp.id
}

/**
 * Approves a pending submission and, if needed, creates:
 * - a Facility (from facility_partial or fallback data)
 * - a HealthcareProfessional (from partial data or name string)
 * Load current submission.
 * Short-circuit if already approved.
 * Ensure we have a Facility ID (create one if missing).
 * Ensure we optionally create an HP if enough data is present.
 * Update submission status to "approved" and link created entities.
 * Log an audit entry with old/new values.
 */
export const approveSubmission = async (
    submissionId: string,
    updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
    try {
        const gqlSubmission = await db.transaction().execute(async transaction => {
            // Fetch current submission
            const currentSubmission = await transaction
                .selectFrom('submissions')
                .selectAll()
                .where('id', '=', submissionId)
                .executeTakeFirst()

            if (!currentSubmission) {
                throw new Error(`Submission not found: ${submissionId}`)
            }

            if (currentSubmission.status === 'approved') {
                throw new Error('SUBMISSION_ALREADY_APPROVED')
            }

            let finalFacilityId = currentSubmission.facilities_id

            // Create facility if needed
            if (!finalFacilityId) {
                let facilityInput: gqlTypes.CreateFacilityInput

                if (currentSubmission.facility_partial) {
                    facilityInput = currentSubmission.facility_partial as gqlTypes.CreateFacilityInput
                } else {
                    facilityInput = {
                        nameEn: 'Unknown Facility',
                        nameJa: 'Unknown Facility',
                        contact: createBlankContact(currentSubmission.google_maps_url ?? ''),
                        mapLatitude: 0,
                        mapLongitude: 0,
                        healthcareProfessionalIds: []
                    }
                }

                // CRITICAL NESTED TRANSACTION
                // I'm tryin inline inside transaction
                const insertedFacility = await transaction
                    .insertInto('facilities')
                    .values({
                        name_en: facilityInput.nameEn,
                        name_ja: facilityInput.nameJa,
                        contact: asJsonb<gqlTypes.ContactInput>(facilityInput.contact),
                        map_latitude: facilityInput.mapLatitude ?? 0,
                        map_longitude: facilityInput.mapLongitude ?? 0,
                        created_date: new Date().toISOString(),
                        updated_date: new Date().toISOString()
                    })
                    .returningAll()
                    .executeTakeFirstOrThrow()

                finalFacilityId = insertedFacility.id
            }

            // Create HP if needed
            let createdHpId: string | undefined

            if (finalFacilityId && !currentSubmission.hps_id) {
                createdHpId = await tryCreateHealthcareProfessionalForSubmissionInTransaction(
                    transaction,
                    currentSubmission,
                    finalFacilityId,
                    updatedBy
                )
            }

            // Update submission to be approved
            const updated = await transaction
                .updateTable('submissions')
                .set({
                    status: 'approved',
                    facilities_id: finalFacilityId,
                    hps_id: createdHpId ?? currentSubmission.hps_id,
                    updated_date: new Date().toISOString()
                })
                .where('id', '=', submissionId)
                .returningAll()
                .executeTakeFirstOrThrow()

            // Map to GraphQL
            const oldGqlSubmission = mapKyselySubmissionToGraphQL(currentSubmission)
            const newGqlSubmission = mapKyselySubmissionToGraphQL(updated)

            // Audit log
            await createAuditLog(transaction, {
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: oldGqlSubmission,
                newValue: newGqlSubmission
            })

            return newGqlSubmission
        })

        return { data: gqlSubmission, hasErrors: false }
    } catch (error) {
        const errorMessage = (error as Error).message

        if (errorMessage === 'SUBMISSION_ALREADY_APPROVED') {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'status', errorCode: ErrorCode.SUBMISSION_ALREADY_APPROVED, httpStatus: 400 }]
            }
        }

        if (errorMessage.includes('Submission not found')) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'submissionId', errorCode: ErrorCode.NOT_FOUND, httpStatus: 404 }]
            }
        }

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

        await db.transaction().execute(async transaction => {
            // Step 1: Fetch existing submission
            const existing = await transaction
                .selectFrom('submissions')
                .selectAll()
                .where('id', '=', id)
                .executeTakeFirst()

            if (!existing) {
                throw new Error(`Submission not found: ${id}`)
            }

            // Step 2: Delete submission
            await transaction
                .deleteFrom('submissions')
                .where('id', '=', id)
                .execute()

            // Step 3: Audit log
            const oldGqlSubmission = mapKyselySubmissionToGraphQL(existing)

            await createAuditLog(transaction, {
                actionType: gqlTypes.ActionType.Delete,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: oldGqlSubmission
            })
        })

        logger.info(`DB-DELETE: submission ${id} was deleted`)

        return {
            data: { isSuccessful: true },
            hasErrors: false
        }
    } catch (error) {
        const errorMessage = (error as Error).message

        if (errorMessage.includes('Submission not found')) {
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
