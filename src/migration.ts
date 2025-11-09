import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { envVariables } from '../utils/environmentVariables.js'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface FirestoreFacility {
    nameEn?: string
    nameJa?: string
    contact?: Record<string, unknown>
    mapLatitude?: number
    mapLongitude?: number
    createdDate?: FirebaseFirestore.Timestamp | string
    updatedDate?: FirebaseFirestore.Timestamp | string
}

interface FirestoreHealthcareProfessional {
    email?: string
    names?: unknown[]
    degrees?: unknown[]
    specialties?: unknown[]
    spokenLanguages?: unknown[]
    acceptedInsurance?: unknown[]
    additionalInfoForPatients?: string
    facilityIds?: string[]
    createdDate?: FirebaseFirestore.Timestamp | string
    updatedDate?: FirebaseFirestore.Timestamp | string
}

interface FirestoreSubmission {
    isApproved?: boolean
    isRejected?: boolean
    isUnderReview?: boolean
    googleMapsUrl?: string
    healthcareProfessionalName?: string
    spokenLanguages?: unknown[]
    autofillPlaceFromSubmissionUrl?: boolean
    facility?: { id?: string; [key: string]: unknown }
    healthcareProfessionals?: Array<{ id?: string; [key: string]: unknown }>
    notes?: string
    createdDate?: FirebaseFirestore.Timestamp | string
    updatedDate?: FirebaseFirestore.Timestamp | string
}

// =============================================================================
// CONFIGURATION & INITIALIZATION
// =============================================================================

// Load environment variables
dotenv.config({ path: '.env.prod' })

const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()
const isTestingEnvironment = envVariables.isTestingEnvironment()

let firestoreInstance: FirebaseFirestore.Firestore
let supabaseClient: SupabaseClient

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Converts Firestore Timestamp to ISO string format
 * Handles various timestamp formats including Firestore Timestamp objects and strings
 * @param timestamp - The timestamp to convert
 * @returns ISO string or null if conversion fails
 */
function convertTimestampToISO(
    timestamp?: FirebaseFirestore.Timestamp | string | { seconds: number }
): string | null {
    if (!timestamp) return null

    // Handle Firestore Timestamp with toDate() method
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        return timestamp.toDate().toISOString()
    }

    // Handle timestamp with seconds property
    if (typeof timestamp === 'object' && 'seconds' in timestamp) {
        return new Date(timestamp.seconds * 1000).toISOString()
    }

    // Handle string timestamps
    if (typeof timestamp === 'string') {
        try {
            const date = new Date(timestamp)
            if (!isNaN(date.getTime())) {
                return date.toISOString()
            }
        } catch {
            // Invalid string format, return null
        }
    }

    return null
}

/**
 * Converts submission status booleans to a single status string
 * @param isApproved - Whether submission is approved
 * @param isRejected - Whether submission is rejected
 * @param isUnderReview - Whether submission is under review
 * @returns Status string
 */
function getSubmissionStatus(
    isApproved?: boolean,
    isRejected?: boolean,
    isUnderReview?: boolean
): string {
    if (isApproved) return 'approved'
    if (isRejected) return 'rejected'
    if (isUnderReview) return 'under_review'
    return 'pending'
}

/**
 * Creates ID mapping from Firestore IDs to Supabase UUIDs
 * @param data - Array of records with id and firestore_id
 * @returns Map of firestore_id -> uuid
 */
function createIdMap(data: Array<{ id: string; firestore_id: string }>): Map<string, string> {
    return new Map(data.map(item => [item.firestore_id, item.id]))
}

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * Tests Firestore connection by attempting to query a collection
 * @throws Error if connection fails
 */
async function testFirestoreConnection(): Promise<void> {
    try {
        const ref = firestoreInstance.collection('facilities')
        await ref.limit(1).get()
        console.log('✅ Firestore connection established')
    } catch (error) {
        console.error('❌ Firestore connection failed:', error)
        throw new Error('Failed to connect to Firestore')
    }
}

