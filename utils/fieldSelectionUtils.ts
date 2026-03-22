import type { GraphQLResolveInfo, SelectionSetNode } from 'graphql'
import type { HpsTable, SubmissionsTable } from '../src/typeDefs/kyselyTypes.js'

/**
 * Parses GraphQLResolveInfo to extract the set of top-level fields
 * requested by the client. Handles FragmentSpread and InlineFragment.
 * When subField is provided, extracts fields from within that named sub-field
 * (e.g. for wrapper result types like FacilitiesSearchResult).
 */
export function getRequestedFields(info: GraphQLResolveInfo, subField?: string): Set<string> {
    const fields = new Set<string>()

    for (const fieldNode of info.fieldNodes) {
        if (!fieldNode.selectionSet) continue

        if (subField) {
            for (const selection of fieldNode.selectionSet.selections) {
                if (
                    selection.kind === 'Field' &&
                    selection.name.value === subField &&
                    selection.selectionSet
                ) {
                    collectFields(selection.selectionSet, info, fields)
                }
            }
        } else {
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
// By default, any requested GQL field is converted via camelToSnake and selected.
// Only fields that need special handling are listed:
//   - skip: GQL fields with no DB column (junction table fields, nested objects)
//   - overrides: GQL fields where the DB column doesn't follow camelToSnake

/** GQL fields that don't map to a DB column (resolved via junction tables or nested resolvers) */
const FACILITY_SKIP = new Set(['healthcareProfessionalIds'])
const HP_SKIP = new Set(['facilityIds'])

/** JSONB columns on hps that may be used in PostgREST .contains() filters.
 *  Always included in select to avoid PostgREST errors when filtering on non-selected columns. */
const HP_FILTER_COLUMNS: readonly (keyof HpsTable)[] = [
    'degrees', 'specialties', 'spoken_languages', 'accepted_insurance'
]

/** Submission fields where the DB column doesn't match camelToSnake.
 *  Type-checked against SubmissionsTable to catch schema changes at compile time. */
const SUBMISSION_OVERRIDES = {
    isUnderReview: 'status',
    isApproved: 'status',
    isRejected: 'status',
    facility: 'facility_partial',
    healthcareProfessionals: 'healthcare_professionals_partial'
} as const satisfies Record<string, keyof SubmissionsTable>

// --- Select string builders ---

/**
 * Builds a select string from requested GQL fields.
 * By default, converts each field via camelToSnake.
 * Fields in `skip` are ignored. Fields in `overrides` use the mapped DB column instead.
 */
function buildSelectString(
    requestedFields: Set<string>,
    options: {
        skip?: Set<string>,
        overrides?: Record<string, string>,
        alwaysInclude?: readonly string[]
    } = {}
): string {
    const { skip = new Set(), overrides = {}, alwaysInclude = ['id'] } = options
    const columns = new Set<string>(alwaysInclude)

    for (const gqlField of requestedFields) {
        if (skip.has(gqlField)) continue

        if (gqlField in overrides) {
            columns.add(overrides[gqlField])
        } else {
            columns.add(camelToSnake(gqlField))
        }
    }

    return Array.from(columns).join(',')
}

/**
 * Builds a Supabase select string for the facilities table.
 * Always includes 'id'. Only includes columns the client actually requested.
 */
export function buildFacilitySelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields, { skip: FACILITY_SKIP })
}

/**
 * Builds a Supabase select string for the hps table.
 * Always includes 'id' and all filter-used JSONB columns to avoid PostgREST errors.
 */
export function buildHpSelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields, {
        skip: HP_SKIP,
        alwaysInclude: ['id', ...HP_FILTER_COLUMNS]
    })
}

/**
 * Builds a Supabase select string for the submissions table.
 * Always includes 'id'. Non-standard mappings (status flags, partials) use explicit overrides.
 */
export function buildSubmissionSelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields, { overrides: SUBMISSION_OVERRIDES })
}

/**
 * Builds a Supabase select string for the user table.
 * Always includes 'id'.
 */
export function buildUserSelectString(requestedFields: Set<string>): string {
    return buildSelectString(requestedFields)
}
