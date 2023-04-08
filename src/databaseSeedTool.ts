import { initializeDb, addHealthcareProfessional, addFacility } from './database'
import { fakeHealthcareProfessionals } from './fakeData/healthcareProfessional'
import { fakeFacilities } from './fakeData/facilities'

import { getFirestore } from 'firebase-admin/firestore'

export const seedDatabase = () => {
    const args = process.argv

  // initializeDb()

  const db = getFirestore()

  const healthcareProfessionals = fakeHealthcareProfessionals()
  var facilities = fakeFacilities()

  const healthcareProfessionalForFacility = healthcareProfessionals[0]

  facilities[0].healthcareProfessionals = [healthcareProfessionalForFacility]

  console.log(facilities)
  async function test() {
    const hpRef = db.collection('healthcareProfessionals')

    await healthcareProfessionals.forEach( (hp) => {
      addHealthcareProfessional(hpRef, hp)
    })

    const facilitiesRef = db.collection('facilities')

    await facilities.forEach( (facility) => {
      addFacility(facilitiesRef, facility)
    })
  }
  // test()

    //create new tables and submit the seed data. for now just the two tables are fine X

    // healthcareProfs are stored as ids in Facilities and must be hydrated on load
    // when saving, the field must be stripped into just the ids

    // then create read / update / delete for fireStore

  // TODO: how to ensure duplicated data is not created???

    // look into auth
}
