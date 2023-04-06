import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'

export const fakeFacilities = () => {
    const name : LocaleName = {
        lastName: 'Test',
        firstName: 'Panda',
        middleName: 'The',
        locale: 'en'
    }
    const degree : Degree = {
        id: '3',
        nameJa: 'パンダの薬',
        nameEn: 'Panda Medicine',
        abbreviation: 'PM'
    }

    const spokenLanguage : SpokenLanguage = {
        iso639_3: 'en-US',
        nameJa: '英語',
        nameEn: 'English',
        nameNative: 'English'
    }
    
    const specialtyName : SpecialtyName = {
        name: 'Panda Science',
        locale: 'en'
    }

    const specialty : Specialty = {
        id: '3',
        names: [specialtyName]
    }

    const healthcareProfessional : HealthcareProfessional = {
        id: '',
        names: [name],
        degrees: [degree],
        spokenLanguages: [spokenLanguage],
        specialties: [specialty],
        acceptedInsurance: [Insurance.INTERNATIONAL_HEALTH_INSURANCE]
    }

    const facility : Facility = {
        id: '1',
        nameEn: 'Zoo',
        nameJa: '動物園',
        contact: {
            email: 'zoo@test.com',
            phone: '08000000000',
            website: 'https://zoo.test.com',
            mapsLink: ''
        },
        healthcareProfessionals: [healthcareProfessional]
    }

    return [facility]
}