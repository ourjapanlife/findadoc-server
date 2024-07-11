import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { faker } from '@faker-js/faker'
import { generateRandomCreateHealthcareProfessionalInputArray, generateSpokenLanguages } from './fakeHealthcareProfessionals.js'
import { generateRandomCreateFacilityInput } from './fakeFacilities.js'
import { removeDuplicates } from '../../utils/arrayUtils.js'

export function generateRandomCreateSubmissionInput(): gqlTypes.CreateSubmissionInput {
    return {
        googleMapsUrl: faker.internet.url(),
        healthcareProfessionalName: faker.person.fullName(),
        spokenLanguages: removeDuplicates(generateSpokenLanguages({ count: 2 }))
    }
}

export function generateRandomCreateSubmissionInputArray({ count = 5 } = {}): gqlTypes.CreateSubmissionInput[] {
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
        spokenLanguages: generateSpokenLanguages({ count: 2 }),
        facility: generateRandomCreateFacilityInput(),
        healthcareProfessionals: generateRandomCreateHealthcareProfessionalInputArray(),
        isApproved: isApproved,
        isRejected: isRejected,
        isUnderReview: isUnderReview
    }
}
