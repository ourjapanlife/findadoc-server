import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { faker } from '@faker-js/faker'
import { generateRandomCreateHealthcareProfessionalInputArray, generateSpokenLanguages } from './fakeHealthcareProfessionals.js'
import { generateRandomCreateFacilityInput } from './fakeFacilities.js'
import { removeDuplicates } from '../../utils/arrayUtils.js'

export function generateRandomCreateSubmissionInput(): gqlTypes.CreateSubmissionInput {
    return {
        autofillPlaceFromSubmissionUrl: false,
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

/**
 * Generates random data for an UpdateSubmissionInput, used to simulate a fully populated submission.
 * This function handles the conversion from the new HP data structure back to the old one (without facilityIds)
 * as required by the GQL type definition for the Submission object.
 */
export function generateRandomUpdateSubmissionInput(
    { isApproved = false, isRejected = false, isUnderReview = false, autofillPlaceFromSubmissionUrl = false } = {}
)
    : gqlTypes.UpdateSubmissionInput {
    // Generate the HP data using the new function. Since this is just fake data,
    // we pass an empty array of facility IDs as the final associations will be discarded
    // by the GQL type anyway, but the function requires it.
    const hpDataWithRelations = generateRandomCreateHealthcareProfessionalInputArray({
        count: 2, // Generate a couple of HPs for the submission
        facilityIdOptions: []
    })

    // Map the generated HP data to extract only the coreData, which satisfies the GQL type for Submission.
    // We add a dummy 'facilityIds' field (which is expected to be an empty array in the new model) 
    // to satisfy the type definition 'CreateHealthcareProfessionalInput' expected by the submission.
    const healthcareProfessionals = hpDataWithRelations.map(hp => ({
        ...hp.coreData,
        // When seeding submission, we can safely pass an empty array here, 
        // as the submission object does not need to define the relationship itself, 
        // only the final approved object would. This satisfies the TypeScript type check.
        facilityIds: [] 
    }))

    return {
        googleMapsUrl: faker.internet.url(),
        autofillPlaceFromSubmissionUrl: autofillPlaceFromSubmissionUrl,
        healthcareProfessionalName: faker.person.fullName(),
        spokenLanguages: generateSpokenLanguages({ count: 2 }),
        facility: generateRandomCreateFacilityInput(),
        healthcareProfessionals: healthcareProfessionals,
        isApproved: isApproved,
        isRejected: isRejected,
        isUnderReview: isUnderReview
    }
}
