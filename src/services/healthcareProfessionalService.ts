// import { HealthcareProfessional, LocaleName, Degree, Specialty, SpokenLanguage } from '../typeDefs/gqlTypes'
import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance } from '../typeDefs/dbSchema'

const tempFirebaseDbGet = () => {
    const name : LocaleName = {
        lastName: '',
        firstName: '',
        middleName: '',
        locale: ''
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
        locale: ''
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

    return [healthcareProfessional]
}

export const getHealthcareProfessionalById = async (id: string) => {
    const healthPro = tempFirebaseDbGet().find(entity => entity.id == id)

    return healthPro
}

export const getHealthcareProfessionals = async () => {
    const healthPros = tempFirebaseDbGet()

    return healthPros
}
