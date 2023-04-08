import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import serviceAccountCredentials from '/home/jchae/projects/findadoc-server/find-a-doc-japan-firebase-adminsdk-k7f1f-12c410ff49.json'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export async function initializeDb() {
  initializeApp({
    credential: cert(serviceAccountCredentials)
  })
}

export async function addHealthcareProfessional(healthcareProfessionalsRef, healthcareProfessional) {
  healthcareProfessionalsRef.add(healthcareProfessional)
}

export async function addFacility(facilityRef, facility) {
  facilityRef.add(transformFacilityForFirestore(facility))
}

function transformFacilityForFirestore(facility) {
  const healthcareProfessionalIds = facility.healthcareProfessionals.map(hp => hp.id)
  facility.healthcareProfessionals = healthcareProfessionalIds

  return facility
}

export async function getHealthcareProfessionals() {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')

    const snapshot = await hpRef.get()
  var healthcareProfessionals = []
    snapshot.forEach(doc => {
      healthcareProfessionals.push(doc.data())
    })

  return healthcareProfessionals
}

export async function getFacilities() {
    const db = getFirestore()
    const facilitiesRef = db.collection('facilities')

    const snapshot = await facilitiesRef.get()
    var facilities = []
    snapshot.forEach(doc => {
      facilities.push(doc.data())
    })

    facilities = Promise.all(facilities.map(facility => hydrateFacility(facility))).then((resource) => resource)
    // console.log(facilities)

    return facilities
}

async function hydrateFacility(facility) {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    const snapshot = await hpRef.where('id', 'in', facility.healthcareProfessionals).get()
    var healthcareProfessionals = []
    snapshot.forEach(doc => {
      healthcareProfessionals.push(doc.data())
    })

  // console.log(healthcareProfessionals)
  facility.healthcareProfessionals = healthcareProfessionals

  // console.log(facility)

  return facility
}

// const db = getFirestore()

// async function test() {
//   const citiesRef = db.collection('cities')
//   await citiesRef.doc('SF').set({
//     name: 'San Francisco', state: 'CA', country: 'USA',
//     capital: false, population: 860000
//   });
// 
//   const cityRef = db.collection('cities').doc('SF');
//   const doc = await cityRef.get();
//   if (!doc.exists) {
//     console.log('No such document!');
//   } else {
//     console.log('Document data:', doc.data());
//   }
// }
