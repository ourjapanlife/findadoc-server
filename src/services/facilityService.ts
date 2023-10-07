import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import * as dbSchema from '../typeDefs/dbSchema'
import { ErrorCode, Result } from '../result'
import { addHealthcareProfessional } from './healthcareProfessionalService'
import { dbInstance } from '../firebaseDb'
import { hasSpecialCharacters, isValidEmail, isValidPhoneNumber, isValidWebsite } from '../../utils/stringUtils'

/**
 * Gets the Facility from the database that matches on the id.
 * @param id A string that matches the id of the Firestore Document for the Facility.
 * @returns A Facility object.
 */
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
        subRef = subRef.offset(filters.offset || 0)

        const snapshot = await subRef.get()

        const facilities = snapshot.docs.map(doc =>
            mapDbEntityTogqlEntity({ ...doc.data(), id: doc.id }))

        const searchResults = {
            data: facilities,
            hasErrors: false
        }

        return searchResults
    } catch (error) {
        console.log(`Error retrieving facilities: ${error}`)
        
        return {
            hasErrors: true,
            errors: [{
                field: 'searchFacilities',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Adds a new Facility with a new HealthcareProfessional. 
 * Only a list containing the `HealthcareProfessional.id` will 
 * be returned and not the whole HealthcareProfessional Entity.
 * @param facilityInput 
 * @returns A Facility with a list containing the ID of the initial HealthcareProfessional that was added.
 */
export async function addFacility(facilityInput: gqlTypes.FacilityInput): Promise<Result<dbSchema.Facility>> {
    const validationResult = validateAddFacilityInput(facilityInput)

    if (validationResult.hasErrors) {
        return validationResult
    }

    const addFacilityResult: Result<dbSchema.Facility> = {
        hasErrors: false,
        errors: []
    }

    const facilityRef = dbInstance.collection('facilities').doc()
    const healthcareProfessionalRef = dbInstance.collection('healthcareProfessionals').doc()

    if (facilityInput.healthcareProfessionals && facilityInput.healthcareProfessionals.length) {
        for await (const profEntity of facilityInput.healthcareProfessionals) {
            const healthcareProfAddResults = await addHealthcareProfessional(
                profEntity, healthcareProfessionalRef
            )

            if (healthcareProfAddResults.hasErrors && healthcareProfAddResults.errors?.length) {
                addFacilityResult.hasErrors = true
                addFacilityResult.errors?.concat(healthcareProfAddResults.errors)
            } else {
                facilityInput.healthcareProfessionalIds?.push(healthcareProfAddResults.data as string)
            }
        }
    }

    const newFacility = convertToDbFacility(facilityInput, facilityRef.id)

    await facilityRef.set(newFacility)

    addFacilityResult.data = newFacility

    return addFacilityResult
}

/**
 * Updates a Facility in the database with the params.
 * @param facilityId The ID of the facility in the database.
 * @param fieldsToUpdate The values that should be updated. They will be created if they don't exist.
 * @returns The updated Facility.
 */
export const updateFacility = async (facilityId: string, fieldsToUpdate: Partial<dbSchema.Facility>):
    Promise<Result<dbSchema.Facility | null>> => {
    try {
        const facilityRef = dbInstance.collection('facilities').doc(facilityId)

        const snapshot = await facilityRef.get()

        const facilityToUpdate = mapDbEntityTogqlEntity(snapshot.data() as DocumentData)

        const updatedFacilityValues: dbSchema.Facility = {
            ...facilityToUpdate,
            ...fieldsToUpdate,
            updatedDate: new Date().toISOString()
        }

        await facilityRef.set(updatedFacilityValues, { merge: true })

        const updatedFacility = await getFacilityById(facilityRef.id)

        return updatedFacility
    } catch (error) {
        throw new Error(`Error updating facility: ${error}`)
    }
}

/**
 * Converts the values for FacilityInput variables to the format they will be stored as in the database.
 * @param facility - The `FacilityInput` variables that were passed in the API request.
 * @param id - The ID of the Facility in the Firestore collection.
 * @returns 
 */
function convertToDbFacility(facility: gqlTypes.FacilityInput, id: string): dbSchema.Facility {
    return {
        ...facility,
        id: id,
        nameEn: facility.nameEn,
        nameJa: facility.nameJa,
        contact: facility.contact,
        healthcareProfessionalIds: facility.healthcareProfessionalIds,
        healthcareProfessionals: [],
        isDeleted: false,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()

    } as gqlTypes.Facility
}

const mapDbEntityTogqlEntity = (dbEntity: DocumentData): gqlTypes.Facility => {
    const gqlEntity = {
        id: dbEntity.id,
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        healthcareProfessionalIds: dbEntity.healthcareProfessionalIds,
        createdDate: dbEntity.createdDate,
        updatedDate: dbEntity.updatedDate,
        isDeleted: dbEntity.isDeleted
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

function validateAddFacilityInput(input: gqlTypes.FacilityInput): Result<dbSchema.Facility> {
    const validationResults: Result<dbSchema.Facility> = {
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

function validateContactInput(contactInput: gqlTypes.ContactInput): Result<boolean> {
    const validationResults: Result<boolean> = {
        hasErrors: false,
        errors: []
    }

    if (!contactInput) {
        return validationResults
    }

    if (contactInput.email && (!isValidEmail(contactInput.email) || contactInput.email.length > 128)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'email',
            errorCode: ErrorCode.INVALID_EMAIL,
            httpStatus: 400
        })
    }

    if (contactInput.phone && !isValidPhoneNumber(contactInput.phone)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'phone',
            errorCode: ErrorCode.INVALID_PHONE_NUMBER,
            httpStatus: 400
        })
    }

    if (contactInput.website && !isValidWebsite(contactInput.website)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'website',
            errorCode: ErrorCode.INVALID_WEBSITE,
            httpStatus: 400
        })
    }

    if (contactInput.address) {
        const addressValidationResults = validateAddressInput(contactInput.address)

        if (addressValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...addressValidationResults.errors as [])
        }
    }

    return validationResults
}

function validateAddressInput(input: gqlTypes.PhysicalAddressInput): Result<string> {
    const validationResults: Result<string> = {
        hasErrors: false,
        errors: []
    }

    if (input.addressLine1En && input.addressLine1En.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine1En',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.addressLine2En && input.addressLine2En.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine2En',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.addressLine1Ja && input.addressLine1Ja.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine1Ja',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.addressLine2Ja && input.addressLine2Ja.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'addressLine2Ja',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.cityEn && input.cityEn.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'cityEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.cityJa && input.cityJa.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'cityJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.postalCode && input.postalCode.length > 18) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'postalCode',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.prefectureEn && input.prefectureEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'prefectureEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (input.prefectureJa && input.prefectureJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'prefectureJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    return validationResults
}
