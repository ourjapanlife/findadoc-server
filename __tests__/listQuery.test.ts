import { describe, expect, it } from 'vitest'
import { likeContainsPattern, listQueryValue } from '../src/search/listQuery.js'

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
})
