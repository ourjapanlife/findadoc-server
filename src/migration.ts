import { createClient } from '@supabase/supabase-js'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { Firestore } from 'firebase-admin/firestore'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

// The logic from firebaseDb.ts adapted not to depend on logger, seedDatabase, etc.
import { envVariables } from '../utils/environmentVariables.js'

const isTestingEnvironment = envVariables.isTestingEnvironment()
const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()

export let dbInstance

const testFirestoreIsInitialized = async () => {
    try {
        const ref = dbInstance.collection('facilities')
        await ref.limit(1).get()
        console.log('🔥 Firestore connection established 🔥')
    } catch (ex) {
        console.error(`❌ Firestore connection failed... ❌ ${ex}`)
        throw new Error('❌ Firestore connection failed... ❌')
    }
}

let alreadyStartedInitialization = false

export const initiatilizeFirebaseInstance = async () => {
    if (dbInstance || alreadyStartedInitialization) {
        return
    }

    alreadyStartedInitialization = true

    const firebaseConfig = {
        projectId: envVariables.firebaseProjectId(),
        credential: isProduction ? cert(JSON.parse(envVariables.firebaseServiceAccount())) : applicationDefault(),
        databaseURL: isProduction ? undefined : envVariables.getDbUrl()
    }

    initializeApp(firebaseConfig)
    
    const newDbInstance = admin.firestore()
    dbInstance = newDbInstance
    
    const isNotProduction = !!isTestingEnvironment || isLocal

    if (isProduction) {
        console.log('🔥 Connecting to production firebase...\n')
    } else if (isNotProduction) {
        console.log('🔥 Connecting to firebase emulator...\n')
        console.log('TIP: If it doesn\'t connect after 10 seconds, make sure the firebase emulator is running with the command "yarn dev:startlocaldb"')
    }

    await testFirestoreIsInitialized()
    console.log('✅ Firebase initialized! ✅ \n')
}

// Function to handle Firestore timestamps and convert to ISO string
const convertTimestampToISO = (timestamp) => {
    // Check if the timestamp is a valid object with toDate() or _seconds
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString()
    } else if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toISOString()
    } else if (typeof timestamp === 'string') {
        // Handle case where it's already a string (e.g., in development data)
        try {
            const date = new Date(timestamp)

            if (!isNaN(date.getTime())) {
                return date.toISOString()
            }
        } catch (e) {
            // Do nothing, will return null
        }
    }
    return null
}

// --- MAIN MIGRATION LOGIC ---
dotenv.config({ path: '.env.dev' })