/**
 * Initializes Firebase Admin SDK with appropriate credentials
 * Sets up Firestore instance for production or development environment
 */
async function initializeFirebase(): Promise<void> {
    const firebaseConfig = {
        projectId: envVariables.firebaseProjectId(),
        credential: isProduction
            ? cert(JSON.parse(envVariables.firebaseServiceAccount()))
            : applicationDefault(),
        databaseURL: isProduction ? undefined : envVariables.getDbUrl()
    }

    initializeApp(firebaseConfig)
    firestoreInstance = admin.firestore()

    if (isProduction) {
        console.log('🔥 Connecting to production Firestore...')
    } else if (isTestingEnvironment || isLocal) {
        console.log('🔥 Connecting to Firestore emulator...')
        console.log('💡 TIP: If connection hangs, ensure the emulator is running')
    }

    await testFirestoreConnection()
    console.log('✅ Firebase initialized successfully\n')
}

/**
 * Initializes Supabase client with credentials from environment
 * @throws Error if required environment variables are missing
 */
function initializeSupabase(): void {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials in environment variables')
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client initialized\n')
}

// =============================================================================
// MIGRATION FUNCTIONS
// =============================================================================

/**
 * Migrates facilities from Firestore to Supabase
 * Transforms data structure to match SQL schema
 * @returns Number of facilities migrated
 */
async function migrateFacilities(): Promise<number> {
    console.log('📦 Step 1: Migrating facilities...')

    const snapshot = await firestoreInstance.collection('facilities').get()

    if (snapshot.empty) {
        console.log('⚠️  No facilities found in Firestore')
        return 0
    }

    const facilities = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreFacility

        return {
            firestore_id: doc.id,
            nameEn: data.nameEn || null,
            nameJa: data.nameJa || null,
            contact: data.contact || {},
            mapLatitude: data.mapLatitude || null,
            mapLongitude: data.mapLongitude || null,
            createdDate: convertTimestampToISO(data.createdDate),
            updatedDate: convertTimestampToISO(data.updatedDate)
        }
    })

    console.log(`   Found ${facilities.length} facilities to migrate`)

    const { error } = await supabaseClient
        .from('facilities')
        .upsert(facilities, { onConflict: 'firestore_id' })

    if (error) {
        console.error('❌ Error migrating facilities:', error)
        throw error
    }

    console.log(`✅ Successfully migrated ${facilities.length} facilities\n`)
    return facilities.length
}

/**
 * Migrates healthcare professionals from Firestore to Supabase
 * Processes in batches to handle large datasets efficiently
 * @returns Number of healthcare professionals migrated
 */
async function migrateHealthcareProfessionals(): Promise<number> {
    console.log('📦 Step 2: Migrating healthcare professionals...')

    const snapshot = await firestoreInstance.collection('healthcareProfessionals').get()

    if (snapshot.empty) {
        console.log('⚠️  No healthcare professionals found in Firestore')
        return 0
    }

    console.log(`   Found ${snapshot.docs.length} healthcare professionals to migrate`)

    const BATCH_SIZE = 100
    let totalMigrated = 0

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
        const batchDocs = snapshot.docs.slice(i, i + BATCH_SIZE)
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1
        const totalBatches = Math.ceil(snapshot.docs.length / BATCH_SIZE)

        console.log(`   Processing batch ${batchNumber}/${totalBatches}...`)

        // Transform healthcare professional data
        const hps = batchDocs.map(doc => {
            const data = doc.data() as FirestoreHealthcareProfessional

            return {
                firestore_id: doc.id,
                email: data.email || null,
                names: data.names || [],
                degrees: data.degrees || [],
                specialties: data.specialties || [],
                spokenLanguages: data.spokenLanguages || [],
                acceptedInsurance: data.acceptedInsurance || [],
                additionalInfoForPatients: data.additionalInfoForPatients || null,
                createdDate: convertTimestampToISO(data.createdDate),
                updatedDate: convertTimestampToISO(data.updatedDate)
            }
        })

        // Insert healthcare professionals
        const { error: hpsError } = await supabaseClient
            .from('hps')
            .upsert(hps, { onConflict: 'firestore_id' })

        if (hpsError) {
            console.error('❌ Error migrating healthcare professionals batch:', hpsError)
            throw hpsError
        }

        // Fetch the newly created UUIDs for relationship mapping
        const firestoreIds = batchDocs.map(doc => doc.id)
        const { data: existingHps, error: fetchError } = await supabaseClient
            .from('hps')
            .select('id, firestore_id')
            .in('firestore_id', firestoreIds)

        if (fetchError) {
            console.error('❌ Error fetching healthcare professional IDs:', fetchError)
            throw fetchError
        }

        // Migrate facility relationships for this batch
        await migrateHpsFacilitiesRelationships(batchDocs, existingHps)

        totalMigrated += batchDocs.length
    }

    console.log(`✅ Successfully migrated ${totalMigrated} healthcare professionals\n`)
    return totalMigrated
}

