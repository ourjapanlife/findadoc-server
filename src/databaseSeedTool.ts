import { initializeDb } from './database'
import { addHealthcareProfessional } from './services/healthcareProfessionalService'
import { addFacility } from './services/facilityService'

import { fakeHealthcareProfessionals } from './fakeData/healthcareProfessional'
import { fakeFacilities } from './fakeData/facilities'

import { getFirestore } from 'firebase-admin/firestore'

export const seedDatabase = () => {
    const args = process.argv

    // initializeDb()

    const db = getFirestore()

    const healthcareProfessionals = fakeHealthcareProfessionals()
    const facilities = fakeFacilities()

    const healthcareProfessionalForFacility = healthcareProfessionals[0]

    facilities[0].healthcareProfessionals = [healthcareProfessionalForFacility]
    
    async function test() {
        // const hpRef = db.collection('healthcareProfessionals')

        await healthcareProfessionals.forEach(hp => {
            addHealthcareProfessional(hp)
        })

        const facilitiesRef = db.collection('facilities')

        await facilities.forEach(facility => {
            addFacility(facility)
        })
    }
}
