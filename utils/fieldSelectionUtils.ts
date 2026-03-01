import type { GraphQLResolveInfo, SelectionSetNode } from 'graphql'
import type { HpsTable, SubmissionsTable } from '../src/typeDefs/kyselyTypes.js'

/**
 * Parses GraphQLResolveInfo to extract the set of top-level fields
 * requested by the client. Handles FragmentSpread and InlineFragment.
 */
export function getRequestedFields(info: GraphQLResolveInfo): Set<string> {
    const fields = new Set<string>()

    for (const fieldNode of info.fieldNodes) {
        if (fieldNode.selectionSet) {
            collectFields(fieldNode.selectionSet, info, fields)
        }
    }

    return fields
}

function collectFields(
    selectionSet: SelectionSetNode,
    info: GraphQLResolveInfo,
    fields: Set<string>
): void {
    for (const selection of selectionSet.selections) {
        switch (selection.kind) {
        case 'Field':
            fields.add(selection.name.value)
            break
        case 'FragmentSpread': {
            const fragment = info.fragments[selection.name.value]

            if (fragment) {
                collectFields(fragment.selectionSet, info, fields)
            }
            break
        }
        case 'InlineFragment':
            collectFields(selection.selectionSet, info, fields)
            break
        }
    }
}

/** Returns true if the client requested healthcareProfessionalIds on a Facility */
export function facilityNeedsHpIds(requestedFields: Set<string>): boolean {
    return requestedFields.has('healthcareProfessionalIds')
}

/** Returns true if the client requested facilityIds on a HealthcareProfessional */
export function hpNeedsFacilityIds(requestedFields: Set<string>): boolean {
    return requestedFields.has('facilityIds')
}

/** Converts a camelCase string to snake_case */
export function camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// --- GQL → DB column mappings ---
// Standard fields use camelToSnake automatically. Only non-standard mappings
// (where the DB column name doesn't match the camelToSnake conversion) are
// listed as explicit overrides. Junction-table-only fields (healthcareProfessionalIds,
// facilityIds) are excluded since they have no DB column.

/** GQL fields on the facilities table (all follow camelToSnake convention) */
const FACILITY_GQL_FIELDS = [
    'id', 'nameEn', 'nameJa', 'contact', 'mapLatitude', 'mapLongitude',
    'createdDate', 'updatedDate'
] as const

/** GQL fields on the hps table (all follow camelToSnake convention) */
const HP_GQL_FIELDS = [
    'id', 'names', 'additionalInfoForPatients', 'degrees', 'specialties',
    'spokenLanguages', 'acceptedInsurance', 'email', 'createdDate', 'updatedDate'
] as const

/** JSONB columns on hps that may be used in PostgREST .contains() filters.
 *  Always included in select to avoid PostgREST errors when filtering on non-selected columns. */
const HP_FILTER_COLUMNS: readonly (keyof HpsTable)[] = [
    'degrees', 'specialties', 'spoken_languages', 'accepted_insurance'
]

/** GQL fields on the submissions table that follow camelToSnake convention */
const SUBMISSION_STANDARD_FIELDS = [
    'id', 'createdDate', 'updatedDate', 'googleMapsUrl', 'healthcareProfessionalName',
    'spokenLanguages', 'notes', 'autofillPlaceFromSubmissionUrl'
] as const

/** Submission fields where the DB column doesn't match camelToSnake.
 *  Type-checked against SubmissionsTable to catch schema changes at compile time. */
const SUBMISSION_OVERRIDES = {
    isUnderReview: 'status',
    isApproved: 'status',
    isRejected: 'status',
    facility: 'facility_partial',
    healthcareProfessionals: 'healthcare_professionals_partial'
} as const satisfies Record<string, keyof SubmissionsTable>

/** GQL fields on the user table (all follow camelToSnake convention) */
const USER_GQL_FIELDS = [
    'id', 'displayName', 'profilePicUrl', 'createdDate', 'updatedDate'
] as const

// --- Select string builders ---

/**
 * Builds a select string from requested fields using camelToSnake conversion,
 * with optional explicit overrides for non-standard mappings.
 */
function buildSelectString(
    requestedFields: Set<string>,
    standardFields: readonly string[],
    overrides: Record<string, string> = {},
    alwaysInclude: readonly string[] = ['id']
): string {
    const columns = new Set<string>(alwaysInclude)

    for (const gqlField of standardFields) {
        if (requestedFields.has(gqlField)) {
            columns.add(camelToSnake(gqlField))
        }
    }

    for (const [gqlField, dbColumn] of Object.entries(overrides)) {
        if (requestedFields.has(gqlField)) {
            columns.add(dbColumn)
        }
    }

    return Array.from(columns).join(',')
}

/**
 * Builds a Supabase select string for the facilities table.
 * Always includes 'id'. Only includes columns the client actually requested.
 */
export function buildFacilitySelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields, FACILITY_GQL_FIELDS)
}

/**
 * Builds a Supabase select string for the hps table.
 * Always includes 'id' and all filter-used JSONB columns to avoid PostgREST errors.
 */
export function buildHpSelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields, HP_GQL_FIELDS, {}, ['id', ...HP_FILTER_COLUMNS])
}

/**
 * Builds a Supabase select string for the submissions table.
 * Always includes 'id'. Non-standard mappings (status flags, partials) use explicit overrides.
 */
export function buildSubmissionSelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields, SUBMISSION_STANDARD_FIELDS, SUBMISSION_OVERRIDES)
}

/**
 * Builds a Supabase select string for the user table.
 * Always includes 'id'.
 */
export function buildUserSelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields, USER_GQL_FIELDS)
}
