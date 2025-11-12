import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'


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

    // business rule: always timestamp when the entity is updated
    updatePatch.updatedDate = new Date().toISOString()

    return updatePatch
}

// <B> rappresent the genereic type of Supabase
type HasIlike<B> = {
    ilike: (column: string, pattern: string) => B
}

/**
 * Applies text-based filters to a Supabase query builder for Facilities.
 * Can be reused by both search and count queries.
 *
 * @param facilitySelect - The base query builder instance.
 * @param filters - The facility search filters from GraphQL input.
 * @returns The same query builder instance, modified with applied filters.
 */
export function applyFacilityFilters<B extends HasIlike<B>>(
  facilitySelect: B,
  filters: gqlTypes.FacilitySearchFilters
): B {
    let query = facilitySelect

    // text filters (case-insensitive contains)
    if (filters.nameEn) {
        query = query.ilike('nameEn', `%${filters.nameEn}%`)
    }
    if (filters.nameJa) {
        query = query.ilike('nameJa', `%${filters.nameJa}%`)
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

// Fluent builder type with JSONB `contains` support (PostgREST/Supabase)
type JsonbContainsCapable<B> = {
  contains: (
    column: string,
    // eslint-disable-next-line
    value: string | readonly any[] | Record<string, unknown>
  ) => B
}

// Applies JSONB array filters to an HP query builder (degrees, specialties, languages, insurance).
export function applyHpFilters<B extends JsonbContainsCapable<B>>(
  builder: B,
  filters: gqlTypes.HealthcareProfessionalSearchFilters
): B {
  let query = builder
  if (filters.degrees?.length) query = query.contains('degrees', filters.degrees as gqlTypes.Degree[])
  if (filters.specialties?.length) query = query.contains('specialties', filters.specialties as gqlTypes.Specialty[])
  if (filters.spokenLanguages?.length) query = query.contains('spokenLanguages', filters.spokenLanguages as gqlTypes.Locale[])
  if (filters.acceptedInsurance?.length) query = query.contains('acceptedInsurance', filters.acceptedInsurance as gqlTypes.Insurance[])
  return query
}

export function mapCreateInputToHpInsertRow(
  input: gqlTypes.CreateHealthcareProfessionalInput
): dbSchema.HealthcareProfessionalInsertRow {
    return {
        names: input.names,
        degrees: input.degrees!,
        spokenLanguages: input.spokenLanguages!,
        specialties: input.specialties!,
        acceptedInsurance: input.acceptedInsurance!,
        additionalInfoForPatients: input.additionalInfoForPatients ?? null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    }
}

export function resolveFacilityIdFromRelationships(
  relationss: gqlTypes.Relationship[] | null | undefined
): { newFacilityId: string | null; error?: { field: string; httpStatus: number } } {
    if (!relationss || relationss.length === 0) {
        return {
            newFacilityId: null
        }
    }

    const creates = relationss.filter(relation => relation.action === gqlTypes.RelationshipAction.Create)
    const deletes = relationss.filter(relation => relation.action === gqlTypes.RelationshipAction.Delete)

    if (creates.length > 1) { 
        return {
            newFacilityId: null,
            error: {
                field: 'facilityIds',
                httpStatus: 400
            } 
        }
    }
    if (creates.length === 0 && deletes.length > 0) {
        return { newFacilityId: null, error: { field: 'facilityIds', httpStatus: 400 } }
    }
    if (creates.length === 1) { 
        return {
            newFacilityId: creates[0].otherEntityId
        }
    }
    if (deletes.length > 0) {
        return {
            newFacilityId: null
        }
    }
    return {
        newFacilityId: null
    }
}