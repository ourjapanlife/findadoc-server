import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { main } from '../utils/backfillFacilityPlaceIds.js'
import { confirmPlaceId, searchPlacePreview } from '../src/places/placesClient.js'

const database = vi.hoisted(() => ({
    connect: vi.fn(), query: vi.fn(), end: vi.fn()
}))

vi.mock('pg', () => ({
    default: {
        Client: class {
            connect = database.connect
            query = database.query
            end = database.end
        }
    }
}))
vi.mock('../src/places/placesClient.js', () => ({
    confirmPlaceId: vi.fn(), searchPlacePreview: vi.fn()
}))

const PLACE_ID = 'ChIJabcdefghijklmnop'
const facility = {
    id: 'facility-id',
    name_en: 'Tokyo Clinic',
    name_ja: '',
    google_maps_url: 'https://www.google.com/maps/place/Tokyo+Clinic/@35.68,139.76,17z'
}

beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.stubEnv('GOOGLE_API_KEY', 'test-key')
    vi.stubEnv('PGPORT', '5432')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    database.query.mockResolvedValueOnce({ rows: [facility] })
    vi.mocked(searchPlacePreview).mockResolvedValue({
        placeId: PLACE_ID, name: 'Tokyo Clinic', address: null, category: null
    })
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
})

describe('backfill write accounting', () => {
    it.each([1, 0, null])('counts only affected rows for rowCount %s', async rowCount => {
        database.query.mockResolvedValueOnce({ rowCount })
        const running = main(true)
        await vi.runAllTimersAsync()
        const counts = await running
        expect(counts.written).toBe(rowCount === 1 ? 1 : 0)
        expect(database.query).toHaveBeenCalledTimes(2)
        expect(database.query).toHaveBeenLastCalledWith(
            expect.stringContaining('where id = $2 and google_place_id is null'),
            [PLACE_ID, facility.id]
        )
        expect(database.end).toHaveBeenCalledOnce()
        expect(confirmPlaceId).not.toHaveBeenCalled()
        expect(searchPlacePreview).toHaveBeenCalledOnce()
    })

    it('counts eligible dry-run records without updating the database', async () => {
        const running = main()
        await vi.runAllTimersAsync()
        expect((await running).written).toBe(1)
        expect(database.query).toHaveBeenCalledOnce()
        // eslint-disable-next-line no-console
        expect(console.log).toHaveBeenCalledWith(`would write ${facility.id} ${PLACE_ID}`)
        expect(database.end).toHaveBeenCalledOnce()
    })
})
