import * as gqlTypes from '../typeDefs/gqlTypes'
import { faker, fakerJA } from '@faker-js/faker'

export function generateRandomHealthcareProfessional(facilityIds?: string[])
    : gqlTypes.CreateHealthcareProfessionalInput {
    return {
        facilityIds: facilityIds ?? [],
        names: faker.helpers.multiple(generateLocaleName, { count: 2 }),
        degrees: faker.helpers.multiple(generateDegree, { count: 1 }),
        specialties: faker.helpers.multiple(generateSpecialty, { count: 1 }),
        spokenLanguages: faker.helpers.multiple(generateSpokenLanguage, { count: 1 }),
        acceptedInsurance: [faker.helpers.enumValue(gqlTypes.Insurance)]
    }
}

export function generateRandomHealthcareProfessionals(count: number = 5): gqlTypes.CreateHealthcareProfessionalInput[] {
    return faker.helpers.multiple(generateRandomHealthcareProfessional, {
        count: count
    })
}

function generateLocaleName(): gqlTypes.LocaleNameInput {
    return {
        firstName: faker.person.firstName(),
        middleName: faker.person.middleName(),
        lastName: faker.person.lastName(),
        locale: faker.helpers.enumValue(gqlTypes.Locale)
    }
}

function generateDegree(): gqlTypes.DegreeInput {
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
            name: locale == gqlTypes.Locale.English ? faker.person.jobDescriptor() : fakerJA.person.jobDescriptor(),
            locale: locale
        }
    }

    return {
        names: faker.helpers.multiple(generateSpecialtyName, { count: 2 })
    }
}

function generateSpokenLanguage(): gqlTypes.SpokenLanguageInput {
    const language = faker.helpers.enumValue(gqlTypes.LanguageCode_Iso639_3)

    return {
        nameEn: language == gqlTypes.LanguageCode_Iso639_3.Eng ? 'English' : 'Japanese',
        nameJa: language == gqlTypes.LanguageCode_Iso639_3.Eng ? '英語' : '日本語',
        nameNative: language == gqlTypes.LanguageCode_Iso639_3.Eng ? 'English' : '日本語',
        languageCode_iso639_3: faker.helpers.enumValue(gqlTypes.LanguageCode_Iso639_3)
    }
}
