import { describe, it, expect } from 'vitest'
import type { GraphQLResolveInfo, FieldNode, SelectionSetNode, FragmentDefinitionNode } from 'graphql'
import {
    getRequestedFields,
    facilityNeedsHpIds,
    hpNeedsFacilityIds,
    camelToSnake,
    buildFacilitySelectString,
    buildHpSelectString,
    buildSubmissionSelectString,
    buildUserSelectString
} from '../utils/fieldSelectionUtils'

// Helper to build a minimal GraphQLResolveInfo-like object for testing
function buildMockInfo(
    fieldNames: string[],
    fragments?: Record<string, { fields: string[] }>
): GraphQLResolveInfo {
    const selections = fieldNames.map(name => ({
        kind: 'Field' as const,
        name: { kind: 'Name' as const, value: name }
    }))

    const fragmentDefinitions: Record<string, FragmentDefinitionNode> = {}

    if (fragments) {
        for (const [fragName, fragDef] of Object.entries(fragments)) {
            fragmentDefinitions[fragName] = {
                kind: 'FragmentDefinition' as const,
                name: { kind: 'Name' as const, value: fragName },
                typeCondition: {
                    kind: 'NamedType' as const,
                    name: { kind: 'Name' as const, value: 'SomeType' }
                },
                selectionSet: {
                    kind: 'SelectionSet' as const,
                    selections: fragDef.fields.map(f => ({
                        kind: 'Field' as const,
                        name: { kind: 'Name' as const, value: f }
                    }))
                }
            } as FragmentDefinitionNode
        }
    }

    return {
        fieldNodes: [{
            kind: 'Field' as const,
            name: { kind: 'Name' as const, value: 'root' },
            selectionSet: {
                kind: 'SelectionSet' as const,
                selections
            } as SelectionSetNode
        } as FieldNode],
        fragments: fragmentDefinitions
    } as unknown as GraphQLResolveInfo
}

function buildMockInfoWithFragmentSpread(
    directFields: string[],
    fragmentName: string,
    fragmentFields: string[]
): GraphQLResolveInfo {
    const directSelections = directFields.map(name => ({
        kind: 'Field' as const,
        name: { kind: 'Name' as const, value: name }
    }))

    const fragmentSpread = {
        kind: 'FragmentSpread' as const,
        name: { kind: 'Name' as const, value: fragmentName }
    }

    const fragmentDefinitions: Record<string, FragmentDefinitionNode> = {
        [fragmentName]: {
            kind: 'FragmentDefinition' as const,
            name: { kind: 'Name' as const, value: fragmentName },
            typeCondition: {
                kind: 'NamedType' as const,
                name: { kind: 'Name' as const, value: 'SomeType' }
            },
            selectionSet: {
                kind: 'SelectionSet' as const,
                selections: fragmentFields.map(f => ({
                    kind: 'Field' as const,
                    name: { kind: 'Name' as const, value: f }
                }))
            }
        } as FragmentDefinitionNode
    }

    return {
        fieldNodes: [{
            kind: 'Field' as const,
            name: { kind: 'Name' as const, value: 'root' },
            selectionSet: {
                kind: 'SelectionSet' as const,
                selections: [...directSelections, fragmentSpread]
            } as SelectionSetNode
        } as FieldNode],
        fragments: fragmentDefinitions
    } as unknown as GraphQLResolveInfo
}

function buildMockInfoWithInlineFragment(
    directFields: string[],
    inlineFragmentFields: string[]
): GraphQLResolveInfo {
    const directSelections = directFields.map(name => ({
        kind: 'Field' as const,
        name: { kind: 'Name' as const, value: name }
    }))

    const inlineFragment = {
        kind: 'InlineFragment' as const,
        selectionSet: {
            kind: 'SelectionSet' as const,
            selections: inlineFragmentFields.map(f => ({
                kind: 'Field' as const,
                name: { kind: 'Name' as const, value: f }
            }))
        }
    }

    return {
        fieldNodes: [{
            kind: 'Field' as const,
            name: { kind: 'Name' as const, value: 'root' },
            selectionSet: {
                kind: 'SelectionSet' as const,
                selections: [...directSelections, inlineFragment]
            } as SelectionSetNode
        } as FieldNode],
        fragments: {}
    } as unknown as GraphQLResolveInfo
}

// --- getRequestedFields ---

describe('getRequestedFields', () => {
    it('extracts direct field selections', () => {
        const info = buildMockInfo(['id', 'nameEn', 'nameJa'])
        const fields = getRequestedFields(info)

        expect(fields).toEqual(new Set(['id', 'nameEn', 'nameJa']))
    })

    it('handles FragmentSpread', () => {
        const info = buildMockInfoWithFragmentSpread(
            ['id'],
            'FacilityFields',
            ['nameEn', 'contact']
        )
        const fields = getRequestedFields(info)

        expect(fields).toEqual(new Set(['id', 'nameEn', 'contact']))
    })

    it('handles InlineFragment', () => {
        const info = buildMockInfoWithInlineFragment(
            ['id'],
            ['nameJa', 'mapLatitude']
        )
        const fields = getRequestedFields(info)

        expect(fields).toEqual(new Set(['id', 'nameJa', 'mapLatitude']))
    })

    it('deduplicates fields from multiple sources', () => {
        const info = buildMockInfoWithFragmentSpread(
            ['id', 'nameEn'],
            'Extra',
            ['id', 'nameEn', 'contact']
        )
        const fields = getRequestedFields(info)

        expect(fields).toEqual(new Set(['id', 'nameEn', 'contact']))
    })
})

