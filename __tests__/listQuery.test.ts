import { describe, expect, it } from 'vitest'
import { likeContainsPattern, listQueryValue } from '../src/search/listQuery.js'
import { applyFacilityFilters } from '../src/services/facilityService.js'
import { applyHpFilters } from '../src/services/healthcareProfessionalService.js'

function recordingBuilder() {
    const calls: Array<[string, string]> = []
    const builder = {
        ilike(column: string, pattern: string) {
            calls.push([column, pattern])
            return builder
        },
        or() { return builder },
        contains() { return builder },
        in() { return builder },
        eq() { return builder }
    }

    return { builder, calls }
}

describe('listQueryValue', () => {
    it('treats a blank query as the unfiltered list', () => {
        expect(listQueryValue(undefined)).toBeNull()
        expect(listQueryValue(null)).toBeNull()
        expect(listQueryValue('   ')).toBeNull()
    })

    it('keeps a real query, including the surrounding letters a moderator typed', () => {
        expect(listQueryValue('  Tokyo  ')).toBe('Tokyo')
        expect(likeContainsPattern('100%_clinic')).toBe('%100\\%\\_clinic%')
    })

    it('does not filter a facility or professional list when the query is blank', () => {
        const facilities = recordingBuilder()
        const professionals = recordingBuilder()

        applyFacilityFilters(facilities.builder, { query: '   ' })
        applyHpFilters(professionals.builder, { query: '   ' })

        expect(facilities.calls).toEqual([])
        expect(professionals.calls).toEqual([])

        applyFacilityFilters(facilities.builder, { query: 'Tokyo' })
        applyHpFilters(professionals.builder, { query: 'Ada' })

        expect(facilities.calls).toEqual([['search_text', '%Tokyo%']])
        expect(professionals.calls).toEqual([['search_text', '%Ada%']])
    })
})
