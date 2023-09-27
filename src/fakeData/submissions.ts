import * as gqlTypes from '../typeDefs/gqlTypes'

export const fakeSubmissions = () => {
    const fakeSubOne: gqlTypes.SubmissionInput = {
        googleMapsUrl: 'https://maps.google.com/exampleA',
        healthcareProfessionalName: 'Dr A',
        spokenLanguages: [
            {
                iso639_3: 'eng',
                nameJa: '英語',
                nameEn: 'English',
                nameNative: 'English'
            }
        ]
    }

    const fakeSubTwo: gqlTypes.SubmissionInput = {
        googleMapsUrl: 'https://maps.google.com/exampleB',
        healthcareProfessionalName: 'Dr B',
        spokenLanguages: [
            {
                iso639_3: 'jpn',
                nameJa: '日本語',
                nameEn: 'Japanese',
                nameNative: '日本語'
            }
        ]
    }

    const fakeSubThree: gqlTypes.SubmissionInput = {
        googleMapsUrl: 'https://maps.google.com/exampleC',
        healthcareProfessionalName: 'Dr C',
        spokenLanguages: [
            {
                iso639_3: 'spa',
                nameJa: 'スペイン語',
                nameEn: 'Spanish',
                nameNative: 'español'
            }
        ]
    }

    const fakeSubFour: gqlTypes.SubmissionInput = {
        googleMapsUrl: 'https://maps.google.com/exampleD',
        healthcareProfessionalName: 'Dr D',
        spokenLanguages: [
            {
                iso639_3: 'sarbpa',
                nameJa: 'アラブ語',
                nameEn: 'Arabic',
                nameNative: 'لعربية'
            }
        ]
    }

    return [fakeSubOne, fakeSubTwo, fakeSubThree, fakeSubFour]
}