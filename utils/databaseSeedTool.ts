import { createHealthcareProfessional } from '../src/services/healthcareProfessionalService.js'
import { createFacility } from '../src/services/facilityService-pre-migration.js'

import { generateRandomCreateHealthcareProfessionalInputArray } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { generateRandomCreateFacilityInputArray } from '../src/fakeData/fakeFacilities.js'
import { generateRandomCreateSubmissionInputArray, generateRandomUpdateSubmissionInput } from '../src/fakeData/fakeSubmissions.js'
import { logger } from '../src/logger.js'
import { createSubmission, updateSubmission } from '../src/services/submissionService.js'

export const seedDatabase = async () => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const args = process.argv

    try {

        const facilities = generateRandomCreateFacilityInputArray()
        const healthcareProfessionals = generateRandomCreateHealthcareProfessionalInputArray()
        const submissions = generateRandomCreateSubmissionInputArray()
        const facilityIds: string[] = []

        for await (const facility of facilities) {
            const createdFacilityResult = await createFacility(facility, 'db seed tool')

            //we should fail here if we have errors
            if (createdFacilityResult.hasErrors) {
                throw new Error(`${JSON.stringify(createdFacilityResult.errors)}`)
            }

            facilityIds.push(createdFacilityResult.data.id)
        }

        for await (const hp of healthcareProfessionals) {
            //build the association 
            hp.facilityIds = facilityIds

            // for seeding we can just pass a fake userId
            const createProfessionalResult = await createHealthcareProfessional(hp, 'db seed tool')

            //we should fail here if we have errors
            if (createProfessionalResult.hasErrors) {
                throw new Error(`${JSON.stringify(createProfessionalResult.errors)}`)
            }
        }

        for await (const submission of submissions) {
            const createSubmissionResult = await createSubmission(submission)
            
            //we should fail here if we have errors
            if (createSubmissionResult.hasErrors) {
                throw new Error(`${JSON.stringify(createSubmissionResult.errors)}`)
            }
        }
    } catch (error) {
        logger.error(`❌ Error seeding database: ${JSON.stringify(error)} ❌`)
        throw new Error(`❌ Error seeding database: ${JSON.stringify(error)} ❌`)
    }
}
