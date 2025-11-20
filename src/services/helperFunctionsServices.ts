import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'

// Capabilities for Supabase-like query builders
export type HasIlike = {
    ilike: (column: string, pattern: string) => unknown
}

export type HasContains = {
    contains: (
        column: string,
        //eslint-disable-next-line
        value: string | readonly any[] | Record<string, unknown>
    ) => unknown
}

export type HasEq = {
    eq: (column: string, value: unknown) => unknown
}

export type SupabaseFilterBuilder = HasIlike & HasContains & HasEq

/** 
*===================================
*- Facility section helpers function
*===================================
*/
// Builds a partial update patch for Facility rows.
export function buildFacilityUpdatePatch(fields: Partial<gqlTypes.UpdateFacilityInput>) {
    const updatePatch: Record<string, unknown> = {}

    // Map only requested field
    if (fields.nameEn !== undefined) {
        updatePatch.nameEn = fields.nameEn
    }
    if (fields.nameJa !== undefined) {
        updatePatch.nameJa = fields.nameJa
    }
    if (fields.contact !== undefined) {
        updatePatch.contact = fields.contact
    }
    if (fields.mapLatitude !== undefined) {
        updatePatch.mapLatitude = fields.mapLatitude
    }
    if (fields.mapLongitude !== undefined) {
        updatePatch.mapLongitude = fields.mapLongitude
    }

    // Business rule: always timestamp when the entity is updated
    updatePatch.updatedDate = new Date().toISOString()

    return updatePatch
}

/**
 * Applies text-based filters to a Supabase query builder for Facilities.
 * Can be reused by both search and count queries.
 *
 * @param facilitySelect - The base query builder instance.
 * @param filters - The facility search filters from GraphQL input.
 * @returns The same query builder instance, modified with applied filters.
 */
export function applyFacilityFilters<B extends HasIlike>(
  facilitySelect: B,
  filters: gqlTypes.FacilitySearchFilters
): B {
    let query = facilitySelect

    // Text filters (case-insensitive contains)
    if (filters.nameEn) {
        query = query.ilike('nameEn', `%${filters.nameEn}%`) as B
    }
    if (filters.nameJa) {
        query = query.ilike('nameJa', `%${filters.nameJa}%`) as B
    }

    return query
}

/** 
*===================================
*- HP section helpers function
*===================================
*/

// Builds a partial update patch for Healthcare Professional rows.
export function buildHpUpdatePatch(fields: Partial<gqlTypes.UpdateHealthcareProfessionalInput>) {
    const updatePatch: Partial<dbSchema.DbHealthcareProfessionalRow> = {}

    if (fields.names !== null) { updatePatch.names = fields.names }
    if (fields.degrees !== null) { updatePatch.degrees = fields.degrees }
    if (fields.spokenLanguages !== null) { updatePatch.spokenLanguages = fields.spokenLanguages }
    if (fields.specialties !== null) { updatePatch.specialties = fields.specialties }
    if (fields.acceptedInsurance !== null) { updatePatch.acceptedInsurance = fields.acceptedInsurance }
    if (fields.additionalInfoForPatients !== undefined) {
        updatePatch.additionalInfoForPatients = fields.additionalInfoForPatients
    }
    updatePatch.updatedDate = new Date().toISOString()
    return updatePatch
}

// Applies JSONB array filters to an HP query builder (degrees, specialties, languages, insurance).
export function applyHpFilters<B extends HasContains>(
  builder: B,
  filters: gqlTypes.HealthcareProfessionalSearchFilters
): B {
    let query = builder

    if (filters.degrees?.length) { query = query.contains('degrees', filters.degrees as gqlTypes.Degree[]) as B }
    if (filters.specialties?.length) { query = query.contains('specialties', filters.specialties as gqlTypes.Specialty[]) as B }
    if (filters.spokenLanguages?.length) { query = query.contains('spokenLanguages', filters.spokenLanguages as gqlTypes.Locale[]) as B }
    if (filters.acceptedInsurance?.length) { query = query.contains('acceptedInsurance', filters.acceptedInsurance as gqlTypes.Insurance[]) as B }
    return query
}

// Maps GQL Create input → DB insert row; defaults arrays to [] to avoid `!`.
export function mapCreateInputToHpInsertRow(
  input: gqlTypes.CreateHealthcareProfessionalInput
): dbSchema.HealthcareProfessionalInsertRow {
    return {
        names: input.names,
        degrees: input.degrees ?? [],
        spokenLanguages: input.spokenLanguages ?? [],
        specialties: input.specialties ?? [],
        acceptedInsurance: input.acceptedInsurance ?? [],
        additionalInfoForPatients: input.additionalInfoForPatients ?? null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    }
}

// Derives the facilityId to associate from relationship edits (create/delete).
export function resolveFacilityIdFromRelationships(
  relations: gqlTypes.Relationship[] | null | undefined
): { newFacilityId: string | null; error?: { field: string; httpStatus: number } } {
    if (!relations || relations.length === 0) {
        return {
            newFacilityId: null
        }
    }

    const creations = relations.filter(relation => relation.action === gqlTypes.RelationshipAction.Create)
    const deletions = relations.filter(relation => relation.action === gqlTypes.RelationshipAction.Delete)

    if (creations.length > 1) { 
        return {
            newFacilityId: null,
            error: {
                field: 'facilityIds',
                httpStatus: 400
            } 
        }
    }
    if (creations.length === 0 && deletions.length > 0) {
        return { newFacilityId: null, error: { field: 'facilityIds', httpStatus: 400 } }
    }
    if (creations.length === 1) { 
        return {
            newFacilityId: creations[0].otherEntityId
        }
    }
    if (deletions.length > 0) {
        return {
            newFacilityId: null
        }
    }
    return {
        newFacilityId: null
    }
}

/** 
*===================================
*- Submissions section helpers function
*===================================
*/

/**
 * Builds a minimal, empty address object.
 * Used when a submission does not contain address details,
 * but a complete shape is required to avoid null references.
 */
export function createBlankAddress(): gqlTypes.PhysicalAddressInput {
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

export function createBlankContact(googleMapsUrl?: string): gqlTypes.ContactInput {
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
export function sanitizeLocales(locales: (gqlTypes.Locale | null | undefined)[] | null | undefined): gqlTypes.Locale[] {
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
export function splitPersonName(full: string): { firstName: string; lastName: string; middleName?: string } {
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
export function applySubmissionQueryFilters<B extends Record<string, any>>(
  queryBuilder: B,
  filters: gqlTypes.SubmissionSearchFilters
): B {
    let query = queryBuilder

    // Apply case-insensitive partial match on googleMapsUrl
    if (filters.googleMapsUrl) {
        query = query.ilike('googleMapsUrl', `%${filters.googleMapsUrl}%`) as B
    }

    if (filters.healthcareProfessionalName) {
        query = query.ilike(
            'healthcareProfessionalName',
            `%${filters.healthcareProfessionalName}%`
        ) as B
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
        query = query.eq('status', requestedStatuses[0]) as B
    }

    if (filters.createdDate) {
        query = query.eq('createdDate', filters.createdDate) as B
    }

    if (filters.updatedDate) {
        query = query.eq('updatedDate', filters.updatedDate) as B
    }

    return query
}