/**
 * Migrates many-to-many relationships between HPs and facilities
 * @param hpDocs - Firestore documents for healthcare professionals
 * @param supabaseHps - Corresponding Supabase records with UUIDs
 */
async function migrateHpsFacilitiesRelationships(
    hpDocs: FirebaseFirestore.QueryDocumentSnapshot[],
    supabaseHps: Array<{ id: string; firestore_id: string }>
): Promise<void> {
    // Fetch all facilities to map Firestore IDs to Supabase UUIDs
    const { data: facilities, error: facilitiesError } = await supabaseClient
        .from('facilities')
        .select('id, firestore_id')

    if (facilitiesError) {
        console.error('❌ Error fetching facilities:', facilitiesError)
        throw facilitiesError
    }

    const hpIdMap = createIdMap(supabaseHps)
    const facilityIdMap = createIdMap(facilities)

    // Build relationship records
    const relationships = hpDocs.flatMap(doc => {
        const data = doc.data() as FirestoreHealthcareProfessional
        const hpSupabaseId = hpIdMap.get(doc.id)

        if (!hpSupabaseId || !data.facilityIds || !Array.isArray(data.facilityIds)) {
            return []
        }

        return data.facilityIds
            .map(facilityFirestoreId => ({
                hps_id: hpSupabaseId,
                facilities_id: facilityIdMap.get(facilityFirestoreId)
            }))
            .filter(rel => rel.facilities_id !== undefined)
    })

    if (relationships.length === 0) {
        console.log('   No HP-facility relationships found in this batch')
        return
    }

    console.log(`   Migrating ${relationships.length} HP-facility relationships...`)

    const { error } = await supabaseClient
        .from('hps_facilities')
        .upsert(relationships, { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true })

    if (error) {
        console.error('❌ Error migrating HP-facility relationships:', error)
        throw error
    }

    console.log(`   ✅ Migrated ${relationships.length} relationships`)
}

/**
 * Migrates submissions from Firestore to Supabase
 * Maps relationships to existing HPs and facilities using UUIDs
 * @returns Number of submissions migrated
 */
