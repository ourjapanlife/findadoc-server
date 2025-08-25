import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { faker, fakerJA } from '@faker-js/faker'

export function generateRandomCreateFacilityInput(healthcareProfessionalIds?: string[])
    : gqlTypes.CreateFacilityInput {
    const fullEnglishName = faker.company.name()
    const email = faker.internet.email({ firstName: fullEnglishName })
    const fullJapaneseName = fakerJA.company.name()

    // Select random location from Tokyo, Kyoto, or Hokkaido
    const locations = [
        {
            cityEn: 'Tokyo',
            cityJa: '東京',
            prefectureEn: 'Tokyo',
            prefectureJa: '東京都',
            latMin: 35.6,
            latMax: 35.8,
            lngMin: 139.3,
            lngMax: 139.9,
            postalCodePattern: /1[0-9]{2}-[0-9]{4}/
        },
        {
            cityEn: 'Kyoto',
            cityJa: '京都',
            prefectureEn: 'Kyoto',
            prefectureJa: '京都府',
            latMin: 35.0,
            latMax: 35.1,
            lngMin: 135.7,
            lngMax: 135.8,
            postalCodePattern: /6[0-9]{2}-[0-9]{4}/
        },
        {
            cityEn: 'Sapporo',
            cityJa: '札幌',
            prefectureEn: 'Hokkaido',
            prefectureJa: '北海道',
            latMin: 43.0,
            latMax: 43.1,
            lngMin: 141.3,
            lngMax: 141.4,
            postalCodePattern: /0[0-9]{2}-[0-9]{4}/
        }
    ]

    const selectedLocation = faker.helpers.arrayElement(locations)

    return {
        nameEn: fullEnglishName,
        nameJa: fullJapaneseName,
        mapLatitude: faker.location.latitude({ min: selectedLocation.latMin, max: selectedLocation.latMax }),
        mapLongitude: faker.location.longitude({ min: selectedLocation.lngMin, max: selectedLocation.lngMax }),
        healthcareProfessionalIds: healthcareProfessionalIds ?? [],
        contact: {
            googleMapsUrl: faker.internet.url(),
            email: email,
            phone: faker.phone.number().replace(/-/g, ''),
            website: faker.internet.url(),
            address: {
                addressLine1En: faker.location.streetAddress(),
                addressLine2En: faker.location.secondaryAddress(),
                addressLine1Ja: fakerJA.location.streetAddress(),
                addressLine2Ja: fakerJA.location.secondaryAddress(),
                cityEn: selectedLocation.cityEn,
                cityJa: selectedLocation.cityJa,
                postalCode: faker.helpers.fromRegExp(selectedLocation.postalCodePattern),
                prefectureEn: selectedLocation.prefectureEn,
                prefectureJa: selectedLocation.prefectureJa
            }
        }
    }
}

export function generateRandomCreateFacilityInputArray({ count }: { count?: number } = { count: 30 })
    : gqlTypes.CreateFacilityInput[] {
    return faker.helpers.multiple(generateRandomCreateFacilityInput, {
        count
    })
}
