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

    const healthcareProfessionalOne : gqlTypes.HealthcareProfessional = {
        names: [doctorDoctor],
        degrees: [medicalDegree],
        spokenLanguages: [japanese],
        specialties: [neurology],
        acceptedInsurance: [gqlTypes.Insurance.InternationalHealthInsurance],
        isDeleted: false
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

    const healthcareProfessionalTwo : gqlTypes.HealthcareProfessional = {
        names: [name],
        degrees: [englishDegree],
        spokenLanguages: [english],
        specialties: [pandaSpecialty],
        acceptedInsurance: [gqlTypes.Insurance.InternationalHealthInsurance],
        isDeleted: false
    }

    const nameTwo : gqlTypes.LocaleName = {
        lastName: 'Shabadoo',
        firstName: 'Joey',
        middleName: 'JoJo Junior',
        locale: gqlTypes.Locale.English
    }

    const cardiologySpecialty : gqlTypes.SpecialtyName = {
        name: 'Cardiology',
        locale: gqlTypes.Locale.English
    }

    const specialtyField : gqlTypes.Specialty = {
        names: [cardiologySpecialty]
    }

    const healthcareProfessionalThree : gqlTypes.HealthcareProfessional = {
        names: [nameTwo],
        degrees: [medicalDegree],
        spokenLanguages: [english],
        specialties: [specialtyField],
        acceptedInsurance: [gqlTypes.Insurance.InternationalHealthInsurance],
        isDeleted: false
    }

    const namefour : gqlTypes.LocaleName = {
        lastName: 'Riviera',
        firstName: 'Nick',
        middleName: '',
        locale: gqlTypes.Locale.English
    }

    const dermatologySpecialty : gqlTypes.SpecialtyName = {
        name: 'dermatology',
        locale: gqlTypes.Locale.English
    }

    const dermatologySpecialtyField : gqlTypes.Specialty = {
        names: [dermatologySpecialty]
    }

    const spanish : gqlTypes.SpokenLanguage = {
        iso639_3: 'es',
        nameJa: 'スペイン語',
        nameEn: 'Spanish',
        nameNative: 'Español '
    }

    const healthcareProfessionalFour : gqlTypes.HealthcareProfessional = {
        names: [namefour],
        degrees: [medicalDegree],
        spokenLanguages: [spanish],
        specialties: [dermatologySpecialtyField],
        acceptedInsurance: [gqlTypes.Insurance.InternationalHealthInsurance],
        isDeleted: false
    }

    return [healthcareProfessionalOne, 
            healthcareProfessionalTwo, 
            healthcareProfessionalThree, 
            healthcareProfessionalFour]
}