async function runMigration() {
    try {
        console.log('🚀 Starting migration... 🚀')
        await initiatilizeFirebaseInstance()
        
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('✅ Database connections verified.')

        // 1. Migrate the 'facilities' table (step 1)
        console.log('Fetching data from Firestore from the "facilities" collection...')
        const facilitiesSnapshot = await dbInstance.collection('facilities').get()
        const facilitiesData = facilitiesSnapshot.docs.map(doc => {
            const data = doc.data()
            const name = data.nameEn || data.nameJa || null

            return {
                firestore_id: doc.id,
                name: name,
                contact: data.contact, 
                mapLatitude: data.mapLatitude || null, 
                mapLongitude: data.mapLongitude || null,
                createdDate: convertTimestampToISO(data.createdDate),
                updatedDate: convertTimestampToISO(data.updatedDate)
            }
        })

        console.log(`Found ${facilitiesData.length} 'facilities' documents to migrate.`)
        if (facilitiesData.length > 0) {
            console.log('Inserting/updating data in the "facilities" table...')
            const { error: facilitiesError } = await supabase.from('facilities').upsert(facilitiesData)
            if (facilitiesError) {
                console.error('❌ Error during Supabase insert (facilities table):', facilitiesError)
                throw new Error('Supabase insert error. Migration aborted.')
            }
            console.log('✅ \'facilities\' data inserted/updated successfully.')
        } else {
            console.log('No \'facilities\' data to migrate.')
        }
        
        // 2. Migrate the 'hps' table (step 2)
        console.log('Fetching data from Firestore from the "healthcareProfessionals" collection... (step 2)')
        const hpsSnapshot = await dbInstance.collection('healthcareProfessionals').get()

        if (hpsSnapshot.empty) {
            console.log('No documents found in the "healthcareProfessionals" collection. Migration finished.')
            return
        }

        console.log(`Found ${hpsSnapshot.docs.length} documents to migrate.`)
        
        const batchSize = 100
        let migratedCount = 0
        
        for (let i = 0; i < hpsSnapshot.docs.length; i += batchSize) {
            const batchDocs = hpsSnapshot.docs.slice(i, i + batchSize)
            
            const hpsData = batchDocs.map(doc => {
                const data = doc.data()

                return {
                    firestore_id: doc.id,
                    email: data.email || null,
                    names: data.names || null,
                    degrees: data.degrees || null,
                    specialties: data.specialties || null,
                    spokenLanguages: data.spokenLanguages || null,
                    acceptedInsurance: data.acceptedInsurance || null,
                    createdDate: convertTimestampToISO(data.createdDate),
                    updatedDate: convertTimestampToISO(data.updatedDate),
                    additionalInfoForPatients: data.additionalInfoForPatients || null
                }
            })

            console.log(`Inserting/updating batch ${i / batchSize + 1} of ${hpsData.length} documents in the 'hps' table...`)
            const { error: hpsError } = await supabase.from('hps').upsert(hpsData)

            if (hpsError) {
                console.error('❌ Error during Supabase insert (hps table):', hpsError)
                throw new Error('Supabase insert error. Migration aborted.')
            }
            console.log(`✅ Batch ${i / batchSize + 1} successfully inserted into 'hps' table.`)

            // Fetch the new UUIDs for the relationship tables
            const { data: existingHps, error: hpsFetchError } = await supabase.from('hps').select('id, firestore_id').in('firestore_id', batchDocs.map(doc => doc.id))
            const { data: existingFacilities, error: facilitiesFetchError } = await supabase.from('facilities').select('id, firestore_id')
            
            if (hpsFetchError || facilitiesFetchError) {
                console.error('❌ Error fetching existing IDs from Supabase:', hpsFetchError || facilitiesFetchError)
                throw new Error('Supabase fetch error. Migration aborted.')
            }
            
            const hpIdMap = new Map(existingHps.map(hp => [hp.firestore_id, hp.id]))
            const facilityIdMap = new Map(existingFacilities.map(facility => [facility.firestore_id, facility.id]))

            // 3. Migrate the 'hps_facilities' table (step 3)
            const hpsFacilitiesData = batchDocs.flatMap(doc => {
                const data = doc.data()
                
                if (data.facilityIds && Array.isArray(data.facilityIds)) {
                    return data.facilityIds.map(facilityId => ({
                        hps_id: hpIdMap.get(doc.id),
                        facilities_id: facilityIdMap.get(facilityId)
                    })).filter(relationship => relationship.hps_id && relationship.facilities_id)
                }
                return []
            });
            
            if (hpsFacilitiesData.length > 0) {
                console.log(`Inserting/updating ${hpsFacilitiesData.length} relationships in the 'hps_facilities' table...`)
                const { error: hpsFacilitiesError } = await supabase.from('hps_facilities').upsert(hpsFacilitiesData)
                
                if (hpsFacilitiesError) {
                    console.error('❌ Error during Supabase insert (hps_facilities table):', hpsFacilitiesError)
                    throw new Error('Supabase insert error. Migration aborted.')
                }
                console.log(`✅ Relationships successfully inserted into the 'hps_facilities' table.`)
            } else {
                console.log('No facility-hp relationship found for this batch. Skipping insert into "hps_facilities" table.')
            }

            migratedCount += batchDocs.length
        }

        // 4. Migrate the 'submissions' table (step 4)
        console.log('Fetching data from Firestore from the "submissions" collection... (step 4)')
        const submissionsSnapshot = await dbInstance.collection('submissions').get()

        if (submissionsSnapshot.empty) {
            console.log('No documents found in the "submissions" collection. Migration step finished.');
        } else {
            // Fetch existing HP and Facility IDs from Supabase to check against, using firestore_id
            const { data: existingHps, error: hpsFetchError } = await supabase.from('hps').select('id, firestore_id');
            const { data: existingFacilities, error: facilitiesFetchError } = await supabase.from('facilities').select('id, firestore_id')
            
            if (hpsFetchError || facilitiesFetchError) {
                console.error('❌ Error fetching existing IDs from Supabase:', hpsFetchError || facilitiesFetchError)
                throw new Error('Supabase fetch error. Migration aborted.')
            }
            
            const hpIdMap = new Map(existingHps.map(hp => [hp.firestore_id, hp.id]))
            const facilityIdMap = new Map(existingFacilities.map(facility => [facility.firestore_id, facility.id]))

            const submissionData = submissionsSnapshot.docs.flatMap(doc => {
                const data = doc.data()
                
                let status = 'pending'

                if (data.isApproved) {
                    status = 'approved'
                } else if (data.isRejected) {
                    status = 'rejected'
                }
                
                const hpIdsInSubmission = (data.healthcareProfessionals || []).map(hp => hp.id)
                const facilityIdInSubmission = data.facility?.id || null
                
                const mappedHpIds = hpIdsInSubmission
                    .map(firestoreId => hpIdMap.get(firestoreId))
                    .filter(id => id !== undefined)
                
                const mappedFacilityId = facilityIdMap.get(facilityIdInSubmission)
                
                if (mappedHpIds.length > 0 && mappedFacilityId !== undefined) {
                    return mappedHpIds.map(hpId => ({
                        hps_id: hpId, 
                        facilities_id: mappedFacilityId,
                        status: status,
                        createdDate: convertTimestampToISO(data.createdDate),
                        updatedDate: convertTimestampToISO(data.updatedDate)
                    }));
                }
                console.log(`Skipping submission with ID ${doc.id}: could not find a valid HP or Facility ID in Supabase.`)
                return []
            })

            if (submissionData.length > 0) {
                console.log(`Found ${submissionData.length} relationships to migrate to the 'submissions' table.`)
                console.log('Inserting data into the "submissions" table...')
                const { error: submissionError } = await supabase.from('submissions').insert(submissionData)
                if (submissionError) {
                    console.error('❌ Error during Supabase insert (submissions table):', submissionError)
                    throw new Error('Supabase insert error. Migration aborted.')
                }
                console.log('✅ Submissions data inserted successfully.')
            } else {
                console.log('No valid submission data with existing HP and Facility IDs to migrate.')
            }
        }
        
        console.log(`🎉 Migration completed! All documents and their relationships have been migrated successfully. 🎉`)
    } catch (error) {
        console.error('❌ Critical error during migration:', error.message)
    }
}

// Start the migration script
runMigration()
