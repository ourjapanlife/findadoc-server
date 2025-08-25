import { createHealthcareProfessional } from '../src/services/healthcareProfessionalService-pre-migration.js'
import { createFacility } from '../src/services/facilityService-pre-migration.js'

import { generateRandomCreateHealthcareProfessionalInputArray } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { generateRandomCreateFacilityInputArray } from '../src/fakeData/fakeFacilities.js'
import { generateRandomCreateSubmissionInputArray, generateRandomUpdateSubmissionInput } from '../src/fakeData/fakeSubmissions.js'
import { logger } from '../src/logger.js'
import { createSubmission, updateSubmission } from '../src/services/submissionService-pre-migration.js'

export const seedDatabase = async () => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const args = process.argv

    try {

        const facilities = generateRandomCreateFacilityInputArray({ count: 30 })
        const facilityIds: string[] = []
        for await (const facility of facilities) {
            const createdFacilityResult = await createFacility(facility, 'db seed tool')

            //we should fail here if we have errors
            if (createdFacilityResult.hasErrors) {
                throw new Error(`${JSON.stringify(createdFacilityResult.errors)}`)
            }

            facilityIds.push(createdFacilityResult.data.id)
        }


        const healthcareProfessionals = generateRandomCreateHealthcareProfessionalInputArray({
            count: 35,
            facilityIdOptions: facilityIds
        })
        for await (const hp of healthcareProfessionals) {
            // for seeding we can just pass a fake userId
            const createProfessionalResult = await createHealthcareProfessional(hp, 'db seed tool')
            // We should fail here if we have errors
            if (createProfessionalResult.hasErrors) {
                throw new Error(`${JSON.stringify(createProfessionalResult.errors)}`)
            }
        }

        const submissions = generateRandomCreateSubmissionInputArray()
        for await (const submission of submissions) {
            const createSubmissionResult = await createSubmission(submission)

            // We should fail here if we have errors
            if (createSubmissionResult.hasErrors) {
                throw new Error(`${JSON.stringify(createSubmissionResult.errors)}`)
            }
        }
    } catch (error) {
        logger.error(`❌ Error seeding database: ${JSON.stringify(error)} ❌`)
        throw new Error(`❌ Error seeding database: ${JSON.stringify(error)} ❌`)
    }
}
