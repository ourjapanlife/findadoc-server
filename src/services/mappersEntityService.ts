import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import type { HpsTable, FacilitiesTable, SubmissionsTable } from '../typeDefs/kyselyTypes.js'
import type { Selectable } from 'kysely'

// ==== HEALTHCARE PROFESSIONAL MAPPERS ====

export function mapDbHpToGql(
  hp: dbSchema.DbHealthcareProfessionalRow,
  facilityIds: string[]
): gqlTypes.HealthcareProfessional {
    return {
        id: hp.id,
        names: hp.names ?? [],
        degrees: hp.degrees ?? [],
        spokenLanguages: hp.spoken_languages ?? [],
        specialties: hp.specialties ?? [],
        acceptedInsurance: hp.accepted_insurance ?? [],
        facilityIds,
        createdDate: hp.created_date,
        updatedDate: hp.updated_date,
        additionalInfoForPatients: hp.additional_info_for_patients
    }
}

/**
 * Maps Kysely HP result to plain GraphQL HealthcareProfessional object.
 * 
 * PURPOSE:
 * - Converts Kysely database row types to GraphQL types
 * - Removes Kysely internal members (like #props) that would break GraphQL serialization
 * - Handles nullable fields with proper fallbacks (?? operator)
 * 
 * CRITICAL FOR GRAPHQL:
 * - GraphQL cannot serialize objects with private JavaScript members
 * - Kysely rows returned from .returningAll() have internal #props
 * - This function creates a "plain" JavaScript object safe for GraphQL responses
 * 
 * @param hpRow - Raw Kysely row from database
 * @param facilityIds - Related facility IDs for this HP
 * @returns Plain GraphQL HealthcareProfessional object (safe for serialization)
 */
export function mapKyselyHpToGraphQL(
    hpRow: Selectable<HpsTable>,
    facilityIds: string[]
): gqlTypes.HealthcareProfessional {
    const cleanHpRow = JSON.parse(JSON.stringify(hpRow))

    return {
        id: cleanHpRow.id,
        names: cleanHpRow.names ?? [],
        degrees: cleanHpRow.degrees ?? [],
        spokenLanguages: cleanHpRow.spoken_languages ?? [],
        specialties: cleanHpRow.specialties ?? [],
        acceptedInsurance: cleanHpRow.accepted_insurance ?? [],
        facilityIds,
        createdDate: cleanHpRow.created_date,
        updatedDate: cleanHpRow.updated_date,
        additionalInfoForPatients: cleanHpRow.additional_info_for_patients ?? null
    }
}

// ==== FACILITIES MAPPERS ====

/**
 * Maps Kysely Facility result to GraphQL Facility type
 * Use this when you need to transform DB types to GraphQL types
 */
/**
 * Maps Kysely Facility result to plain GraphQL Facility object.
 * CRITICAL: This function MUST return a plain JavaScript object without any
 * Kysely internal members (#props) that would cause GraphQL serialization errors.
 */
export function mapKyselyFacilityToGraphQL(
    facilityRow: Selectable<FacilitiesTable>,
    healthcareProfessionalIds: string[]
): gqlTypes.Facility {
    const cleanRow = JSON.parse(JSON.stringify(facilityRow))
    
    return {
        id: cleanRow.id,
        nameEn: cleanRow.name_en,
        nameJa: cleanRow.name_ja,
        contact: cleanRow.contact,
        mapLatitude: cleanRow.map_latitude,
        mapLongitude: cleanRow.map_longitude,
        healthcareProfessionalIds,
        createdDate: cleanRow.created_date,
        updatedDate: cleanRow.updated_date
    }
}

// ==== SUBMISSIONS MAPPERS ====

export function mapDbEntityTogqlEntity(row: dbSchema.SubmissionRow): gqlTypes.Submission {
    return {
        id: row.id,
        googleMapsUrl: row.google_maps_url,
        healthcareProfessionalName: row.healthcare_professional_name,
        spokenLanguages: row.spoken_languages as gqlTypes.Locale[],
        autofillPlaceFromSubmissionUrl: row.autofill_place_from_submission_url,
        facility: row.facility_partial ? {
            ...row.facility_partial,
            healthcareProfessionalIds: row.facility_partial.healthcareProfessionalIds ?? [] // ← FIX!
        } : undefined,
        healthcareProfessionals: row.healthcare_professionals_partial ?? [],
        isUnderReview: row.status === dbSchema.SUBMISSION_STATUS.UNDER_REVIEW,
        isApproved: row.status === dbSchema.SUBMISSION_STATUS.APPROVED,
        isRejected: row.status === dbSchema.SUBMISSION_STATUS.REJECTED,
        createdDate: row.created_date,
        updatedDate: row.updated_date,
        notes: row.notes ?? undefined
    }
}

export function mapGqlEntityToDbEntity(
    input: gqlTypes.CreateSubmissionInput
): dbSchema.SubmissionInsertRow {
    return {
        status: dbSchema.SUBMISSION_STATUS.PENDING,
        google_maps_url: input.googleMapsUrl ?? '',
        healthcare_professional_name: input.healthcareProfessionalName ?? '',
        spoken_languages: (input.spokenLanguages ?? []) as gqlTypes.Locale[],
        autofill_place_from_submission_url: false,
        
        //eslint-disable-next-line
        facility_partial: null,
        //eslint-disable-next-line
        healthcare_professionals_partial: null,
        
        //eslint-disable-next-line
        hps_id: null,
        //eslint-disable-next-line
        facilities_id: null,
        
        notes: input.notes ?? null,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
    }
}

export function mapKyselySubmissionToGraphQL(
    submissionRow: Selectable<SubmissionsTable>
): gqlTypes.Submission {
    // Test are failing because we didn't use
    // clean and cleanInput inside functions
    const cleanSubmissionRow = JSON.parse(JSON.stringify(submissionRow))

    return {
        id: cleanSubmissionRow.id,
        googleMapsUrl: cleanSubmissionRow.google_maps_url!,
        healthcareProfessionalName: cleanSubmissionRow.healthcare_professional_name!,
        spokenLanguages: cleanSubmissionRow.spoken_languages!,
        autofillPlaceFromSubmissionUrl: cleanSubmissionRow.autofill_place_from_submission_url,
        facility: cleanSubmissionRow.facility_partial ? {
            ...cleanSubmissionRow.facility_partial,
            healthcareProfessionalIds: cleanSubmissionRow.facility_partial.healthcareProfessionalIds ?? []
        } : undefined,
        healthcareProfessionals: cleanSubmissionRow.healthcare_professionals_partial ?? [],
        isUnderReview: cleanSubmissionRow.status === 'under_review',
        isApproved: cleanSubmissionRow.status === 'approved',
        isRejected: cleanSubmissionRow.status === 'rejected',
        createdDate: cleanSubmissionRow.created_date,
        updatedDate: cleanSubmissionRow.updated_date,
        notes: cleanSubmissionRow.notes ?? undefined
    }
}

