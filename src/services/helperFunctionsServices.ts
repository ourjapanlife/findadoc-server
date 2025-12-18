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
