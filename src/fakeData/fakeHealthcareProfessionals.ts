import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { faker, fakerJA } from '@faker-js/faker'
import { logger } from '../logger.js'

/**
 * Generates random data for a CreateHealthcareProfessionalInput object,
 * focusing only on the core fields for the 'healthcare_professionals' table.
 * * @param {object} options - Options containing the available facility IDs.
 * @returns {object} The HP data structure, excluding the facilityIds.
 */
export function generateRandomCreateHealthcareProfessionalData(
    // We keep facilityIds here to select the random associations, but we don't include them in the returned object
    { facilityIds }: { facilityIds: string[] } = { facilityIds: [] }
)
    : {
        coreData: Omit<gqlTypes.CreateHealthcareProfessionalInput, 'facilityIds'>,
        selectedFacilityIds: string[]
    } {
    // Select random facility IDs for this HP (1 to 3 associations)
    const randomSelectedFacilityIds = faker.helpers.arrayElements(facilityIds, { min: 1, max: 3 })

    return {
        coreData: {
            // Note: facilityIds is omitted here for the core table
            names: faker.helpers.multiple(generateLocalizedNameInput, { count: 1 }),
            degrees: generateDegrees(),
            specialties: generateSpecialties(),
            spokenLanguages: generateSpokenLanguages(),
            acceptedInsurance: [faker.helpers.enumValue(gqlTypes.Insurance)],
            additionalInfoForPatients: ''
        },
        selectedFacilityIds: randomSelectedFacilityIds
    }
}

/**
 * Generates a single HP input for backward compatibility with tests
 * @param facilityIds - Optional array of facility IDs to associate
 * @returns CreateHealthcareProfessionalInput with facilityIds
 */
export function generateRandomCreateHealthcareProfessionalInput(
    { facilityIds }: { facilityIds?: string[] } = {}
): gqlTypes.CreateHealthcareProfessionalInput {
    const { coreData, selectedFacilityIds } = generateRandomCreateHealthcareProfessionalData({
        facilityIds: facilityIds || []
    })

    return {    
        ...coreData,
        facilityIds: selectedFacilityIds// Include facilityIds for compatibility
    }
}

/**
 * This generates an array of HP data, structured to separate core HP data
 * from the Facility relationships (which will go into the hps_facilities table).
 * * @param {object} options - Options for array generation.
 * @param {number} options.count - The number of HPs to generate (default is 100).
 * @param {string[]} options.facilityIdOptions - The list of available facility UUIDs.
 * @returns {Array<object>} An array of objects, each containing coreData and selectedFacilityIds.
 */
export function generateRandomCreateHealthcareProfessionalInputArray({ count, facilityIdOptions }
: { count: number, facilityIdOptions: string[] } = { count: 100, facilityIdOptions: [] })
    : Array<{
        coreData: Omit<gqlTypes.CreateHealthcareProfessionalInput, 'facilityIds'>,
        selectedFacilityIds: string[]
    }> {
    return faker.helpers.multiple(() =>
        generateRandomCreateHealthcareProfessionalData({ facilityIds: facilityIdOptions || [] }), {
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
