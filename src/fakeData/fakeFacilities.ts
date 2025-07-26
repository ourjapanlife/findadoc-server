import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { faker, fakerJA } from '@faker-js/faker'
import { randomPrefecture } from '../../utils/japanesePrefectures.js'

export function generateRandomCreateFacilityInput(healthcareProfessionalIds?: string[])
    : gqlTypes.CreateFacilityInput {
    const sex = faker.person.sexType()
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const fullEnglishName = faker.person.fullName({ firstName, lastName, sex })
    const email = faker.internet.email({ firstName: fullEnglishName })
    const firstNameJa = fakerJA.person.lastName()
    const lastNameJa = fakerJA.person.lastName()
    const fullJapaneseName = fakerJA.person.fullName({ firstName: firstNameJa, lastName: lastNameJa, sex })

    const { en: prefectureEn, ja: prefectureJa } = randomPrefecture()

    return {
        nameEn: fullEnglishName,
        nameJa: fullJapaneseName,
        mapLatitude: faker.location.latitude(), 
        mapLongitude: faker.location.longitude(),
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
                cityEn: faker.location.city(),
                cityJa: fakerJA.location.city(),
                postalCode: faker.location.zipCode(),
                prefectureEn: prefectureEn,
                prefectureJa: prefectureJa
            }
        }
    }
}

export function generateRandomCreateFacilityInputArray(count: number = 5): gqlTypes.CreateFacilityInput[] {
    return faker.helpers.multiple(generateRandomCreateFacilityInput, {
        count: count
    })
}
