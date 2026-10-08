import { db } from '../kyselyClient.js'
import { ErrorCode, Result } from '../result.js'
import { logger } from '../logger.js'
import { resolvePrefectureKey } from '../../utils/japanesePrefectures.js'
import type { City, Prefecture } from '../typeDefs/gqlTypes.js'

type CityRow = {
    id: string
    slug: string
    name_en: string
    name_ja: string
    lg_code: string
    google_place_id: string | null
    prefecture_id: string
    prefecture_slug: string
    prefecture_name_en: string
    prefecture_name_ja: string
}

function mapCity(row: CityRow): City {
    const prefecture: Prefecture = {
        id: row.prefecture_id,
        slug: row.prefecture_slug,
        nameEn: row.prefecture_name_en,
        nameJa: row.prefecture_name_ja
    }

    return {
        id: row.id,
        slug: row.slug,
        nameEn: row.name_en,
        nameJa: row.name_ja,
        localGovernmentCode: row.lg_code,
        googlePlaceId: row.google_place_id,
        prefecture
    }
}

function cityQuery() {
    return db.selectFrom('cities')
        .innerJoin('prefectures', 'prefectures.id', 'cities.prefecture_id')
        .select([
            'cities.id as id',
            'cities.slug as slug',
            'cities.name_en as name_en',
            'cities.name_ja as name_ja',
            'cities.lg_code as lg_code',
            'cities.google_place_id as google_place_id',
            'prefectures.id as prefecture_id',
            'prefectures.slug as prefecture_slug',
            'prefectures.name_en as prefecture_name_en',
            'prefectures.name_ja as prefecture_name_ja'
        ])
}

export async function listPrefectures(): Promise<Result<Prefecture[]>> {
    try {
        const rows = await db.selectFrom('prefectures')
            .select(['id', 'slug', 'name_en', 'name_ja'])
            .orderBy('name_en')
            .execute()

        return {
            data: rows.map(row => ({
                id: row.id,
                slug: row.slug,
                nameEn: row.name_en,
                nameJa: row.name_ja
            })),
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: listPrefectures ${error}`)
        return {
            data: [],
            hasErrors: true,
            errors: [{ field: 'prefectures', errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
        }
    }
}

export async function listCities(prefecture?: string | null): Promise<Result<City[]>> {
    try {
        let prefectureKey: string | undefined

        if (prefecture?.trim()) {
            prefectureKey = resolvePrefectureKey(prefecture)

            if (!prefectureKey) {
                return {
                    data: [],
                    hasErrors: true,
                    errors: [{ field: 'prefecture', errorCode: ErrorCode.INVALID_INPUT, httpStatus: 400 }]
                }
            }
        }

        let query = cityQuery().orderBy('cities.name_en')

        if (prefectureKey) {
            query = query.where('prefectures.name_en', '=', prefectureKey)
        }

        const rows = await query.execute()

        return { data: rows.map(row => mapCity(row)), hasErrors: false }
    } catch (error) {
        logger.error(`ERROR: listCities ${error}`)
        return {
            data: [],
            hasErrors: true,
            errors: [{ field: 'cities', errorCode: ErrorCode.SERVER_ERROR, httpStatus: 500 }]
        }
    }
}

export async function getCityById(id: string): Promise<City | null> {
    const row = await cityQuery().where('cities.id', '=', id).executeTakeFirst()

    return row ? mapCity(row) : null
}

export async function cityExists(id: string): Promise<boolean> {
    const row = await db.selectFrom('cities').select('id').where('id', '=', id).executeTakeFirst()

    return Boolean(row)
}

export async function findCityBySlug(prefecture: string, citySlug: string): Promise<Result<City | null>> {
    const prefectureKey = resolvePrefectureKey(prefecture)

    if (!prefectureKey) {
        return {
            data: null,
            hasErrors: true,
            errors: [{ field: 'prefecture', errorCode: ErrorCode.INVALID_INPUT, httpStatus: 400 }]
        }
    }

    const row = await cityQuery()
        .where('prefectures.name_en', '=', prefectureKey)
        .where('cities.slug', '=', citySlug.trim().toLowerCase())
        .executeTakeFirst()

    return { data: row ? mapCity(row) : null, hasErrors: false }
}

export type CityPlaceRecord = {
    id: string
    nameEn: string
    nameJa: string
    prefectureEn: string
    prefectureJa: string
    googlePlaceId: string | null
    googlePlaceIdCheckedAt: string | null
}

export async function listCityPlaceRecords(): Promise<CityPlaceRecord[]> {
    const rows = await db.selectFrom('cities')
        .innerJoin('prefectures', 'prefectures.id', 'cities.prefecture_id')
        .select([
            'cities.id as id',
            'cities.name_en as name_en',
            'cities.name_ja as name_ja',
            'cities.google_place_id as google_place_id',
            'cities.google_place_id_checked_at as google_place_id_checked_at',
            'prefectures.name_en as prefecture_name_en',
            'prefectures.name_ja as prefecture_name_ja'
        ])
        .execute()

    return rows.map(row => ({
        id: row.id,
        nameEn: row.name_en,
        nameJa: row.name_ja,
        prefectureEn: row.prefecture_name_en,
        prefectureJa: row.prefecture_name_ja,
        googlePlaceId: row.google_place_id,
        googlePlaceIdCheckedAt: row.google_place_id_checked_at
            ? new Date(row.google_place_id_checked_at).toISOString()
            : null
    }))
}

/** Writes the place id only. Pass a timestamp after a successful id check. */
export async function setCityPlaceId(
    cityId: string,
    placeId: string,
    checkedAt: string | null
): Promise<City | null> {
    const updated = await db.updateTable('cities')
        .set({
            google_place_id: placeId,
            google_place_id_checked_at: checkedAt
        })
        .where('id', '=', cityId)
        .returning('id')
        .executeTakeFirst()

    if (!updated) { return null }
    return getCityById(cityId)
}

export async function clearCityPlaceId(cityId: string): Promise<void> {
    await db.updateTable('cities')
        .set({
            google_place_id: null,
            google_place_id_checked_at: null
        })
        .where('id', '=', cityId)
        .execute()
}
