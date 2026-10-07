import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
    citiesFromVocabulary,
    isGenericWardLabel,
    meetsPublishedCityBar,
    planFacilityCity,
    reportFacilityCities,
    type WeightedFacilityCity
} from '../src/vocabulary/facilityCityBackfill.js'

const cities = citiesFromVocabulary()

function row(
    prefectureEn: string,
    cityEn: string,
    cityJa: string,
    extras: Partial<WeightedFacilityCity> = {}
): WeightedFacilityCity {
    return {
        weight: 1,
        verificationStatus: 'UNVERIFIED_LOCATION',
        cityId: null,
        prefectureEn,
        cityEn,
        cityJa,
        ...extras
    }
}

describe('planFacilityCity', () => {
    it('rolls a Fukuoka ward up to Fukuoka and rewrites the stored city', () => {
        const plan = planFacilityCity(row('Fukuoka', 'East Ward', '東区'), cities)

        expect(plan).toMatchObject({
            action: 'assign',
            nameEn: 'Fukuoka',
            nameJa: '福岡市',
            rewriteCityNames: true,
            verificationStatus: 'UNVERIFIED',
            fromSlug: 'east-ward',
            toSlug: 'fukuoka'
        })
    })

    it('keeps Tokyo Chuo and Yamanashi Chuo as different cities', () => {
        const tokyo = planFacilityCity(row('Tokyo', 'Chuo City', '中央区'), cities)
        const yamanashi = planFacilityCity(row('Yamanashi', 'Chuo', '中央市'), cities)

        expect(tokyo).toMatchObject({ action: 'assign', nameEn: 'Chuo', nameJa: '中央区' })
        expect(yamanashi).toMatchObject({ action: 'assign', nameEn: 'Chuo', nameJa: '中央市' })
        expect(tokyo.action === 'assign' && yamanashi.action === 'assign'
            && tokyo.cityId !== yamanashi.cityId).toBe(true)
    })

    it('does not guess a bare Osaka north or west ward', () => {
        expect(planFacilityCity(row('Osaka', 'North Ward', '北区'), cities)).toMatchObject({
            action: 'keep',
            reviewReason: 'ambiguous_ward'
        })
        expect(planFacilityCity(row('Osaka', 'West Ward', '西区'), cities)).toMatchObject({
            action: 'keep',
            reviewReason: 'ambiguous_ward'
        })
    })

    it('leaves a language disagreement unresolved', () => {
        expect(planFacilityCity(row('Akita', 'Daisen', '秋田市'), cities)).toMatchObject({
            action: 'keep',
            reviewReason: 'language_disagreement'
        })
    })

    it('does not replace a city a person already chose', () => {
        expect(planFacilityCity(row('Tokyo', 'Minato City', '港区', { cityId: 'already' }), cities)).toEqual({
            action: 'keep',
            reason: 'already_assigned'
        })
    })

    it('counts an already chosen city as mapped', () => {
        const report = reportFacilityCities([
            row('Tokyo', 'Minato City', '港区', { cityId: 'already' }),
            row('Osaka', 'North Ward', '北区')
        ], cities)

        expect(report.total).toBe(2)
        expect(report.mapped).toBe(1)
        expect(report.unmatched).toBe(1)
        expect(report.reviewReasons).toEqual({ ambiguous_ward: 1 })
    })

    it('assigns a confirmed facility without rewriting its stored name', () => {
        const plan = planFacilityCity(row('Fukuoka', 'East Ward', '東区', {
            verificationStatus: 'CONFIRMED'
        }), cities)

        expect(plan).toMatchObject({
            action: 'assign',
            rewriteCityNames: false,
            verificationStatus: 'CONFIRMED',
            nameEn: 'Fukuoka'
        })
    })
})

describe('published facility cities', () => {
    const groups = JSON.parse(readFileSync(
        path.join(import.meta.dirname, 'fixtures', 'facility-city-groups.json'),
        'utf8'
    )) as Array<{
        prefectureEn: string
        cityEn: string
        cityJa: string
        n: number
        addressLine1En?: string
        addressLine1Ja?: string
    }>

    const report = reportFacilityCities(
        groups.map(group => row(group.prefectureEn, group.cityEn, group.cityJa, {
            weight: group.n,
            addressLine1En: group.addressLine1En,
            addressLine1Ja: group.addressLine1Ja
        })),
        cities
    )

    it('maps every facility onto a canonical city', () => {
        expect(report.total).toBe(465)
        expect(report.mapped).toBe(465)
        expect(report.unmatched).toBe(0)
        expect(report.genericPublished).toBe(0)
        expect(meetsPublishedCityBar(report)).toBe(true)
        expect(report.reviewReasons).toEqual({})
        expect(isGenericWardLabel('East Ward')).toBe(true)
        expect(isGenericWardLabel('Fukuoka')).toBe(false)
    })

    it('reports the Tokyo labels after the fold', () => {
        expect(report.tokyo['Minato City']).toBeUndefined()
        expect(report.tokyo.Minato).toBeGreaterThan(0)
        expect(report.tokyo.Shibuya).toBeGreaterThan(0)
        expect(report.tokyo.Chuo).toBeGreaterThan(0)
        expect(Object.keys(report.tokyo).some(label => /ward|city/i.test(label))).toBe(false)
    })

    it('redirects an old ward slug only when every row in that prefecture agrees', () => {
        expect(report.redirects).toContainEqual({ prefecture: 'fukuoka', from: 'east-ward', to: 'fukuoka' })
        expect(report.redirects).toContainEqual({
            prefecture: 'fukuoka',
            from: 'kitakyushu-kokurakita-ward',
            to: 'kitakyushu'
        })
        expect(report.redirects).toContainEqual({ prefecture: 'tokyo', from: 'minato-city', to: 'minato' })
        expect(report.redirects).toContainEqual({ prefecture: 'osaka', from: 'north-ward', to: 'osaka' })
        expect(report.redirects).toContainEqual({ prefecture: 'osaka', from: 'west-ward', to: 'osaka' })
        expect(report.redirects.some(redirect => redirect.prefecture === '')).toBe(false)
    })
})
