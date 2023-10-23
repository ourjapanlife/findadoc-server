import { createHealthcareProfessional } from '../src/services/healthcareProfessionalService'
import { createFacility } from '../src/services/facilityService'

import { generateRandomCreateHealthcareProfessionalInputArray } from '../src/fakeData/healthcareProfessionals'
import { generateRandomCreateFacilityInputArray } from '../src/fakeData/facilities'

export const seedDatabase = async () => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const args = process.argv

    const facilities = generateRandomCreateFacilityInputArray()
    const healthcareProfessionals = generateRandomCreateHealthcareProfessionalInputArray()

    const facilityIds: string[] = []

    for await (const facility of facilities) {
        const createdFacilityResult = await createFacility(facility)

        //we should fail here if we have errors
        if (createdFacilityResult.hasErrors) {
            throw new Error(`Error seeding database ${JSON.stringify(createdFacilityResult.errors)}`)
        }

        facilityIds.push(createdFacilityResult.data.id)
    }

    for await (const hp of healthcareProfessionals) {
        //build the association 
        hp.facilityIds = facilityIds

        const createProfessionalResult = await createHealthcareProfessional(hp)

        //we should fail here if we have errors
        if (createProfessionalResult.hasErrors) {
            throw new Error(`Error seeding database ${JSON.stringify(createProfessionalResult.errors)}`)
        }
    }
}
