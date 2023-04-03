import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance, Facility, Locale } from '../typeDefs/dbSchema'

const tempFirebaseDbGet = () => {
    const locale : Locale = Locale.ENGLISH
    
    const name : LocaleName = {
        lastName: '',
        firstName: '',
        middleName: '',
        locale: locale
    }
    const degree : Degree = {
        id: '',
        nameJa: '',
        nameEn: '',
        abbreviation: ''
    }

    const spokenLanguage : SpokenLanguage = {
        iso639_3: '',
        nameJa: '',
        nameEn: '',
        nameNative: ''
    }
    
    const specialtyName : SpecialtyName = {
        name: '',
        locale: locale
    }

    const specialty : Specialty = {
        id: '',
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
        id: '',
        nameEn: '',
        nameJa: '',
        contact: {
            email: '',
            phone: '',
            website: '',
            mapsLink: ''
        },
        healthcareProfessionals: [healthcareProfessional]
    }

    return [facility]
}

export const getFacilityById = async (id: string) => {
    const healthPro = tempFirebaseDbGet().find(entity => entity.id == id)

    return healthPro
}

export const getFacilities = async () => {
    const healthPros = tempFirebaseDbGet()

    return healthPros
}
