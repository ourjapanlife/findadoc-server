import { HealthcareProfessional, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'

export const fakeHealthcareProfessionals = () => {
    const name : LocaleName = {
        lastName: 'Doctor',
        firstName: 'Doctor',
        middleName: 'MD',
        locale: 'en'
    }
    const degree : Degree = {
        id: '1',
        nameJa: 'メヂカル',
        nameEn: 'Medical',
        abbreviation: 'MD'
    }

    const spokenLanguage : SpokenLanguage = {
        iso639_3: 'ja',
        nameJa: '日本語',
        nameEn: 'Japanese',
        nameNative: 'Japanese'
    }
    
    const specialtyName : SpecialtyName = {
        name: 'Neurology',
        locale: 'en'
    }

    const specialty : Specialty = {
        id: '1',
        names: [specialtyName]
    }

    const healthcareProfessionalOne : HealthcareProfessional = {
        id: '1',
        names: [name],
        degrees: [degree],
        spokenLanguages: [spokenLanguage],
        specialties: [specialty],
        acceptedInsurance: [Insurance.INTERNATIONAL_HEALTH_INSURANCE]
    }

    const name : LocaleName = {
        lastName: 'チェ',
        firstName: 'ジェイコブ',
        middleName: 'ベイヤード',
        locale: 'ja'
    }
    const degree : Degree = {
        id: '2',
        nameJa: '英語',
        nameEn: 'English',
        abbreviation: 'En'
    }

    const spokenLanguage : SpokenLanguage = {
        iso639_3: 'en-US',
        nameJa: '英語',
        nameEn: 'English',
        nameNative: 'English'
    }
    
    const specialtyName : SpecialtyName = {
        name: 'Pandas',
        locale: 'パンダ'
    }

    const specialty : Specialty = {
        id: '2',
        names: [specialtyName]
    }

    const healthcareProfessionalTwo : HealthcareProfessional = {
        id: '2',
        names: [name],
        degrees: [degree],
        spokenLanguages: [spokenLanguage],
        specialties: [specialty],
        acceptedInsurance: [Insurance.INTERNATIONAL_HEALTH_INSURANCE]
    }


    return [healthcareProfessionalOne, healthcareProfessionalTwo]
}
