import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('separate lookup budgets', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-10-10T00:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it.each(['public', 'moderator'] as const)(
        'keeps the other budget available when %s exhausts its global budget',
        async budget => {
            const { allowSharedPreviewCall, allowModeratorPreviewCall } = await import('../src/places/mapsLink.js')
            const exhausted = budget === 'public' ? allowSharedPreviewCall : allowModeratorPreviewCall
            const other = budget === 'public' ? allowModeratorPreviewCall : allowSharedPreviewCall
            for (let index = 0; index < 30; index++) {
                expect(exhausted(`ip-${index}`)).toBe(true)
            }
            expect(exhausted('another-ip')).toBe(false)
            expect(other('another-ip')).toBe(true)
            vi.advanceTimersByTime(59999)
            expect(exhausted('another-ip')).toBe(false)
            vi.advanceTimersByTime(1)
            expect(exhausted('another-ip')).toBe(true)
        }
    )

    it.each([['public', 8], ['moderator', 20]] as const)(
        'enforces the %s per-IP limit and ten-minute window',
        async (budget, limit) => {
            const { allowSharedPreviewCall, allowModeratorPreviewCall } = await import('../src/places/mapsLink.js')
            const allow = budget === 'public' ? allowSharedPreviewCall : allowModeratorPreviewCall
            for (let index = 0; index < limit; index++) {
                expect(allow('same-ip')).toBe(true)
            }
            expect(allow('same-ip')).toBe(false)
            expect(allow('other-ip')).toBe(true)
            vi.advanceTimersByTime(599999)
            expect(allow('same-ip')).toBe(false)
            vi.advanceTimersByTime(1)
            expect(allow('same-ip')).toBe(true)
        }
    )
})
