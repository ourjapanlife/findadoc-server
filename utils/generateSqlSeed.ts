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
        const cleanupStatements = [
            '-- Clean up existing data to ensure a fresh start',
            'DELETE FROM hps_facilities;',
            'DELETE FROM healthcare_professionals;',
            'DELETE FROM facilities;',
            'DELETE FROM submissions;',
            '------------------------------------\n'
        ]
        sqlStatements.push(...cleanupStatements)


        const facilitiesData = generateRandomCreateFacilityInputArray({ count: NUM_FACILITIES })
        const facilityIds: string[] = [] // Store IDs for linking HPs later

        for (const facility of facilitiesData) {
            const facilityId = uuidv4()
            facilityIds.push(facilityId)

            // The 'contact' field is a complex object (ContactInput) and must be inserted as JSONB.
            const contactJson = JSON.stringify(facility.contact)

            // Columns used: id, nameEn, nameJa, mapLatitude, mapLongitude, contact (JSONB)
            const statement = `
            INSERT INTO facilities (
            id, nameEn, nameJa, mapLatitude, mapLongitude, contact
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

        // --- 2. HEALTHCARE PROFESSIONALS (Table 'healthcare_professionals') ---
        const healthcareProfessionalsData = generateRandomCreateHealthcareProfessionalInputArray({
            count: NUM_HPS,
            facilityIdOptions: facilityIds // Pass facility IDs to allow realistic associations
        })

        const hpIdToFacilityIdsMap = new Map<string, string[]>()

        for (const hpWithRelations of healthcareProfessionalsData) {
            const hpId = uuidv4()
            const { coreData, selectedFacilityIds } = hpWithRelations
            
            // Store the associations for the junction table creation later
            hpIdToFacilityIdsMap.set(hpId, selectedFacilityIds) 

            const statement = `INSERT INTO healthcare_professionals (
                id, names, degrees, specialties, spoken_languages, accepted_insurance, additional_info_for_patients
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
        console.log(`✅ Generated ${NUM_HPS} INSERTs for 'healthcare_professionals'.`)


        // --- 3. HP <-> FACILITY RELATIONS (Junction Table 'hps_facilities') ---
        let relationshipCount = 0
        hpIdToFacilityIdsMap.forEach((facilityIds, hpId) => {
            for (const facilityId of facilityIds) {
                const statement = `INSERT INTO hps_facilities (hp_id, facility_id) VALUES (
                    ${toSqlValue(hpId)}, 
                    ${toSqlValue(facilityId)}
                );`
                sqlStatements.push(statement)
                relationshipCount++
            }
        })
        console.log(`✅ Generated ${relationshipCount} INSERTs for 'hps_facilities' (relations).`)


        // --- 4. SUBMISSIONS (Table 'submissions') ---
        for (let i = 0; i < NUM_SUBMISSIONS; i++) {
            // Generate a random submission, setting the status for variety
            const submissionStatus = i % 3 === 0 ? { isApproved: true } : 
                                     i % 3 === 1 ? { isUnderReview: true } : 
                                     { isRejected: true };

            const submissionData = generateRandomUpdateSubmissionInput(submissionStatus)
            
            const submissionId = uuidv4()
            const submissionStatement = `INSERT INTO submissions (
                id, google_maps_url, healthcare_professional_name, spoken_languages, 
                facility_data, healthcare_professionals_data, is_approved, is_rejected, is_under_review
            ) VALUES (
                ${toSqlValue(submissionId)}, 
                ${toSqlValue(submissionData.googleMapsUrl)}, 
                ${toSqlValue(submissionData.healthcareProfessionalName)}, 
                ${toSqlValue(submissionData.spokenLanguages)}, 
                ${toSqlValue(submissionData.facility)}, 
                ${toSqlValue(submissionData.healthcareProfessionals)}, 
                ${toSqlValue(submissionData.isApproved)}, 
                ${toSqlValue(submissionData.isRejected)}, 
                ${toSqlValue(submissionData.isUnderReview)}
            );`
            sqlStatements.push(submissionStatement)
        }
        console.log(`✅ Generated ${NUM_SUBMISSIONS} INSERTs for 'submissions'.`)


        // --- Write Final File ---
        const fileContent = sqlStatements.join('\n')
        fs.writeFileSync(OUTPUT_FILE, fileContent)
        console.log(`\n🎉 SQL Database Seed successfully generated at: ${OUTPUT_FILE} 🎉`)

    } catch (error) {
        console.error(`❌ Error during SQL seed generation: ${error} ❌`)
        throw new Error(`❌ Error during SQL seed generation: ${error} ❌`)
    }
}

generateSqlSeed().catch(error => {
    console.error('Seed generation failed:', error);
    process.exit(1);
});
