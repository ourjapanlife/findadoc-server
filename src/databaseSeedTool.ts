import { addHealthcareProfessional } from './services/healthcareProfessionalService'
import { addFacility } from './services/facilityService'

import { fakeHealthcareProfessionals } from './fakeData/healthcareProfessionals'
import { fakeFacilities } from './fakeData/facilities'

export const seedDatabase = async () => {
    const args = process.argv

    const healthcareProfessionals = fakeHealthcareProfessionals()
    const facilities = fakeFacilities()
    
    const healthcareProfessionalForFacility = healthcareProfessionals[0]
    
    facilities[0].healthcareProfessionals = [healthcareProfessionalForFacility]

    for await (const hp of healthcareProfessionals) {
        await addHealthcareProfessional(hp)
    }

    for await (const facility of facilities) {
        await addFacility(facility)
    }
}
