import { createHealthcareProfessional } from '../src/services/healthcareProfessionalService'
import { createFacility } from '../src/services/facilityService'

import { fakeHealthcareProfessionals } from '../src/fakeData/healthcareProfessionals'
import { fakeFacilities } from '../src/fakeData/facilities'

export const seedDatabase = async () => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const args = process.argv

    const healthcareProfessionals = fakeHealthcareProfessionals()
    const facilities = fakeFacilities()
    
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
