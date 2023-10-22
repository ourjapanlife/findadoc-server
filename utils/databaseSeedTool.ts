import { createHealthcareProfessional } from '../src/services/healthcareProfessionalService'
import { createFacility } from '../src/services/facilityService'

import { generateRandomHealthcareProfessionals } from '../src/fakeData/healthcareProfessionals'
import { generateRandomFacilities } from '../src/fakeData/facilities'

export const seedDatabase = async () => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const args = process.argv

    const healthcareProfessionals = generateRandomHealthcareProfessionals()
    const facilities = generateRandomFacilities()
    
    const healthcareProfessionalIds: string[] = []

    for await (const hp of healthcareProfessionals) {
        const createResult = await createHealthcareProfessional(hp)

        healthcareProfessionalIds.push(createResult.data as string)
    }
    
    facilities[0].healthcareProfessionalIds = healthcareProfessionalIds

    for await (const facility of facilities) {
        await createFacility(facility)
    }
}
