import * as gqlTypes from '../typeDefs/gqlTypes'
import { faker } from '@faker-js/faker'
import { generateRandomCreateHealthcareProfessionalInputArray, generateSpokenLanguage } from './fakeHealthcareProfessionals'
import { generateRandomCreateFacilityInput } from './fakeFacilities'

export function generateRandomCreateSubmissionInput(): gqlTypes.CreateSubmissionInput {
    return {
        googleMapsUrl: faker.internet.url(),
        healthcareProfessionalName: faker.person.fullName(),
        spokenLanguages: faker.helpers.multiple(generateSpokenLanguage, { count: 2 })
    }
}

export function generateRandomCreateSubmissionInputArray({ count = 5 }): gqlTypes.CreateSubmissionInput[] {
    return faker.helpers.multiple(generateRandomCreateSubmissionInput, {
        count: count
    })
}

export function generateRandomUpdateSubmissionInput(
    { isApproved = false, isRejected = false, isUnderReview = false } = {}
)
    : gqlTypes.UpdateSubmissionInput {
    return {
        googleMapsUrl: faker.internet.url(),
        healthcareProfessionalName: faker.person.fullName(),
        spokenLanguages: faker.helpers.multiple(generateSpokenLanguage, { count: 2 }),
        facility: generateRandomCreateFacilityInput(),
        healthcareProfessionals: generateRandomCreateHealthcareProfessionalInputArray(),
        isApproved: isApproved,
        isRejected: isRejected,
        isUnderReview: isUnderReview
    }
}
