import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { faker, fakerJA } from '@faker-js/faker'
import { logger } from '../logger.js'

export function generateRandomCreateHealthcareProfessionalInput(
    { facilityIds }: { facilityIds: string[] } = { facilityIds: [] }
)
    : gqlTypes.CreateHealthcareProfessionalInput {
    return {
        facilityIds: facilityIds,
        names: faker.helpers.multiple(generateLocalizedNameInput, { count: 1 }),
        degrees: generateDegrees(),
        specialties: generateSpecialties(),
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

export function generateLocalizedNameInput(): gqlTypes.LocalizedNameInput {
    const randomLocal = faker.number.int({ min: 1, max: 10 }) < 5 ? gqlTypes.Locale.EnUs : gqlTypes.Locale.JaJp 

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
            logger.error(`Generating professional name: Unexpected locale value: ${randomLocal}`)
            throw new Error(`Generating professional name: Unexpected locale value: ${randomLocal}`)
    }
}

export function generateDegrees({ count = 2 } = {}): gqlTypes.Degree[] {
    return faker.helpers.multiple(
        () => faker.helpers.enumValue(gqlTypes.Degree),
        {
            count: count
                ? count
                : faker.number.int({ min: 1, max: 2 })
        }

    )
}

export function generateSpecialties({ count = 2 } = {}): gqlTypes.Specialty[] {
    return faker.helpers.multiple(
        () => faker.helpers.enumValue(gqlTypes.Specialty),
        {
            count: count
                ? count
                : faker.number.int({ min: 1, max: 2 })
        }
    )
}

/**
 * This generates an array languages. Note that the langauges are not guaranteed to be unique. You may want to call .removeDuplicates() on the result. 
 * @param count the number of languages to generate. If 0, a random number between 1 and 2 will be generated.
 * @param onlyEnglish if true, only English will be generated
 * @returns the generated languages
 */
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

export function generateAcceptedInsurance() {
    return faker.helpers.enumValue(gqlTypes.Insurance)
}

export function generateFailingNameInvalidAlphabet(locale: gqlTypes.Locale): gqlTypes.LocalizedNameInput {
    let namesField: gqlTypes.LocalizedNameInput = { firstName: '', lastName: '', locale: gqlTypes.Locale.JaJp }

    switch (locale) {
        case gqlTypes.Locale.EnUs:
            namesField = {
                firstName: fakerJA.person.firstName(),
                middleName: 'ロイ',
                lastName: fakerJA.person.lastName(),
                locale: gqlTypes.Locale.EnUs
            }
            break
        case gqlTypes.Locale.JaJp:
            namesField = {
                firstName: faker.person.firstName(),
                middleName: faker.person.middleName(),
                lastName: faker.person.lastName(),
                locale: gqlTypes.Locale.JaJp
            }
            break
        default:
            throw new Error(`Unexpected locale value: ${locale}`)
    }
    return namesField
}

export function generateFailingNameInvalidLength(): gqlTypes.LocalizedNameInput {
    return {
        firstName: 'Rhoshandiatellyneshiaunneveshenk',
        middleName: 'Blaine Charles David Earl Frederick Gerald Hubert',
        lastName: 'Keihanaikukauakahihulihe\'ekahaunaele',
        locale: gqlTypes.Locale.EnUs
    }
}

export function generateFailingNameEmptyString(): gqlTypes.LocalizedNameInput {
    return {
        firstName: '   ',
        middleName: '     ',
        lastName: '      ',
        locale: gqlTypes.Locale.EnUs
    }
}

export function generateFailingNameInvalidCharacter(): gqlTypes.LocalizedNameInput {
    return {
        firstName: 'John/42$',
        middleName: 'Roe123',
        lastName: 'Doe&',
        locale: gqlTypes.Locale.EnUs
    }
}

export function generateFailingNameDuplicateLocale(): gqlTypes.LocalizedNameInput[] {
    return [
        {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            locale: gqlTypes.Locale.EnUs
        },
        {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            locale: gqlTypes.Locale.EnUs
        }
    ]
}