// --- Relationship flag helpers ---

describe('facilityNeedsHpIds', () => {
    it('returns true when healthcareProfessionalIds is requested', () => {
        expect(facilityNeedsHpIds(new Set(['id', 'nameEn', 'healthcareProfessionalIds']))).toBe(true)
    })

    it('returns false when healthcareProfessionalIds is not requested', () => {
        expect(facilityNeedsHpIds(new Set(['id', 'nameEn']))).toBe(false)
    })
})

describe('hpNeedsFacilityIds', () => {
    it('returns true when facilityIds is requested', () => {
        expect(hpNeedsFacilityIds(new Set(['id', 'names', 'facilityIds']))).toBe(true)
    })

    it('returns false when facilityIds is not requested', () => {
        expect(hpNeedsFacilityIds(new Set(['id', 'names']))).toBe(false)
    })
})

// --- camelToSnake ---

describe('camelToSnake', () => {
    it('converts camelCase to snake_case', () => {
        expect(camelToSnake('nameEn')).toBe('name_en')
        expect(camelToSnake('mapLatitude')).toBe('map_latitude')
        expect(camelToSnake('createdDate')).toBe('created_date')
    })

    it('handles single-word fields', () => {
        expect(camelToSnake('id')).toBe('id')
        expect(camelToSnake('email')).toBe('email')
        expect(camelToSnake('contact')).toBe('contact')
    })

    it('handles multiple uppercase letters', () => {
        expect(camelToSnake('googleMapsUrl')).toBe('google_maps_url')
        expect(camelToSnake('additionalInfoForPatients')).toBe('additional_info_for_patients')
    })
})

// --- buildFacilitySelectString ---

describe('buildFacilitySelectString', () => {
    it('always includes id', () => {
        const result = buildFacilitySelectString(new Set<string>())

        expect(result).toBe('id')
    })

    it('includes only requested columns', () => {
        const result = buildFacilitySelectString(new Set(['id', 'nameEn', 'contact']))
        const columns = result.split(',')

        expect(columns).toContain('id')
        expect(columns).toContain('name_en')
        expect(columns).toContain('contact')
        expect(columns).not.toContain('name_ja')
        expect(columns).not.toContain('map_latitude')
    })

    it('ignores non-facility fields like healthcareProfessionalIds', () => {
        const result = buildFacilitySelectString(new Set(['id', 'healthcareProfessionalIds']))
        const columns = result.split(',')

        expect(columns).toContain('id')
        expect(columns).not.toContain('healthcare_professional_ids')
    })
})

// --- buildHpSelectString ---

describe('buildHpSelectString', () => {
    it('always includes id and filter JSONB columns', () => {
        const result = buildHpSelectString(new Set<string>())
        const columns = result.split(',')

        expect(columns).toContain('id')
        expect(columns).toContain('degrees')
        expect(columns).toContain('specialties')
        expect(columns).toContain('spoken_languages')
        expect(columns).toContain('accepted_insurance')
    })

    it('includes requested columns beyond the filter defaults', () => {
        const result = buildHpSelectString(new Set(['id', 'names', 'email']))
        const columns = result.split(',')

        expect(columns).toContain('id')
        expect(columns).toContain('names')
        expect(columns).toContain('email')
        // filter columns always present
        expect(columns).toContain('degrees')
        expect(columns).toContain('specialties')
    })

    it('ignores non-hp fields like facilityIds', () => {
        const result = buildHpSelectString(new Set(['id', 'facilityIds']))
        const columns = result.split(',')

        expect(columns).not.toContain('facility_ids')
    })
})

// --- buildSubmissionSelectString ---

describe('buildSubmissionSelectString', () => {
    it('always includes id', () => {
        const result = buildSubmissionSelectString(new Set<string>())

        expect(result).toBe('id')
    })

    it('maps status flags to the status column', () => {
        const result = buildSubmissionSelectString(new Set(['id', 'isUnderReview', 'isApproved', 'isRejected']))
        const columns = result.split(',')

        expect(columns).toContain('id')
        expect(columns).toContain('status')
        // status should appear only once due to Set deduplication
        expect(columns.filter(c => c === 'status')).toHaveLength(1)
    })

    it('maps facility and healthcareProfessionals to partial columns', () => {
        const result = buildSubmissionSelectString(new Set(['id', 'facility', 'healthcareProfessionals']))
        const columns = result.split(',')

        expect(columns).toContain('facility_partial')
        expect(columns).toContain('healthcare_professionals_partial')
    })

    it('uses camelToSnake for standard fields', () => {
        const result = buildSubmissionSelectString(new Set(['id', 'googleMapsUrl', 'createdDate']))
        const columns = result.split(',')

        expect(columns).toContain('google_maps_url')
        expect(columns).toContain('created_date')
    })
})

// --- buildUserSelectString ---

describe('buildUserSelectString', () => {
    it('always includes id', () => {
        const result = buildUserSelectString(new Set<string>())

        expect(result).toBe('id')
    })

    it('includes only requested columns', () => {
        const result = buildUserSelectString(new Set(['id', 'displayName', 'profilePicUrl']))
        const columns = result.split(',')

        expect(columns).toContain('id')
        expect(columns).toContain('display_name')
        expect(columns).toContain('profile_pic_url')
    })

    it('does not include unrequested columns', () => {
        const result = buildUserSelectString(new Set(['id', 'displayName']))
        const columns = result.split(',')

        expect(columns).toContain('display_name')
        expect(columns).not.toContain('profile_pic_url')
        expect(columns).not.toContain('created_date')
    })
})
