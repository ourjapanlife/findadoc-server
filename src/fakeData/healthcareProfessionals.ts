import * as gqlTypes from '../typeDefs/gqlTypes'

export const fakeHealthcareProfessionals = () => {
    const doctorDoctor : gqlTypes.LocaleName = {
        lastName: 'Doctor',
        firstName: 'Doctor',
        middleName: 'MD',
        locale: gqlTypes.Locale.English
    }
    const medicalDegree : gqlTypes.Degree = {
        nameJa: 'メヂカル',
        nameEn: 'Medical',
        abbreviation: 'MD'
    }

    const japanese : gqlTypes.SpokenLanguage = {
        iso639_3: 'ja',
        nameJa: '日本語',
        nameEn: 'Japanese',
        nameNative: 'Japanese'
    }

    const neurologyEn : gqlTypes.SpecialtyName = {
        name: 'Neurology',
        locale: gqlTypes.Locale.English
    }

    const neurology : gqlTypes.Specialty = {
        names: [neurologyEn]
    }

    const healthcareProfessionalOne : gqlTypes.HealthcareProfessionalInput = {
        names: [doctorDoctor],
        degrees: [medicalDegree],
        spokenLanguages: [japanese],
        specialties: [neurology],
        acceptedInsurance: [gqlTypes.Insurance.InternationalHealthInsurance]
    }

    const name : gqlTypes.LocaleName = {
        lastName: 'チェ',
        firstName: 'ジェイコブ',
        middleName: 'ベイヤード',
        locale: gqlTypes.Locale.Japanese
    }
    const englishDegree : gqlTypes.Degree = {
        nameJa: '英語',
        nameEn: 'English',
        abbreviation: 'En'
    }

    const english : gqlTypes.SpokenLanguage = {
        iso639_3: 'en-US',
        nameJa: '英語',
        nameEn: 'English',
        nameNative: 'English'
    }

    const specialtyName : gqlTypes.SpecialtyName = {
        name: 'Pandas',
        locale: gqlTypes.Locale.English
    }

    const pandaSpecialty : gqlTypes.Specialty = {
        names: [specialtyName]
    }

    const healthcareProfessionalTwo : gqlTypes.HealthcareProfessionalInput = {
        names: [name],
        degrees: [englishDegree],
        spokenLanguages: [english],
        specialties: [pandaSpecialty],
        acceptedInsurance: [gqlTypes.Insurance.InternationalHealthInsurance]
    }

    return [healthcareProfessionalOne, healthcareProfessionalTwo]
}
