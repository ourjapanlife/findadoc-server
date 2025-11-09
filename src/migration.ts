/* eslint-disable */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { envVariables } from '../utils/environmentVariables.js'
import readline from 'readline'

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

interface MigrationStats {
    facilities: number
    healthcareProfessionals: number
    hpFacilityRelationships: number
    submissions: number
    duration: number
}

// =============================================================================
// CONFIGURATION & INITIALIZATION
// =============================================================================

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev'

dotenv.config({ path: envFile })

const isProduction = envVariables.isProduction()
const isLocal = envVariables.isLocal()
const isTestingEnvironment = envVariables.isTestingEnvironment()

// Dry run mode - simulates migration without writing to database
const DRY_RUN = process.env.DRY_RUN === 'true'

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
    if (!timestamp) { return null }

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
    if (isApproved) { return 'approved' }
    if (isRejected) { return 'rejected' }
    if (isUnderReview) { return 'under_review' }
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

/**
 * Prompts user for confirmation before proceeding
 * @param message - The confirmation message to display
 * @returns Promise that resolves to true if user confirms, false otherwise
 */
function askForConfirmation(message: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise(resolve => {
        rl.question(`${message} (yes/no): `, answer => {
            rl.close()
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
        })
    })
}

/**
 * Waits for a specified number of seconds with countdown display
 * @param seconds - Number of seconds to wait
 */
async function countdown(seconds: number): Promise<void> {
    for (let i = seconds; i > 0; i--) {
        process.stdout.write(`\r⏳ Starting in ${i} seconds... (Press Ctrl+C to cancel)`)
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
    process.stdout.write('\r✅ Proceeding with migration...                           \n\n')
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
        console.log('✅ Firestore connection established (READ-ONLY)')
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
    console.log('🔥 Initializing Firebase...')
    
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
        console.log('   📍 Environment: PRODUCTION')
        console.log('   🔒 Mode: READ-ONLY (Firestore will NOT be modified)')
    } else if (isTestingEnvironment || isLocal) {
        console.log('   📍 Environment: DEVELOPMENT/LOCAL')
        console.log('   💡 TIP: If connection hangs, ensure the Firestore emulator is running')
    }

    await testFirestoreConnection()
    console.log('✅ Firebase initialized successfully\n')
}

/**
 * Initializes Supabase client with credentials from environment
 * @throws Error if required environment variables are missing
 */
function initializeSupabase(): void {
    console.log('🔧 Initializing Supabase...')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('❌ Missing Supabase credentials in environment variables')
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey)
    
    if (DRY_RUN) {
        console.log('   🔍 DRY RUN MODE: No data will be written to Supabase')
    } else {
        console.log('   ⚠️  WRITE MODE: Data will be written to Supabase')
    }
    
    console.log(`   📍 Target: ${supabaseUrl}`)
    console.log('✅ Supabase client initialized\n')
}

// =============================================================================
// SAFETY CHECK FUNCTIONS
// =============================================================================

/**
 * Displays pre-migration safety information and warnings
 * Requires user confirmation before proceeding with production migrations
 */
async function performSafetyChecks(): Promise<void> {
    console.log('🛡️  ========================================')
    console.log('🛡️  PRE-MIGRATION SAFETY CHECKS')
    console.log('🛡️  ========================================\n')

    console.log('📋 Migration Summary:')
    console.log(`   • Environment:        ${isProduction ? 'PRODUCTION ⚠️' : 'DEVELOPMENT ✅'}`)
    console.log(`   • Dry Run:            ${DRY_RUN ? 'YES (Safe) ✅' : 'NO (Will write data) ⚠️'}`)
    console.log('   • Firestore:          READ-ONLY (Safe) ✅')
    console.log(`   • Supabase:           ${DRY_RUN ? 'READ-ONLY (Safe) ✅' : 'WRITE (Data will be modified) ⚠️'}`)
    console.log(`   • Config File:        ${envFile}`)
    console.log()

    if (isProduction && !DRY_RUN) {
        console.log('⚠️  WARNING: PRODUCTION MIGRATION ⚠️')
        console.log('   This will modify your production Supabase database!')
        console.log('   Firestore will remain unchanged (read-only).')
        console.log()
        console.log('📝 Pre-flight checklist:')
        console.log('   ☐ Firestore backup created?')
        console.log('   ☐ Supabase backup/snapshot created?')
        console.log('   ☐ Tested migration on local/dev environment?')
        console.log('   ☐ Verified schema compatibility?')
        console.log('   ☐ Ready to proceed with production migration?')
        console.log()

        const confirmed = await askForConfirmation('⚠️  Do you want to proceed with PRODUCTION migration?')
        
        if (!confirmed) {
            console.log('\n❌ Migration cancelled by user.')
            process.exit(0)
        }

        console.log('\n⏳ Starting migration in 10 seconds...')
        console.log('   (Press Ctrl+C to cancel)\n')
        await countdown(10)
    } else if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE ACTIVE')
        console.log('   Migration will be simulated without writing data.')
        console.log('   This is safe to run multiple times.\n')
        await countdown(3)
    } else {
        console.log('✅ Development migration - proceeding...\n')
        await countdown(3)
    }
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
        console.log('   ⚠️  No facilities found in Firestore')
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

    console.log(`   📊 Found ${facilities.length} facilities to migrate`)

    if (DRY_RUN) {
        console.log(`   🔍 DRY RUN: Would insert/update ${facilities.length} facilities`)
        console.log(`   📝 Sample data: ${facilities[0].nameEn} (${facilities[0].firestore_id})`)
    } else {
        const { error } = await supabaseClient
            .from('facilities')
            .upsert(facilities, { onConflict: 'firestore_id' })

        if (error) {
            console.error('   ❌ Error migrating facilities:', error)
            throw error
        }

        console.log(`   ✅ Successfully migrated ${facilities.length} facilities`)
    }

    console.log()
    return facilities.length
}

