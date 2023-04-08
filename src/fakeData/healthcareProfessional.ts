import { HealthcareProfessional, Locale, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'

export const fakeHealthcareProfessionals = () => {
    const doctorDoctor : LocaleName = {
        lastName: 'Doctor',
        firstName: 'Doctor',
        middleName: 'MD',
        locale: Locale.ENGLISH
    }
    const medicalDegree : Degree = {
        id: '1',
        nameJa: 'メヂカル',
        nameEn: 'Medical',
        abbreviation: 'MD'
    }

    const japanese : SpokenLanguage = {
        iso639_3: 'ja',
        nameJa: '日本語',
        nameEn: 'Japanese',
        nameNative: 'Japanese'
    }

    const neurologyEn : SpecialtyName = {
        name: 'Neurology',
        locale: Locale.ENGLISH
    }

    const neurology : Specialty = {
        id: '1',
        names: [neurologyEn]
    }

    const healthcareProfessionalOne : HealthcareProfessional = {
        id: '1',
        names: [doctorDoctor],
        degrees: [medicalDegree],
        spokenLanguages: [japanese],
        specialties: [neurology],
        acceptedInsurance: [Insurance.INTERNATIONAL_HEALTH_INSURANCE]
    }

    const name : LocaleName = {
        lastName: 'チェ',
        firstName: 'ジェイコブ',
        middleName: 'ベイヤード',
        locale: Locale.JAPANESE
    }
    const englishDegree : Degree = {
        id: '2',
        nameJa: '英語',
        nameEn: 'English',
        abbreviation: 'En'
    }

    const english : SpokenLanguage = {
        iso639_3: 'en-US',
        nameJa: '英語',
        nameEn: 'English',
        nameNative: 'English'
    }

    const specialtyName : SpecialtyName = {
        name: 'Pandas',
        locale: Locale.ENGLISH
    }

    const pandaSpecialty : Specialty = {
        id: '2',
        names: [specialtyName]
    }

    const healthcareProfessionalTwo : HealthcareProfessional = {
        id: '2',
        names: [name],
        degrees: [englishDegree],
        spokenLanguages: [english],
        specialties: [pandaSpecialty],
        acceptedInsurance: [Insurance.INTERNATIONAL_HEALTH_INSURANCE]
    }


    return [healthcareProfessionalOne, healthcareProfessionalTwo]
}
