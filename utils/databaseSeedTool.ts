import { createHealthcareProfessional } from '../src/services/healthcareProfessionalService'
import { createFacility } from '../src/services/facilityService'

import { fakeHealthcareProfessionals } from '../src/fakeData/healthcareProfessionals'
import { fakeFacilities } from '../src/fakeData/facilities'

export const seedDatabase = async () => {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const args = process.argv

    const healthcareProfessionals = fakeHealthcareProfessionals()
    const facilities = fakeFacilities()
    
    const healthcareProfessionalForFacility = healthcareProfessionals[0]
    
    facilities[0].healthcareProfessionals = [healthcareProfessionalForFacility]

    for await (const hp of healthcareProfessionals) {
        await createHealthcareProfessional(hp)
    }

    for await (const facility of facilities) {
        await createFacility(facility)
    }
}