/**
 * Migrates healthcare professionals from Firestore to Supabase
 * Processes in batches to handle large datasets efficiently
 * @returns Object with count of HPs and relationships migrated
 */
async function migrateHealthcareProfessionals(): Promise<{ hps: number; relationships: number }> {
    console.log('📦 Step 2: Migrating healthcare professionals...')

    const snapshot = await firestoreInstance.collection('healthcareProfessionals').get()

    if (snapshot.empty) {
        console.log('   ⚠️  No healthcare professionals found in Firestore\n')
        return { hps: 0, relationships: 0 }
    }

    console.log(`   📊 Found ${snapshot.docs.length} healthcare professionals to migrate`)

    const BATCH_SIZE = 100
    let totalMigrated = 0
    let totalRelationships = 0

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
        const batchDocs = snapshot.docs.slice(i, i + BATCH_SIZE)
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1
        const totalBatches = Math.ceil(snapshot.docs.length / BATCH_SIZE)

        console.log(`   🔄 Processing batch ${batchNumber}/${totalBatches} (${batchDocs.length} records)...`)

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

        if (DRY_RUN) {
            console.log(`      🔍 DRY RUN: Would insert/update ${hps.length} healthcare professionals`)
        } else {
            // Insert healthcare professionals
            const { error: hpsError } = await supabaseClient
                .from('hps')
                .upsert(hps, { onConflict: 'firestore_id' })

            if (hpsError) {
                console.error('      ❌ Error migrating healthcare professionals:', hpsError)
                throw hpsError
            }

            console.log(`      ✅ Inserted ${hps.length} healthcare professionals`)
        }

        // Migrate facility relationships for this batch
        const relationshipsCount = await migrateHpsFacilitiesRelationships(batchDocs)
        
        totalMigrated += batchDocs.length
        totalRelationships += relationshipsCount
    }

    console.log(`   ✅ Successfully migrated ${totalMigrated} healthcare professionals`)
    console.log(`   ✅ Successfully migrated ${totalRelationships} HP-facility relationships`)
    console.log()
    
    return { hps: totalMigrated, relationships: totalRelationships }
}

/**
 * Migrates many-to-many relationships between HPs and facilities
 * @param hpDocs - Firestore documents for healthcare professionals
 * @returns Number of relationships migrated
 */
async function migrateHpsFacilitiesRelationships(
    hpDocs: FirebaseFirestore.QueryDocumentSnapshot[]
): Promise<number> {
    // Fetch all HP and facility IDs for mapping
    const firestoreIds = hpDocs.map(doc => doc.id)
    
    if (DRY_RUN) {
        // In dry run, simulate the mapping
        let relationshipCount = 0
        
        for (const doc of hpDocs) {
            const data = doc.data() as FirestoreHealthcareProfessional

            if (data.facilityIds && Array.isArray(data.facilityIds)) {
                relationshipCount += data.facilityIds.length
            }
        }
        
        if (relationshipCount > 0) {
            console.log(`      🔍 DRY RUN: Would insert ${relationshipCount} HP-facility relationships`)
        }
        
        return relationshipCount
    }

    // Fetch Supabase IDs for HPs in this batch
    const { data: supabaseHps, error: hpsError } = await supabaseClient
        .from('hps')
        .select('id, firestore_id')
        .in('firestore_id', firestoreIds)

    if (hpsError) {
        console.error('      ❌ Error fetching HP IDs:', hpsError)
        throw hpsError
    }

    // Fetch all facilities to map Firestore IDs to Supabase UUIDs
    const { data: facilities, error: facilitiesError } = await supabaseClient
        .from('facilities')
        .select('id, firestore_id')

    if (facilitiesError) {
        console.error('      ❌ Error fetching facility IDs:', facilitiesError)
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
        return 0
    }

    console.log(`      🔗 Migrating ${relationships.length} HP-facility relationships...`)

    const { error } = await supabaseClient
        .from('hps_facilities')
        .upsert(relationships, { onConflict: 'hps_id,facilities_id', ignoreDuplicates: true })

    if (error) {
        console.error('      ❌ Error migrating relationships:', error)
        throw error
    }

    console.log(`      ✅ Migrated ${relationships.length} relationships`)
    return relationships.length
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
        console.log('   ⚠️  No submissions found in Firestore\n')
        return 0
    }

    console.log(`   📊 Found ${snapshot.docs.length} submissions to migrate`)

    // Fetch ID mappings for relationships
    const { data: hps, error: hpsError } = await supabaseClient
        .from('hps')
        .select('id, firestore_id')

    const { data: facilities, error: facilitiesError } = await supabaseClient
        .from('facilities')
        .select('id, firestore_id')

    if (hpsError || facilitiesError) {
        console.error('   ❌ Error fetching ID mappings:', hpsError || facilitiesError)
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

    if (DRY_RUN) {
        console.log(`   🔍 DRY RUN: Would insert/update ${submissions.length} submissions`)
        console.log(`   📝 Sample: ${submissions[0].healthcareProfessionalName} - Status: ${submissions[0].status}`)
    } else {
        const { error } = await supabaseClient
            .from('submissions')
            .upsert(submissions, { onConflict: 'firestore_id' })

        if (error) {
            console.error('   ❌ Error migrating submissions:', error)
            throw error
        }

        console.log(`   ✅ Successfully migrated ${submissions.length} submissions`)
    }

    console.log()
    return submissions.length
}