async function migrateSubmissions(): Promise<number> {
    console.log('📦 Step 3: Migrating submissions...')

    const snapshot = await firestoreInstance.collection('submissions').get()

    if (snapshot.empty) {
        console.log('⚠️  No submissions found in Firestore')
        return 0
    }

    console.log(`   Found ${snapshot.docs.length} submissions to migrate`)

    // Fetch ID mappings for relationships
    const { data: hps, error: hpsError } = await supabaseClient
        .from('hps')
        .select('id, firestore_id')

    const { data: facilities, error: facilitiesError } = await supabaseClient
        .from('facilities')
        .select('id, firestore_id')

    if (hpsError || facilitiesError) {
        console.error('❌ Error fetching ID mappings:', hpsError || facilitiesError)
        throw hpsError || facilitiesError
    }

    const hpIdMap = createIdMap(hps)
    const facilityIdMap = createIdMap(facilities)

    // Transform submission data
    const submissions = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreSubmission

        // Determine submission status
        const status = getSubmissionStatus(
            data.isApproved,
            data.isRejected,
            data.isUnderReview
        )

        // Map Firestore IDs to Supabase UUIDs
        const facilityFirestoreId = data.facility?.id
        const hpFirestoreIds = (data.healthcareProfessionals || [])
            .map(hp => hp.id)
            .filter(Boolean)

        const facilitySupabaseId = facilityFirestoreId
            ? facilityIdMap.get(facilityFirestoreId)
            : null

        const hpSupabaseIds = hpFirestoreIds
            .map(id => hpIdMap.get(id!))
            .filter(Boolean)

        return {
            firestore_id: doc.id,
            // Link to first HP (main healthcare professional for the submission)
            hps_id: hpSupabaseIds[0] || null,
            facilities_id: facilitySupabaseId || null,
            status,
            googleMapsUrl: data.googleMapsUrl || '',
            healthcareProfessionalName: data.healthcareProfessionalName || '',
            spokenLanguages: data.spokenLanguages || [],
            autofillPlaceFromSubmissionUrl: data.autofillPlaceFromSubmissionUrl || false,
            // Store partial data as JSONB for submissions not yet approved
            facility_partial: data.facility || null,
            healthcare_professionals_partial: data.healthcareProfessionals || [],
            notes: data.notes || null,
            createdDate: convertTimestampToISO(data.createdDate),
            updatedDate: convertTimestampToISO(data.updatedDate)
        }
    })

    const { error } = await supabaseClient
        .from('submissions')
        .upsert(submissions, { onConflict: 'firestore_id' })

    if (error) {
        console.error('❌ Error migrating submissions:', error)
        throw error
    }

    console.log(`✅ Successfully migrated ${submissions.length} submissions\n`)
    return submissions.length
}

// =============================================================================
// MAIN MIGRATION ORCHESTRATION
// =============================================================================

/**
 * Main migration function that orchestrates the entire migration process
 * Migrates data in the correct order to maintain referential integrity:
 * 1. Facilities (no dependencies)
 * 2. Healthcare Professionals + their facility relationships
 * 3. Submissions (depends on both HPs and facilities)
 */
async function runMigration(): Promise<void> {
    console.log('🚀 ========================================')
    console.log('🚀 Starting Firestore → Supabase Migration')
    console.log('🚀 ========================================\n')

    const startTime = Date.now()

    try {
        // Initialize connections
        await initializeFirebase()
        initializeSupabase()

        // Run migrations in order (maintaining referential integrity)
        const facilitiesCount = await migrateFacilities()
        const hpsCount = await migrateHealthcareProfessionals()
        const submissionsCount = await migrateSubmissions()

        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log('🎉 ========================================')
        console.log('🎉 Migration Completed Successfully!')
        console.log('🎉 ========================================')
        console.log(`\n📊 Migration Summary:`)
        console.log(`   • Facilities:              ${facilitiesCount}`)
        console.log(`   • Healthcare Professionals: ${hpsCount}`)
        console.log(`   • Submissions:             ${submissionsCount}`)
        console.log(`   • Total Duration:          ${duration}s\n`)

    } catch (error) {
        console.error('\n❌ ========================================')
        console.error('❌ Migration Failed')
        console.error('❌ ========================================')
        console.error(`\n💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`)

        if (error instanceof Error && error.stack) {
            console.error(`\n📋 Stack trace:\n${error.stack}`)
        }

        process.exit(1)
    }
}

// =============================================================================
// SCRIPT ENTRY POINT
// =============================================================================

// Execute migration
runMigration()