import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { faker, fakerJA } from '@faker-js/faker'

export function generateRandomCreateHealthcareProfessionalInput(
    { facilityIds }: { facilityIds: string[] } = { facilityIds: [] }
)
    : gqlTypes.CreateHealthcareProfessionalInput {
    return {
        facilityIds: facilityIds,
        names: faker.helpers.multiple(generateLocalizedNameInput, { count: 1 }),
        degrees: faker.helpers.multiple(generateDegreeInput, { count: 1 }),
        specialties: faker.helpers.multiple(generateSpecialty, { count: 1 }),
        spokenLanguages: generateSpokenLanguages(),
        acceptedInsurance: [faker.helpers.enumValue(gqlTypes.Insurance)]
    }
}

export function generateRandomCreateHealthcareProfessionalInputArray({ count = 5 } = {})
    : gqlTypes.CreateHealthcareProfessionalInput[] {
    return faker.helpers.multiple(generateRandomCreateHealthcareProfessionalInput, {
        count: count
    })
}

function generateLocalizedNameInput(): gqlTypes.LocalizedNameInput {
    const randomLocal = faker.helpers.enumValue(gqlTypes.Locale)

    switch (randomLocal) {
        case gqlTypes.Locale.EnUs:
            return {
                firstName: faker.person.firstName(),
                middleName: faker.person.middleName(),
                lastName: faker.person.lastName(),
                locale: randomLocal
            }
        case gqlTypes.Locale.JaJp:
            return {
                firstName: fakerJA.person.firstName(),
                lastName: fakerJA.person.lastName(),
                locale: randomLocal
            }
        default:
            throw new Error(`Unexpected locale value: ${randomLocal}`)
    }
}

function generateDegreeInput(): gqlTypes.DegreeInput {
    return {
        nameEn: faker.person.jobTitle(),
        nameJa: fakerJA.person.jobTitle(),
        abbreviation: faker.person.suffix()
    }
}

function generateSpecialty(): gqlTypes.SpecialtyInput {
    const generateSpecialtyName = (): gqlTypes.SpecialtyNameInput => {
        const locale = faker.helpers.enumValue(gqlTypes.Locale)

        return {
            name: locale == gqlTypes.Locale.EnUs ? faker.person.jobDescriptor() : fakerJA.person.jobDescriptor(),
            locale: locale
        }
    }

    return {
        names: faker.helpers.multiple(generateSpecialtyName, { count: 2 })
    }
}

export function generateSpokenLanguages({ count = 0, onlyEnglish = false } = {}): gqlTypes.Locale[] {
    return onlyEnglish
        ? [gqlTypes.Locale.EnUs]
        : faker.helpers.multiple(
            () => faker.helpers.enumValue(gqlTypes.Locale),
            {
                count: count
                    ? count
                    : faker.number.int({ min: 1, max: 2 })
            }
        )
}