// =============================================================================
// REPORTING FUNCTIONS
// =============================================================================

/**
 * Displays a detailed summary of the migration results
 * @param stats - Migration statistics
 */
function displayMigrationSummary(stats: MigrationStats): void {
    console.log('🎉 ========================================')
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!')
    console.log('🎉 ========================================\n')

    console.log('📊 Migration Summary:')
    console.log(`   • Environment:              ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`)
    console.log(`   • Mode:                     ${DRY_RUN ? 'DRY RUN (No data written)' : 'LIVE (Data written)'}`)
    console.log(`   • Facilities:               ${stats.facilities}`)
    console.log(`   • Healthcare Professionals: ${stats.healthcareProfessionals}`)
    console.log(`   • HP-Facility Links:        ${stats.hpFacilityRelationships}`)
    console.log(`   • Submissions:              ${stats.submissions}`)
    console.log(`   • Total Records:            ${stats.facilities + stats.healthcareProfessionals + stats.submissions}`)
    console.log(`   • Duration:                 ${stats.duration}s`)
    console.log()

    if (DRY_RUN) {
        console.log('💡 This was a DRY RUN - no data was written.')
        console.log('   To perform the actual migration, run without DRY_RUN=true')
        console.log()
    } else {
        console.log('✅ Data has been successfully migrated to Supabase.')
        console.log('🔒 Firestore data remains unchanged (read-only operation).')
        console.log()
        console.log('📝 Next Steps:')
        console.log('   1. Verify data in Supabase Studio')
        console.log('   2. Test application with new database')
        console.log('   3. Monitor for any issues')
        console.log('   4. Keep Firestore as backup for rollback if needed')
        console.log()
    }
}

/**
 * Displays error information and cleanup instructions
 * @param error - The error that occurred
 */
function displayErrorSummary(error: unknown): void {
    console.error('\n❌ ========================================')
    console.error('❌ MIGRATION FAILED')
    console.error('❌ ========================================\n')
    
    console.error('💥 Error Details:')
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    if (error instanceof Error && error.stack) {
        console.error('\n📋 Stack Trace:')
        console.error(error.stack)
    }

    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Check your network connection')
    console.error('   2. Verify environment variables are set correctly')
    console.error('   3. Ensure Firestore and Supabase are accessible')
    console.error('   4. Check the error message above for specific issues')
    console.error('   5. Review logs for more detailed error information')
    console.error()
    console.error('💡 TIP: Run with DRY_RUN=true to test without writing data')
    console.error()
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
    console.log('🚀 FIRESTORE → SUPABASE MIGRATION')
    console.log('🚀 ========================================\n')

    const startTime = Date.now()

    try {
        // Perform safety checks and get user confirmation if needed
        await performSafetyChecks()

        // Initialize connections
        await initializeFirebase()
        initializeSupabase()

        // Run migrations in order (maintaining referential integrity)
        console.log('📋 ========================================')
        console.log('📋 STARTING DATA MIGRATION')
        console.log('📋 ========================================\n')

        const facilitiesCount = await migrateFacilities()
        const { hps: hpsCount, relationships: relationshipsCount } = await migrateHealthcareProfessionals()
        const submissionsCount = await migrateSubmissions()

        // Calculate duration
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)

        // Display summary
        const stats: MigrationStats = {
            facilities: facilitiesCount,
            healthcareProfessionals: hpsCount,
            hpFacilityRelationships: relationshipsCount,
            submissions: submissionsCount,
            duration: parseFloat(duration)
        }

        displayMigrationSummary(stats)
    } catch (error) {
        displayErrorSummary(error)
        process.exit(1)
    }
}

// =============================================================================
// SCRIPT ENTRY POINT
// =============================================================================

// Display startup banner
console.clear()
console.log('╔════════════════════════════════════════╗')
console.log('║  FIRESTORE → SUPABASE MIGRATION TOOL  ║')
console.log('╚════════════════════════════════════════╝')
console.log()

// Execute migration
runMigration()