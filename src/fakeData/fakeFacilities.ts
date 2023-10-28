import * as gqlTypes from '../typeDefs/gqlTypes'
import { faker, fakerJA } from '@faker-js/faker'

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

    return {
        nameEn: fullEnglishName,
        nameJa: fullJapaneseName,
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
                prefectureEn: faker.location.state(),
                prefectureJa: fakerJA.location.state()
            }
        }
    }
}

export function generateRandomCreateFacilityInputArray(count: number = 5): gqlTypes.CreateFacilityInput[] {
    return faker.helpers.multiple(generateRandomCreateFacilityInput, {
        count: count
    })
}
