import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import * as dbTypes from '../typeDefs/dbSchema'
import { ErrorCode, Result } from '../result'
import { addHealthcareProfessional } from './healthcareProfessionalService'
import { dbInstance } from '../firebaseDb'
import { hasSpecialCharacters } from '../../utils/stringUtils'

export const getFacilityById = async (id: string): Promise<Result<gqlTypes.Facility | null>> => {
    const validationResult = validateIdInput(id)

    if (validationResult.hasErrors) {
        return validationResult
    }

    const facilityRef = dbInstance.collection('facilities')
    const snapshot = await facilityRef.where('id', '==', id).get()

    if (snapshot.docs.length < 1) {
        return {
            data: null,
            hasErrors: false
        }
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    const searchResults = {
        data: convertedEntity,
        hasErrors: false
    }

    return searchResults
}

export async function searchFacilities(filters: gqlTypes.FacilitySearchFilters = {}):
    Promise<Result<gqlTypes.Facility[]>> {
    try {
        const validationResult = validateFacilitiesSearchInput(filters)

        if (validationResult.hasErrors) {
            return validationResult
        }

        let subRef: Query<DocumentData> = dbInstance.collection('facilities')

        if (filters.nameEn) {
            subRef = subRef.where('nameEn', '==', filters.nameEn)
        }

        if (filters.nameJa) {
            subRef = subRef.where('nameJa', '==', filters.nameJa)
        }

        if (filters.isDeleted !== null && filters.isDeleted !== undefined) {
            subRef = subRef.where('isDeleted', '==', filters.isDeleted)
        }

        if (filters.createdDate) {
            subRef = subRef.where('createdDate', '==', filters.createdDate)
        }

        if (filters.updatedDate) {
            subRef = subRef.where('updatedDate', '==', filters.updatedDate)
        }

        if (filters.orderBy && Array.isArray(filters.orderBy)) {
            filters.orderBy.forEach(order => {
                if (order) {
                    subRef = subRef.orderBy(order.fieldToOrder as string,
                        order.orderDirection as gqlTypes.OrderDirection)
                }
            })
        } else {
            subRef = subRef.orderBy('createdDate', gqlTypes.OrderDirection.Desc)
        }

        subRef = subRef.limit(filters.limit || 20)

        const snapshot = await subRef.get()

        const facilities = snapshot.docs.map(doc =>
            mapDbEntityTogqlEntity({ ...doc.data(), id: doc.id }))

        const searchResults = {
            data: facilities,
            hasErrors: false
        }

        return searchResults
    } catch (error) {
        throw new Error(`Error retrieving submissions: ${error}`)
    }
}

export async function addFacility(input: gqlTypes.FacilityInput): Promise<Result<string>> {
    const validationResult = validateAddFacilitiesInput(input)

    if (validationResult.hasErrors) {
        return validationResult
    }

    const addFacilityResult : Result<string> = {
        hasErrors: false,
        errors: []
    }

    const facilityRef = dbInstance.collection('facilities').doc()
    const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()

    const healthcareProfessionalIds = [] as string[]

    if (input.healthcareProfessionals && input.healthcareProfessionals.length) {
        for await (const profEntity of input.healthcareProfessionals) {
            const healthcareProfAddResults = await addHealthcareProfessional(
                profEntity as gqlTypes.HealthcareProfessional, healthcareProfessionalRef
            )

            if (healthcareProfAddResults.hasErrors && healthcareProfAddResults.errors?.length) {
                addFacilityResult.hasErrors = true
                addFacilityResult.errors?.concat(healthcareProfAddResults.errors)
            } else {
                healthcareProfessionalIds.push(healthcareProfAddResults.data as string)
            }
        }
    }

    const newFacility = {
        id: facilityRef.id as string,
        contact: input.contact as dbTypes.Contact || undefined,
        healthcareProfessionalIds: healthcareProfessionalIds,
        // we just save the ids to the db, then load the full entities when we need them in queries
        healthcareProfessionals: [],
        nameEn: input.nameEn as string,
        nameJa: input.nameJa as string,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    } satisfies dbTypes.Facility

    await facilityRef.set(newFacility)

    addFacilityResult.data = newFacility.id

    return addFacilityResult
}

const mapDbEntityTogqlEntity = (dbEntity: DocumentData): gqlTypes.Facility => {
    const gqlEntity = {
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        healthcareProfessionalIds: dbEntity.healthcareProfessionalIds,
        healthcareProfessionals: dbEntity.healthcareProfessionals
    } satisfies gqlTypes.Facility

    return gqlEntity
}

function validateIdInput(id: string): Result<gqlTypes.Facility> {
    const validationResults: Result<gqlTypes.Facility> = {
        hasErrors: false,
        errors: []
    }

    if (id && (hasSpecialCharacters(id) || id.length > 4096)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
    }

    return validationResults
}

function validateFacilitiesSearchInput(searchInput: gqlTypes.FacilitySearchFilters): Result<gqlTypes.Facility[]> {
    const validationResults: Result<gqlTypes.Facility[]> = {
        hasErrors: false,
        errors: []
    }

    if (searchInput.nameEn && searchInput.nameEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.nameJa && searchInput.nameJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.limit && searchInput.limit > 1000) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    return validationResults
}

function validateAddFacilitiesInput(input: gqlTypes.FacilityInput): Result<string> {
    const validationResults: Result<string> = {
        hasErrors: false,
        errors: []
    }

    if (input.nameEn && input.nameEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.nameJa && input.nameJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.contact) {
        const contactValidationResults = validateContactInput(input.contact)

        if (contactValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...contactValidationResults.errors as [])
        }
    }

    return validationResults
}

function validateContactInput(contactInput: gqlTypes.Contact): Result<boolean> {
    const validationResults: Result<boolean> = {
        hasErrors: false,
        errors: []
    }

    if (!contactInput) {
        return validationResults
    }

    // const facilityContact = {
    //     address: contactInput.address as gqlTypes.PhysicalAddress,
    //     email: contactInput.email as string,
    //     mapsLink: contactInput.mapsLink as string,
    //     phone: contactInput.phone as string,
    //     website: contactInput.website as string
    // }

    if (contactInput.email && (hasSpecialCharacters(contactInput.email) || contactInput.email.length > 128)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
    }

    return validationResults
}
