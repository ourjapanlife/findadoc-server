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
        spokenLanguages: hp.spokenLanguages ?? [],
        specialties: hp.specialties ?? [],
        acceptedInsurance: hp.acceptedInsurance ?? [],
        facilityIds,
        createdDate: hp.createdDate,
        updatedDate: hp.updatedDate,
        additionalInfoForPatients: hp.additionalInfoForPatients
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
        spokenLanguages: cleanHpRow.spokenLanguages ?? [],
        specialties: cleanHpRow.specialties ?? [],
        acceptedInsurance: cleanHpRow.acceptedInsurance ?? [],
        facilityIds,
        createdDate: cleanHpRow.createdDate,
        updatedDate: cleanHpRow.updatedDate,
        additionalInfoForPatients: cleanHpRow.additionalInfoForPatients ?? null
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
        nameEn: cleanRow.nameEn,
        nameJa: cleanRow.nameJa,
        contact: cleanRow.contact,
        mapLatitude: cleanRow.mapLatitude,
        mapLongitude: cleanRow.mapLongitude,
        healthcareProfessionalIds,
        createdDate: cleanRow.createdDate,
        updatedDate: cleanRow.updatedDate
    }
}

// ==== SUBMISSIONS MAPPERS ====

export function mapDbEntityTogqlEntity(row: dbSchema.SubmissionRow): gqlTypes.Submission {
    return {
        id: row.id,
        googleMapsUrl: row.googleMapsUrl,
        healthcareProfessionalName: row.healthcareProfessionalName,
        spokenLanguages: row.spokenLanguages as gqlTypes.Locale[],
        autofillPlaceFromSubmissionUrl: row.autofillPlaceFromSubmissionUrl,
        facility: row.facility_partial ? {
            ...row.facility_partial,
            healthcareProfessionalIds: row.facility_partial.healthcareProfessionalIds ?? [] // ← FIX!
        } : undefined,
        healthcareProfessionals: row.healthcare_professionals_partial ?? [],
        isUnderReview: row.status === dbSchema.SUBMISSION_STATUS.UNDER_REVIEW,
        isApproved: row.status === dbSchema.SUBMISSION_STATUS.APPROVED,
        isRejected: row.status === dbSchema.SUBMISSION_STATUS.REJECTED,
        createdDate: row.createdDate,
        updatedDate: row.updatedDate,
        notes: row.notes ?? undefined
    }
}

export function mapGqlEntityToDbEntity(
    input: gqlTypes.CreateSubmissionInput
): dbSchema.SubmissionInsertRow {
    return {
        status: dbSchema.SUBMISSION_STATUS.PENDING,
        googleMapsUrl: input.googleMapsUrl ?? '',
        healthcareProfessionalName: input.healthcareProfessionalName ?? '',
        spokenLanguages: (input.spokenLanguages ?? []) as gqlTypes.Locale[],
        autofillPlaceFromSubmissionUrl: false,
        
        //eslint-disable-next-line
        facility_partial: null,
        //eslint-disable-next-line
        healthcare_professionals_partial: null,
        
        //eslint-disable-next-line
        hps_id: null,
        //eslint-disable-next-line
        facilities_id: null,
        
        notes: input.notes ?? null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
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
        googleMapsUrl: cleanSubmissionRow.googleMapsUrl!,
        healthcareProfessionalName: cleanSubmissionRow.healthcareProfessionalName!,
        spokenLanguages: cleanSubmissionRow.spokenLanguages!,
        autofillPlaceFromSubmissionUrl: cleanSubmissionRow.autofillPlaceFromSubmissionUrl,
        facility: cleanSubmissionRow.facility_partial ? {
            ...cleanSubmissionRow.facility_partial,
            healthcareProfessionalIds: cleanSubmissionRow.facility_partial.healthcareProfessionalIds ?? []
        } : undefined,
        healthcareProfessionals: cleanSubmissionRow.healthcare_professionals_partial ?? [],
        isUnderReview: cleanSubmissionRow.status === 'under_review',
        isApproved: cleanSubmissionRow.status === 'approved',
        isRejected: cleanSubmissionRow.status === 'rejected',
        createdDate: cleanSubmissionRow.createdDate,
        updatedDate: cleanSubmissionRow.updatedDate,
        notes: cleanSubmissionRow.notes ?? undefined
    }
}

