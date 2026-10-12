import { describe, expect, it } from 'vitest'
import { matchingFacilityId, type FacilityMapIdentity } from '../src/places/facilityMapsMatch.js'

const aOne: FacilityMapIdentity = {
    id: 'a-one',
    nameEn: 'A-ONE Dental Clinic',
    nameJa: 'A-ONE 歯科クリニック',
    latitude: 35.7140477,
    longitude: 139.6668954
}

const kamitakada: FacilityMapIdentity = {
    id: 'kamitakada',
    nameEn: 'Kamitakada',
    nameJa: '上高田診療所',
    latitude: 35.72,
    longitude: 139.67
}

const iphoneLabel = '〒164-0002 Tokyo, Nakano City, Kamitakada, 2 Chome−57−3 サンシャイン富士 A-ONE歯科クリニック'

describe('matchingFacilityId', () => {
    it('matches the clinic whose name is written into an iPhone Maps link', () => {
        expect(matchingFacilityId(
            { name: iphoneLabel, latitude: null, longitude: null },
            [kamitakada, aOne]
        )).toBe('a-one')
    })

    it('matches a search link by the English name and the stored pin', () => {
        expect(matchingFacilityId(
            { name: 'A-ONE Dental Clinic', latitude: 35.71405, longitude: 139.6669 },
            [aOne, kamitakada]
        )).toBe('a-one')
    })

    it('does not guess when the name and the pin point at different clinics', () => {
        const otherPin = { ...aOne, latitude: 35.8, longitude: 139.8 }
        expect(matchingFacilityId(
            { name: 'A-ONE Dental Clinic', latitude: 35.72, longitude: 139.67 },
            [otherPin, kamitakada]
        )).toBeNull()
    })

    it('ignores a pin at 0,0', () => {
        const unset = { ...aOne, latitude: 0, longitude: 0 }
        expect(matchingFacilityId(
            { name: null, latitude: 0, longitude: 0 },
            [unset]
        )).toBeNull()
    })
})
