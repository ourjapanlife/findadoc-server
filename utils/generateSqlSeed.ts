import { generateRandomCreateHealthcareProfessionalInputArray } from '../src/fakeData/fakeHealthcareProfessionals.ts'
import { generateRandomCreateFacilityInputArray } from '../src/fakeData/fakeFacilities.ts'
import { generateRandomUpdateSubmissionInput } from '../src/fakeData/fakeSubmissions.ts'
import { logger } from '../src/logger.ts'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Define the output file path. This script assumes it runs from a 'utils' directory.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_FILE = path.join(__dirname, 'seed_data.sql')

/**
 * Converts a JavaScript value into a PostgreSQL-compatible SQL string literal.
 * Complex types (arrays, objects) are serialized to JSON string for 'jsonb' columns.
 * Single quotes within strings are escaped by doubling them (' -> '').
 * @param value The value to convert.
 * @returns The SQL string literal (e.g., 'value', 123, TRUE, or '{"key":"value"}').
 */
function toSqlValue(value: any): string {
    if (value === null || typeof value === 'undefined') {
        return 'NULL'
    }
    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE'
    }
    if (typeof value === 'number') {
        return value.toString()
    }
    if (typeof value === 'object') {
        // Serialize arrays and objects into JSON string for PostgreSQL jsonb columns
        // We must escape any single quotes inside the JSON string itself.
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`
    }
    // Escape single quotes in regular strings and enclose in quotes
    return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * Converts boolean status flags into a single status string.
 * This matches our SQL schema where status is a varchar column.
 * @param isApproved Whether the submission is approved
 * @param isRejected Whether the submission is rejected
 * @param isUnderReview Whether the submission is under review
 * @returns Status string: 'approved', 'rejected', 'under_review', or 'pending'
 */
function getStatusFromBooleans(
    isApproved?: boolean | null,
    isRejected?: boolean | null,
    isUnderReview?: boolean | null
): string {
    if (isApproved) return 'approved'
    if (isRejected) return 'rejected'
    if (isUnderReview) return 'under_review'
    return 'pending'
}

// --- Main Seed Generation Function ---

/**
 * Generates SQL INSERT statements for all core tables and writes them to a file.
 * This is the new seeding strategy for a relational database (PostgreSQL).
 */
export const generateSqlSeed = async () => {
    try {
        const sqlStatements: string[] = []
        const NUM_FACILITIES = 5
        const NUM_HPS = 5
        const NUM_SUBMISSIONS = 5

        // --- Cleanup Statements ---
        // Remove all existing data to start fresh
        const cleanupStatements = [
            '-- Clean up existing data to ensure a fresh start',
            'DELETE FROM hps_facilities;',
            'DELETE FROM hps;',
            'DELETE FROM facilities;',
            'DELETE FROM submissions;',
            '------------------------------------\n'
        ]
        sqlStatements.push(...cleanupStatements)

        // --- 1. FACILITIES (Table 'facilities') ---
        // Generate random facility data for testing
        const facilitiesData = generateRandomCreateFacilityInputArray({ count: NUM_FACILITIES })
        const facilityIds: string[] = [] // Store IDs for linking HPs later

        for (const facility of facilitiesData) {
            const facilityId = uuidv4()
            facilityIds.push(facilityId)

            // The 'contact' field is a complex object (ContactInput) and must be inserted as JSONB.
            const contactJson = JSON.stringify(facility.contact)

            // Insert facility with all required columns
            // Note: Using camelCase column names as defined in the SQL schema
            const statement = `
            INSERT INTO facilities (
                id, "nameEn", "nameJa", "mapLatitude", "mapLongitude", contact
            ) VALUES (
                ${toSqlValue(facilityId)}, 
                ${toSqlValue(facility.nameEn)}, 
                ${toSqlValue(facility.nameJa)}, 
                ${toSqlValue(facility.mapLatitude)}, 
                ${toSqlValue(facility.mapLongitude)}, 
                ${toSqlValue(contactJson)}
            );`
            sqlStatements.push(statement)
        }

        console.log(`✅ Generated ${NUM_FACILITIES} facility records.`)

        // --- 2. HEALTHCARE PROFESSIONALS (Table 'hps') ---
        // Generate random healthcare professional data with facility associations
        const healthcareProfessionalsData = generateRandomCreateHealthcareProfessionalInputArray({
            count: NUM_HPS,
            facilityIdOptions: facilityIds // Pass facility IDs to allow realistic associations
        })

        // Map to store HP -> Facility relationships for junction table
        const hpIdToFacilityIdsMap = new Map<string, string[]>()

        for (const hpWithRelations of healthcareProfessionalsData) {
            const hpId = uuidv4()
            const { coreData, selectedFacilityIds } = hpWithRelations
            
            // Store the associations for the junction table creation later
            hpIdToFacilityIdsMap.set(hpId, selectedFacilityIds) 

            // Insert healthcare professional with JSONB fields for arrays
            // Note: Using snake_case and camelCase as defined in SQL schema
            const statement = `INSERT INTO hps (
                id, names, degrees, specialties, "spokenLanguages", "acceptedInsurance", "additionalInfoForPatients"
            ) VALUES (
                ${toSqlValue(hpId)}, 
                ${toSqlValue(coreData.names)}, 
                ${toSqlValue(coreData.degrees)}, 
                ${toSqlValue(coreData.specialties)}, 
                ${toSqlValue(coreData.spokenLanguages)}, 
                ${toSqlValue(coreData.acceptedInsurance)}, 
                ${toSqlValue(coreData.additionalInfoForPatients)}
            );`
            sqlStatements.push(statement)
        }
        console.log(`✅ Generated ${NUM_HPS} INSERTs for 'hps'.`)

        // --- 3. HP <-> FACILITY RELATIONS (Junction Table 'hps_facilities') ---
        // Create many-to-many relationships between healthcare professionals and facilities
        let relationshipCount = 0
        hpIdToFacilityIdsMap.forEach((facilityIds, hpId) => {
            for (const facilityId of facilityIds) {
                // Insert relationship into junction table
                const statement = `INSERT INTO hps_facilities (hps_id, facilities_id) VALUES (
                    ${toSqlValue(hpId)}, 
                    ${toSqlValue(facilityId)}
                );`
                sqlStatements.push(statement)
                relationshipCount++
            }
        })
        console.log(`✅ Generated ${relationshipCount} INSERTs for 'hps_facilities' (many-to-many relations).`)

        // --- 4. SUBMISSIONS (Table 'submissions') ---
        // Generate submissions with varying statuses for testing
        for (let i = 0; i < NUM_SUBMISSIONS; i++) {
            // Cycle through different statuses to create variety in test data
            const submissionStatus = i % 3 === 0 ? { isApproved: true } : 
                                     i % 3 === 1 ? { isUnderReview: true } : 
                                     { isRejected: true }

            const submissionData = generateRandomUpdateSubmissionInput(submissionStatus)
            
            // Convert boolean status flags to single status string
            const statusString = getStatusFromBooleans(
                submissionData.isApproved,
                submissionData.isRejected,
                submissionData.isUnderReview
            )
            
            const submissionId = uuidv4()
            
            // Insert submission with partial data (before approval)
            // facility_partial and healthcare_professionals_partial store temporary data
            // hps_id and facilities_id are NULL until the submission is approved
            const submissionStatement = `INSERT INTO submissions (
                id, "googleMapsUrl", "healthcareProfessionalName", "spokenLanguages", 
                facility_partial, healthcare_professionals_partial, 
                status, hps_id, facilities_id, "autofillPlaceFromSubmissionUrl",
                "createdDate", "updatedDate"
            ) VALUES (
                ${toSqlValue(submissionId)}, 
                ${toSqlValue(submissionData.googleMapsUrl)}, 
                ${toSqlValue(submissionData.healthcareProfessionalName)}, 
                ${toSqlValue(submissionData.spokenLanguages)}, 
                ${toSqlValue(submissionData.facility)}, 
                ${toSqlValue(submissionData.healthcareProfessionals)}, 
                ${toSqlValue(statusString)},
                ${toSqlValue(null)},
                ${toSqlValue(null)},
                ${toSqlValue(false)},
                ${toSqlValue(new Date().toISOString())},
                ${toSqlValue(new Date().toISOString())}
            );`
            sqlStatements.push(submissionStatement)
        }
        console.log(`✅ Generated ${NUM_SUBMISSIONS} INSERTs for 'submissions'.`)

        // --- Write Final File ---
        // Combine all SQL statements and write to output file
        const fileContent = sqlStatements.join('\n')
        fs.writeFileSync(OUTPUT_FILE, fileContent)
        console.log(`\n🎉 SQL Database Seed successfully generated at: ${OUTPUT_FILE} 🎉`)

    } catch (error) {
        console.error(`❌ Error during SQL seed generation: ${error} ❌`)
        throw new Error(`❌ Error during SQL seed generation: ${error} ❌`)
    }
}

// Execute the seed generation
generateSqlSeed().catch(error => {
    console.error('Seed generation failed:', error)
    process.exit(1)
})
