import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import serviceAccountCredentials from '/home/jchae/projects/findadoc-server/find-a-doc-japan-firebase-adminsdk-k7f1f-12c410ff49.json'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

export async function initializeDb() {
  initializeApp({
    credential: cert(serviceAccountCredentials)
  })
}

// const db = getFirestore()

async function test() {
  const citiesRef = db.collection('cities')
  await citiesRef.doc('SF').set({
    name: 'San Francisco', state: 'CA', country: 'USA',
    capital: false, population: 860000
  });

  const cityRef = db.collection('cities').doc('SF');
  const doc = await cityRef.get();
  if (!doc.exists) {
    console.log('No such document!');
  } else {
    console.log('Document data:', doc.data());
  }
}
