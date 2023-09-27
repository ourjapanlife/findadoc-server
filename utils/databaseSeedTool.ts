import { addHealthcareProfessional } from '../src/services/healthcareProfessionalService'
import { addFacility } from '../src/services/facilityService'
import { addSubmission } from '../src/services/submissionService'
import * as gqlTypes from '../src/typeDefs/gqlTypes'

import { fakeHealthcareProfessionals } from '../src/fakeData/healthcareProfessionals'
import { fakeFacilities } from '../src/fakeData/facilities'
import { fakeSubmissions } from '../src/fakeData/submissions'

export const seedDatabase = async () => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const args = process.argv

    const healthcareProfessionals = fakeHealthcareProfessionals()
    const facilities = fakeFacilities()
    const submissions = fakeSubmissions()
    
    const healthcareProfessionalForFacility = healthcareProfessionals[0]
    const healthcareProfessionalForFacilityTwo = healthcareProfessionals[3]
    const healthcareProfessionalForFacilityThree = healthcareProfessionals[2]
    
    facilities[0].healthcareProfessionals = [healthcareProfessionalForFacility]
    facilities[1].healthcareProfessionals = [healthcareProfessionalForFacilityTwo]
    facilities[2].healthcareProfessionals = [healthcareProfessionalForFacilityThree]

    for await (const hp of healthcareProfessionals) {
        await addHealthcareProfessional(hp)
    }

    for await (const facility of facilities) {
        await addFacility(facility)
    }

    for await (const submissionInput of submissions) {
        const submission: gqlTypes.Submission = {
            ...submissionInput,
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            id: '',
            isApproved: false,
            isRejected: false,
            isUnderReview: false
        }

        await addSubmission(submission)
    }
}
