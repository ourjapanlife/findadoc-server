import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { ErrorCode, Result } from '../result.js'
import { validateSubmissionSearchFilters, validateCreateSubmissionInputs, validateIdInput, isValidHpInput } from '../validation/validateSubmissions.js'
import { logger } from '../logger.js'
import { getFacilityDetailsForSubmission } from '../../utils/submissionDataFromGoogleMaps.js'
import { getSupabaseClient } from '../supabaseClient.js'
import { createAuditLogSQL } from './auditLogServiceSupabase.js'
import { createFacility } from './facilityService-pre-migration.js'
import { createHealthcareProfessional } from './healthcareProfessionalService-pre-migration.js'
import { createBlankContact, sanitizeLocales, splitPersonName, applySubmissionQueryFilters } from './helperFunctionsServices.js'

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
            base = base.order('createdDate', { ascending: false })
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
    // Tracking variable for rollback
    let createdSubmissionId: string | null = null

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

        // Convert GraphQL → DB row
        const newSubmission = mapGqlEntityToDbEntity(submissionInput)

        const supabase = getSupabaseClient()
        const { data: inserted, error: insertedError } = await supabase
            .from('submissions')
            .insert(newSubmission)
            .select('*')
            .single()

        if (insertedError) { throw insertedError }

        // Track created submission
        createdSubmissionId = inserted.id as string

        // Convert DB → GQL for client response
        const gqlSubmission = mapDbEntityTogqlEntity(inserted as dbSchema.SubmissionRow)

        // Wrap audit log in try-catch with rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Create,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                newValue: gqlSubmission
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for submission ${createdSubmissionId}: ${auditError}`)
            logger.warn(`Rolling back submission ${createdSubmissionId} due to audit log failure`)

            // ROLLBACK: Delete the submission
            await supabase
                .from('submissions')
                .delete()
                .eq('id', createdSubmissionId)

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        logger.info(`DB-CREATE: submission ${createdSubmissionId} created with audit log`)

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
 * Check if this update request implies an approval → redirect to approveSubmission().
 * Load the existing submission row.
 * Validate mutually exclusive fields (e.g., autofill logic).
 * Determine the new status (only one status flag may be set).
 * Build a patch object merging old values with updated ones.
 * Persist changes to Supabase.
 * Re-fetch the row to return the updated version.
 * Write an audit log entry comparing old/new values.
 *
 * @param submissionId - ID of the submission to update.
 * @param fieldsToUpdate - Partial update object from the GraphQL input.
 * @returns The updated submission as a GraphQL entity.
 */
export const updateSubmission = async (
    submissionId: string,
    fieldsToUpdate: Partial<gqlTypes.UpdateSubmissionInput>,
    updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
    // Tracking variables for rollback
    let originalSubmission: gqlTypes.Submission | null = null

    try {
        if (fieldsToUpdate.isApproved === true) {
            return await approveSubmission(submissionId, updatedBy)
        }

        const supabase = getSupabaseClient()
        /**
         * Load the current submission state.
         * `.single()` ensures that exactly one row must match.
         */
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

        /**
         * AUTOFILL VALIDATION
         * A submission can autofill itself only once.
         * If the DB already has autofillPlaceFromSubmissionUrl=true,
         * and the user requests autofill again, reject the update.
         */
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
        /**
         * If the user is requesting autofill and this submission has NOT used autofill yet,
         * redirect to the dedicated autofill handler.
         * This path extracts Google Places data and updates the submission.
         */
        if (fieldsToUpdate.autofillPlaceFromSubmissionUrl && !current.autofillPlaceFromSubmissionUrl) {
            return await autoFillPlacesInformation(
                submissionId,
                fieldsToUpdate.googleMapsUrl ?? current.googleMapsUrl,
                updatedBy
            )
        }

        // Store original state for rollback
        originalSubmission = mapDbEntityTogqlEntity(current as dbSchema.SubmissionRow)

        // Refactored: Map boolean flags to status value
        let newStatus: dbSchema.SubmissionStatusValue = current.status

        // Build array of requested status changes
        const requestedStatuses: dbSchema.SubmissionStatusValue[] = []
        
        if (fieldsToUpdate.isUnderReview) {
            requestedStatuses.push(dbSchema.SUBMISSION_STATUS.UNDER_REVIEW)
        }
        if (fieldsToUpdate.isApproved) {
            requestedStatuses.push(dbSchema.SUBMISSION_STATUS.APPROVED)
        }
        if (fieldsToUpdate.isRejected) {
            requestedStatuses.push(dbSchema.SUBMISSION_STATUS.REJECTED)
        }

        // Validate: only one status can be set at a time
        if (requestedStatuses.length > 1) {
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

        // Apply the new status if one was requested
        if (requestedStatuses.length === 1) {
            newStatus = requestedStatuses[0]
        }

        /**
         * BUILDING THE PATCH
         * For each editable field, we fallback to the existing value
         * if the client did not provide a new one. This ensures no field
         * is accidentally nulled or removed.
         * updatedDate is always set to "now".
         */
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

        if (updErr) { throw updErr }

        const refreshed = await getSubmissionById(submissionId)

        if (refreshed.hasErrors || !refreshed.data) {
            throw new Error('Could not reload updated submission.')
        }

        // Wrap audit log in try-catch with rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: originalSubmission,
                newValue: refreshed.data
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for submission ${submissionId}: ${auditError}`)
            logger.warn(`Rolling back submission ${submissionId} update due to audit log failure`)

            // ROLLBACK: Restore original state
            await supabase
                .from('submissions')
                .update({
                    googleMapsUrl: originalSubmission.googleMapsUrl,
                    healthcareProfessionalName: originalSubmission.healthcareProfessionalName,
                    spokenLanguages: originalSubmission.spokenLanguages,
                    notes: originalSubmission.notes ?? null,
                    autofillPlaceFromSubmissionUrl: originalSubmission.autofillPlaceFromSubmissionUrl,
                    status: originalSubmission.isApproved ? dbSchema.SUBMISSION_STATUS.APPROVED : 
                        originalSubmission.isRejected ? dbSchema.SUBMISSION_STATUS.REJECTED : 
                            originalSubmission.isUnderReview ? dbSchema.SUBMISSION_STATUS.UNDER_REVIEW : dbSchema.SUBMISSION_STATUS.PENDING,
                    updatedDate: originalSubmission.updatedDate
                })
                .eq('id', submissionId)

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

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

