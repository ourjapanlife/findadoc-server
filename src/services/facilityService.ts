import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import * as dbSchema from '../typeDefs/dbSchema'
import { ErrorCode, Result } from '../result'
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
        const dbFacilities = snapshot.docs
        const gqlFacilities = dbFacilities.map(mapDbEntityTogqlEntity)

        const searchResults = {
            data: gqlFacilities,
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
 * Creates a new Facility. 
 * Any healthcareprofessionalIds will build an association, but it won't create a healthcare professional. 
 * You need to call the `createHealthcareProfessional` function separately. This prevents hidden side effects.
 * @param facilityInput 
 * @returns A Facility with a list containing the ID of the initial HealthcareProfessional that was created.
 */
export async function createFacility(facilityInput: gqlTypes.CreateFacilityInput): Promise<Result<string>> {
    const validationResult = validateCreateFacilityInput(facilityInput)

    if (validationResult.hasErrors) {
        return validationResult
    }

    const createFacilityResult: Result<string> = {
        hasErrors: false,
        errors: []
    }

    const facilityRef = dbInstance.collection('facilities').doc()
    const newFacilityId = facilityRef.id
    const newDbFacility = convertToDbFacility(facilityInput, newFacilityId)

    await facilityRef.set(newDbFacility)

    console.log(`DB-CREATE: CREATE facility ${newFacilityId}. Entity: ${JSON.stringify(newDbFacility)}`)

    createFacilityResult.data = newFacilityId

    return createFacilityResult
}

/**
 * Updates a Facility in the database with the params in the database based on the id. 
 * - It will only update the fields that are provided and are not null.
 * - If you want to create a new HealthcareProfessional, you need to call the `createHealthcareProfessional` function separately. This prevents hidden side effects.
 * - If you want to link an existing HealthcareProfessional to a Facility, add the healthcareprofessionalId to the `healthcareProfessionalIds` array. 
     Use the action to add or remove the association. If an id isn't in the list, no change will occur. 
 * @param facilityId The ID of the facility in the database.
 * @param fieldsToUpdate The values that should be updated. They will be created if they don't exist.
 * @returns The updated Facility.
 */
export const updateFacility = async (facilityId: string, fieldsToUpdate: Partial<gqlTypes.UpdateFacilityInput>):
    Promise<Result<void>> => {
    try {
        const validationResult = validateUpdateFacilityInput(fieldsToUpdate)

        if (validationResult.hasErrors) {
            return validationResult as Result<void>
        }

        const updateFacilityResult: Result<void> = {
            hasErrors: false,
            errors: []
        }

        const facilityRef = dbInstance.collection('facilities').doc(facilityId)
        const snapshot = await facilityRef.get()
        const dbFacilityToUpdate = snapshot.data() as dbSchema.Facility
        const updatedDbFacility: dbSchema.Facility = {
            ...dbFacilityToUpdate,
            updatedDate: new Date().toISOString()
        }

        // Object.keys((fieldsToUpdate, currentKey) => {
        // const key = fieldsToUpdate[currentKey] as keyof gqlTypes.UpdateFacilityInput
        // (Object.keys(fieldsToUpdate) as (keyof typeof fieldsToUpdate)[]).forEach((currentKey, index) => {

        for (const currentKey in fieldsToUpdate) {
            if (currentKey && currentKey in updatedDbFacility) {
                updatedDbFacility[currentKey as keyof gqlTypes.UpdateFacilityInput] =
                    fieldsToUpdate[currentKey as keyof gqlTypes.UpdateFacilityInput]
            }

            if(currentKey === 'healthcareProfessionalIds' && fieldsToUpdate.healthcareProfessionalIds) {
                fieldsToUpdate.healthcareProfessionalIds.forEach((relationship, index) => {
                    if(relationship.action === gqlTypes.AssociationAction.Add) {
                        updatedDbFacility.healthcareProfessionalIds?.push(id)
                    } 
                    if(relationship?.action === gqlTypes.AssociationAction.Remove) {
                        updatedDbFacility.healthcareProfessionalIds?.splice(index, 1)
                    }
                }
            }
        }


        await facilityRef.set(updatedDbFacility, { merge: true })

        console.log(`DB-UPDATE: Updated facility ${facilityRef.id}. Entity: ${JSON.stringify(updatedDbFacility)}`)

        return updateFacilityResult
    } catch (error) {
        throw new Error(`Error updating facility: ${error}`)
    }
}

/**
 * Converts the values for FacilityInput variables to the format they will be stored as in the database.
 * @param input - The `FacilityInput` variables that were passed in the API request.
 * @param newId - The ID of the Facility in the Firestore collection.
 * @returns 
 */
function convertToDbFacility(input: gqlTypes.CreateFacilityInput, newId: string): dbSchema.Facility {
    return {
        ...input,
        id: newId,
        nameEn: input.nameEn,
        nameJa: input.nameJa,
        contact: input.contact,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()

    } as dbSchema.Facility
}

const mapDbEntityTogqlEntity = (dbEntity: DocumentData): gqlTypes.Facility => {
    const gqlEntity = {
        id: dbEntity.id,
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        healthcareProfessionalIds: dbEntity.healthcareProfessionalIds,
        createdDate: dbEntity.createdDate,
        updatedDate: dbEntity.updatedDate
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

    if (searchInput.limit && searchInput.limit < 0) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }

    return validationResults
}

function validateUpdateFacilityInput(input: Partial<gqlTypes.UpdateFacilityInput>): Result<string> {
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

function validateCreateFacilityInput(input: gqlTypes.CreateFacilityInput): Result<string> {
    const validationResults: Result<string> = {
        hasErrors: false,
        errors: []
    }

    if(!input.nameEn) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    }

    if (input.nameEn && input.nameEn.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if(!input.nameJa) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.REQUIRED,
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

function validateAddressInput(input: gqlTypes.PhysicalAddress): Result<string> {
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
