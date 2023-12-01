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

export function generateLocalizedNameInput(): gqlTypes.LocalizedNameInput {
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

export function generateDegreeInput(): gqlTypes.DegreeInput {
    return {
        nameEn: faker.person.jobTitle(),
        nameJa: '役職名',
        abbreviation: faker.person.suffix()
    }
}

export function generateSpecialty(): gqlTypes.SpecialtyInput {
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
    let namesField: gqlTypes.LocalizedNameInput = {firstName: '', lastName: '', locale: gqlTypes.Locale.JaJp}

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

export function generateFailingNameInvalidLenght(): gqlTypes.LocalizedNameInput {
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

export function generateFailingDegreeInvalidLenght(): gqlTypes.DegreeInput {
    return {
        nameEn: 'Mathematics with specialization in computational science mathematics and engineering', 
        nameJa: '同志社大学グローバル・コミュニケーション学部グローバル・コミュニケーション学科・同志社大学グローバル・コミュニケーション学部グローバル', 
        abbreviation: 'B.Tech M.Acc B.S.S.W'
    }
}

export function generateFailingDegreeInvalidAlphabet(): gqlTypes.DegreeInput {
    return {
        nameEn: '同志社大学グローバル', 
        nameJa: 'Mathematics', 
        abbreviation: 'B.Tech'
    }
}

export function generateFailingDegreeInvalidCharacter(): gqlTypes.DegreeInput {
    return {
        nameEn: 'Mathe[matics=', 
        nameJa: '同志社大学グ\'ローバル,', 
        abbreviation: '#B.T$ech'
    }
}

export function generateSpecialitieInvalidLenght(): gqlTypes.SpecialtyInput { 
    return {names: [
        {
            name: 'Female pelvic medicine and reconstructive surgery Advanced heart failure and transplant cardiology Pediatric Hematology Oncology',
            locale: gqlTypes.Locale.EnUs
            
        }
    ]}
}

export function generateSpecialitieNameEmptyString(): gqlTypes.SpecialtyInput { 
    return {names: [
        {
            name: '  ',
            locale: gqlTypes.Locale.EnUs
            
        }
    ]}
}

export function generateSpecialitieInvalidAlphabet(): gqlTypes.SpecialtyInput {
    return {names: [
        {
            name: '小児血液腫瘍学',
            locale: gqlTypes.Locale.EnUs
            
        }, 
        {
            name: 'Pediatric Hematology Oncology',
            locale: gqlTypes.Locale.JaJp
        }
    ]}
}

export function generateSpecialitieInvalidCharacters(): gqlTypes.SpecialtyInput {
    return {names: [
        {
            name: 'Pediatric %#Hematology Oncology{',
            locale: gqlTypes.Locale.EnUs
            
        }
    ]}
}