/**
 * Performs an automatic enrichment of a Submission using Google Maps / Places data.
 * Load the existing submission.
 * Validate presence of googleMapsUrl.
 * Fetch place data from external APIs (via getFacilityDetailsForSubmission).
 * Construct a partial "facility-like" structure called facility_partial.
 * Update the submission with new geolocation + extracted details.
 * Write audit logs comparing old/new values.
 */
export const autoFillPlacesInformation = async (
    submissionId: string,
    googleMapsUrl: gqlTypes.InputMaybe<string> | undefined,
    updatedBy: string
): Promise<Result<gqlTypes.Submission>> => {
    // Tracking variable for rollback
    let originalSubmission: gqlTypes.Submission | null = null

    try {
        const supabase = getSupabaseClient()
        // Load current submission
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

        // Store original state for rollback
        originalSubmission = mapDbEntityTogqlEntity(current as dbSchema.SubmissionRow)

        const places = await getFacilityDetailsForSubmission(googleMapsUrl as string)

        if (!places) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'googleMapsUrl', errorCode: ErrorCode.AUTOFILL_FAILURE, httpStatus: 400 }]
            }
        }

        /**
        * Construct the “facility_partial” field.
        * This is a lightweight structure modeling a Facility but not persisted
        * in the facilities table. It is used for UI review before approving a real facility.
        * Many values may be undefined if Places does not provide them.
        */
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

        /**
         * Build DB patch:
         * - Update Google Maps URL
         * - Store facility_partial blob
         * - Mark status = "under_review"
         * - Mark autofillPlaceFromSubmissionUrl = true
         * - Always refresh updatedDate
         */
        const patch: Partial<dbSchema.SubmissionRow> = {
            googleMapsUrl: places.extractedGoogleMapsURI ?? current.googleMapsUrl,
            //eslint-disable-next-line
            facility_partial: facilityPartial as any,
            status: dbSchema.SUBMISSION_STATUS.UNDER_REVIEW,
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

        // Wrap audit log in try-catch with rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: originalSubmission,
                newValue: refreshed.data
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for submission ${submissionId} autofill: ${auditError}`)
            logger.warn(`Rolling back submission ${submissionId} autofill due to audit log failure`)

            // ROLLBACK: Restore original state
            await supabase
                .from('submissions')
                .update({
                    googleMapsUrl: originalSubmission.googleMapsUrl,
                    //eslint-disable-next-line
                    facility_partial: originalSubmission.facility as any ?? null,
                    status: originalSubmission.isApproved ? dbSchema.SUBMISSION_STATUS.APPROVED : 
                        originalSubmission.isRejected ? dbSchema.SUBMISSION_STATUS.REJECTED : 
                            originalSubmission.isUnderReview ? dbSchema.SUBMISSION_STATUS.UNDER_REVIEW : dbSchema.SUBMISSION_STATUS.PENDING,
                    autofillPlaceFromSubmissionUrl: originalSubmission.autofillPlaceFromSubmissionUrl,
                    updatedDate: originalSubmission.updatedDate
                })
                .eq('id', submissionId)

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

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

/**
 * Helper: Attempts to create an HP for the submission if needed.
 * Handles all the complex logic of parsing HP data from various sources.
 * Returns the created HP ID or undefined if creation was skipped/failed.
 */
async function tryCreateHealthcareProfessionalForSubmission(
    current: dbSchema.SubmissionRow,
    finalFacilityId: string,
    submissionId: string,
    updatedBy: string
): Promise<string | undefined> {
    /**
     * Only attempt to create an HP if:
     * - The submission is not already linked to an HP (hps_id is null)
     * - We have a facility to associate it with (finalFacilityId)
     */
    if (current.hps_id) {
        return undefined
    }

    let hpInput: gqlTypes.CreateHealthcareProfessionalInput | null = null

    /**
     * Case A: We have healthcare_professionals_partial data.
     * We only look at the first entry for HP creation.
     */
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
        } else if (current.healthcareProfessionalName?.trim()) {
            /**
             * Fallback: partial HP has no names array,
             * but submission still has a healthcareProfessionalName string.
             * We parse "First [Middle] Last" format and build a single LocalizedName.
             */
            const parsed = splitPersonName(current.healthcareProfessionalName.trim())
            const localeFromSubmission = (current.spokenLanguages?.[0] as gqlTypes.Locale)
                ?? gqlTypes.Locale.EnUs

            hpInput = {
                names: [{
                    locale: localeFromSubmission,
                    firstName: parsed.firstName,
                    lastName: parsed.lastName,
                    ...(parsed.middleName ? { middleName: parsed.middleName } : {})
                }],
                degrees: [],
                specialties: [],
                spokenLanguages: sanitizeLocales(
                    current.spokenLanguages as (gqlTypes.Locale | null | undefined)[]
                ),
                acceptedInsurance: [],
                additionalInfoForPatients: current.notes ?? null,
                facilityIds: [finalFacilityId]
            }
        }
    } else if (current.healthcareProfessionalName?.trim()) {
        /**
         * Case B: No partial array, but we do have a free-text name string.
         * Same parsing logic as above, but without partial HP metadata.
         */
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
            spokenLanguages: sanitizeLocales(
                current.spokenLanguages as (gqlTypes.Locale | null | undefined)[]
            ),
            acceptedInsurance: [],
            additionalInfoForPatients: current.notes ?? null,
            facilityIds: [finalFacilityId]
        }
    }

    if (isValidHpInput(hpInput)) {
        const hpRes = await createHealthcareProfessional(hpInput!, updatedBy)

        if (hpRes.hasErrors || !hpRes.data) {
            logger.warn(`approveSubmission: could not create HP for submission ${submissionId}, continuing anyway`)
        } else {
            return hpRes.data.id
        }
    } else {
        logger.info(`approveSubmission: skipping HP creation for submission ${submissionId} due to insufficient data`)
    }

    return undefined
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
    // Tracking variables for rollback
    let originalSubmission: gqlTypes.Submission | null = null
    let createdFacilityId: string | undefined
    let createdHpId: string | undefined

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

        if (current.status === dbSchema.SUBMISSION_STATUS.APPROVED) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{ field: 'status', errorCode: ErrorCode.SUBMISSION_ALREADY_APPROVED, httpStatus: 400 }]
            }
        }

        // Store original state for rollback
        originalSubmission = mapDbEntityTogqlEntity(current as dbSchema.SubmissionRow)

        let finalFacilityId: string | null = current.facilities_id

        /**
         * If the submission is not linked to any Facility yet (facilities_id is null),we must create one.
         * Priority:
         *   a) If facility_partial exists → build a CreateFacilityInput from that.
         *   b) Otherwise → create a minimal "Unknown Facility" using the submission's Google Maps URL.
         */
        if (!finalFacilityId) {
            let facilityInput: gqlTypes.CreateFacilityInput

            if (current.facility_partial) {
                facilityInput = current.facility_partial as gqlTypes.CreateFacilityInput
            } else {
                facilityInput = {
                    // Fallback: create a generic placeholder facility
                    nameEn: 'Unknown Facility',
                    nameJa: 'Unknown Facility',
                    contact: createBlankContact(current.googleMapsUrl ?? ''),
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
            // Track created facility
            createdFacilityId = finalFacilityId
        }

        // Helper for create HP, made for having a complexity less than 40
        if (finalFacilityId) {
            createdHpId = await tryCreateHealthcareProfessionalForSubmission(
                current,
                finalFacilityId,
                submissionId,
                updatedBy
            )
        }

        /**
         *UPDATE SUBMISSION ROW
         * - Mark status = "approved"
         * - Link facilities_id to either:
         *     newly created Facility ID
         *     or the existing one on the submission
         * - Link hps_id if we created an HP (or keep existing)
         * - Refresh updatedDate
         */

        const patch: Partial<dbSchema.SubmissionRow> = {
            status: dbSchema.SUBMISSION_STATUS.APPROVED,
            //eslint-disable-next-line
            facilities_id: createdFacilityId ?? current.facilities_id ?? finalFacilityId,
            //eslint-disable-next-line
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

        // Wrap audit log in try-catch with rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Update,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: originalSubmission,
                newValue: refreshed.data
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for submission ${submissionId} approval: ${auditError}`)
            logger.warn(`Rolling back submission ${submissionId} approval due to audit log failure`)

            // ROLLBACK: Complex rollback
            
            // Delete created HP if exists
            if (createdHpId) {
                await supabase
                    .from('hps')
                    .delete()
                    .eq('id', createdHpId)
                logger.info(`Rolled back HP ${createdHpId}`)
            }

            // Delete created Facility if exists
            if (createdFacilityId) {
                await supabase
                    .from('facilities')
                    .delete()
                    .eq('id', createdFacilityId)
                logger.info(`Rolled back Facility ${createdFacilityId}`)
            }

            // Restore submission original state
            await supabase
                .from('submissions')
                .update({
                    status: originalSubmission.isApproved ? dbSchema.SUBMISSION_STATUS.APPROVED : 
                        originalSubmission.isRejected ? dbSchema.SUBMISSION_STATUS.REJECTED : 
                            originalSubmission.isUnderReview ? dbSchema.SUBMISSION_STATUS.UNDER_REVIEW : dbSchema.SUBMISSION_STATUS.PENDING,
                    //eslint-disable-next-line
                    facilities_id: current.facilities_id,
                    //eslint-disable-next-line
                    hps_id: current.hps_id,
                    updatedDate: originalSubmission.updatedDate
                })
                .eq('id', submissionId)

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

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
    // Tracking variable for rollback
    let deletedSubmission: gqlTypes.Submission | null = null

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

        // Store original state for rollback
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

        deletedSubmission = existing.data

        const supabase = getSupabaseClient()
        
        // Get original row for restore
        const { data: originalRow } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', id)
            .single()

        const { error: delErr } = await supabase
            .from('submissions')
            .delete()
            .eq('id', id)

        if (delErr) {
            throw new Error(`Failed to delete submission: ${delErr.message}`)
        }

        // Wrap audit log in try-catch with rollback
        try {
            await createAuditLogSQL({
                actionType: gqlTypes.ActionType.Delete,
                objectType: gqlTypes.ObjectType.Submission,
                updatedBy,
                oldValue: deletedSubmission
            })
        } catch (auditError) {
            logger.error(`CRITICAL: Audit log failed for deleted submission ${id}: ${auditError}`)
            logger.warn(`Rolling back submission ${id} deletion due to audit log failure`)

            // ROLLBACK: Restore deleted submission
            if (originalRow) {
                await supabase
                    .from('submissions')
                    .insert(originalRow as dbSchema.SubmissionRow)
            }

            throw new Error(`Failed to create audit log: ${auditError}`)
        }

        logger.info(`DB-DELETE: submission ${id} was deleted with audit log`)

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
        isUnderReview: row.status === dbSchema.SUBMISSION_STATUS.UNDER_REVIEW,
        isApproved: row.status === dbSchema.SUBMISSION_STATUS.APPROVED,
        isRejected: row.status === dbSchema.SUBMISSION_STATUS.REJECTED,
        createdDate: row.createdDate,
        updatedDate: row.updatedDate,
        notes: row.notes ?? undefined
    }
}

export function mapGqlEntityToDbEntity(
    input: gqlTypes.CreateSubmissionInput
): dbSchema.SubmissionInsertRow {
    return {
        status: dbSchema.SUBMISSION_STATUS.PENDING,
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
