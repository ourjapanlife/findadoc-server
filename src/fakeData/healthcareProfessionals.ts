import { HealthcareProfessional, Locale, LocaleName, Degree, 
    Specialty, SpecialtyName, SpokenLanguage, Insurance } from '../typeDefs/gqlTypes'

export const fakeHealthcareProfessionals = () => {
    const doctorDoctor : LocaleName = {
        lastName: 'Doctor',
        firstName: 'Doctor',
        middleName: 'MD',
        locale: Locale.English
    }
    const medicalDegree : Degree = {
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
        locale: Locale.English
    }

    const neurology : Specialty = {
        names: [neurologyEn]
    }

    const healthcareProfessionalOne : HealthcareProfessional = {
        names: [doctorDoctor],
        degrees: [medicalDegree],
        spokenLanguages: [japanese],
        specialties: [neurology],
        acceptedInsurance: [Insurance.InternationalHealthInsurance],
        isDeleted: false
    }

    const name : LocaleName = {
        lastName: 'チェ',
        firstName: 'ジェイコブ',
        middleName: 'ベイヤード',
        locale: Locale.Japanese
    }
    const englishDegree : Degree = {
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
        locale: Locale.English
    }

    const pandaSpecialty : Specialty = {
        names: [specialtyName]
    }

    const healthcareProfessionalTwo : HealthcareProfessional = {
        names: [name],
        degrees: [englishDegree],
        spokenLanguages: [english],
        specialties: [pandaSpecialty],
        acceptedInsurance: [Insurance.InternationalHealthInsurance],
        isDeleted: false
    }

    return [healthcareProfessionalOne, healthcareProfessionalTwo]
}
