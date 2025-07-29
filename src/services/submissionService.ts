import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { dbInstance } from '../firebaseDb.js'
import { ErrorCode, Result } from '../result.js'
import { hasSpecialCharacters } from '../../utils/stringUtils.js'
import { createFacility } from './facilityService.js'
import { createHealthcareProfessional } from './healthcareProfessionalService.js'
import { validateSubmissionSearchFilters, validateCreateSubmissionInputs } from '../validation/validateSubmissions.js'
import { logger } from '../../src/logger.js'
import { createAuditLog } from './auditLogService.js'
import { getFacilityDetailsForSubmission } from '../../utils/submissionDataFromGoogleMaps.js'
import { chunkArray } from '../../utils/arrayUtils.js'

/**
 * Gets the Submission from the database that matches the id.
 * @param id A string that matches the id of the Firestore Document for the Submission.
 * @returns A Submission object.
 */
export const getSubmissionById = async (id: string): Promise<Result<gqlTypes.Submission>> => {
    try {
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Submission>
        }

        const submissionRef = dbInstance.collection('submissions')
        
        const dbDocument = await submissionRef.doc(id).get()

        if (!dbDocument.exists) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: [{
                    field: 'id',
                    errorCode: ErrorCode.NOT_FOUND,
                    httpStatus: 404
                }]
            }
        }
        
        const dbEntity = dbDocument.data() as dbSchema.Submission
        const convertedEntity = mapDbEntityTogqlEntity(dbEntity)

        const searchResults = {
            data: convertedEntity,
            hasErrors: false
        }

        return searchResults
    } catch (error) {
        logger.error(`ERROR: Error retrieving submission by id ${id}: ${error}`)

        return {
            data: {} as gqlTypes.Submission,
            hasErrors: true,
            errors: [{
                field: 'getSubmissionById',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Get all the submissions in the database when no filters are provided.
 * When there are filters provided it will return all the submissions according to the filters.
 * @param filters An object that contains parameters to filter on. 
 * When no parameters are provided, filters is an empty object.
 * @returns A submissions object
 */
export async function searchSubmissions(filters: gqlTypes.SubmissionSearchFilters)
    : Promise<Result<gqlTypes.SubmissionConnection>> {
    try {
        const validationResults = validateSubmissionSearchFilters(filters)

        if (validationResults.hasErrors) {
            return {
                ...validationResults,
                data: {
                    nodes: [],
                    totalCount: 0
                }
            }
        }
        
        let allGqlSubmissions: gqlTypes.Submission[] = []
        let totalCount = 0

        if (filters.spokenLanguages && filters.spokenLanguages.length > 0) {
            const chunks = chunkArray(filters.spokenLanguages, 30)

            const snapshots = await Promise.all(chunks.map(chunk =>
                dbInstance.collection('submissions')
                    .where('spokenLanguages', 'array-contains-any', chunk)
                    .get()))

            const uniqueSubmissionsMap = new Map<string, gqlTypes.Submission>()

            snapshots.forEach(snap =>
                snap.forEach(doc => {
                    uniqueSubmissionsMap.set(doc.id, mapDbEntityTogqlEntity(doc.data() as dbSchema.Submission))
                }))
            allGqlSubmissions = Array.from(uniqueSubmissionsMap.values())

            if (filters.googleMapsUrl) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.googleMapsUrl === filters.googleMapsUrl)
            }
            if (filters.healthcareProfessionalName) {
                allGqlSubmissions = allGqlSubmissions.filter(s => 
                    s.healthcareProfessionalName === filters.healthcareProfessionalName)
            }
            if (filters.isUnderReview !== undefined) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.isUnderReview === filters.isUnderReview)
            }
            if (filters.isApproved !== undefined) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.isApproved === filters.isApproved)
            }
            if (filters.isRejected !== undefined) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.isRejected === filters.isRejected)
            }
            if (filters.createdDate) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.createdDate === filters.createdDate)
            }
            if (filters.updatedDate) {
                allGqlSubmissions = allGqlSubmissions.filter(s => s.updatedDate === filters.updatedDate)
            }

            type ComparablePrimitive = string | number | boolean

            // Order the results in memoryy
            if (filters.orderBy && Array.isArray(filters.orderBy)) {
                // Helper function to compare two defined values.
                const comparePrimitiveValues = 
                (valA: ComparablePrimitive, valB: ComparablePrimitive): number => {
                    if (valA < valB) {
                        return -1
                    } else if (valA > valB) {
                        return 1
                    }
                    return 0 
                }

                allGqlSubmissions.sort((submissionsA, submissionsB) => {
                    // Iterate through each order criterion provided by the user
                    for (const orderCriterion of filters.orderBy!) {
                        if (!orderCriterion) {
                            // Skip if a specific order criterion object is null/undefined in the array
                            continue
                        }

                        const fieldName = orderCriterion.fieldToOrder as keyof gqlTypes.Submission
                        const valueA = submissionsA[fieldName]
                        const valueB = submissionsB[fieldName]

                        let currentComparison = 0

                        if (valueA === undefined || valueA === null) {
                            if (valueB === undefined || valueB === null) {
                                currentComparison = 0 // Both are undefined/null, consider them equal
                            } else {
                                currentComparison = -1 // valueA is undefined/null, valueB is not, so valueA comes first
                            }
                        } else if (valueB === undefined || valueB === null) {
                            currentComparison = 1 // valueA is defined, valueB is undefined/null, so valueA comes after valueB
                        } else {
                            const isValueAComparable = typeof valueA === 'string' || typeof valueA === 'number' || typeof valueA === 'boolean'
                            const isValueBComparable = typeof valueB === 'string' || typeof valueB === 'number' || typeof valueB === 'boolean'

                            if (isValueAComparable && isValueBComparable) {
                                // If each value are compatible do it
                                currentComparison = comparePrimitiveValues(
                                    valueA as ComparablePrimitive, // Assertions are needed here.
                                    valueB as ComparablePrimitive
                                )
                            } else {
                                //if one of two values are not ad ComparablePrimitive run error
                                throw new Error(`Sorting by field '${String(fieldName)}' is not supported. It contains a non-comparable type (e.g., object or array).`)
                            }
                        }

                        // Adjust comparison if the order direction is Descending
                        if (orderCriterion.orderDirection === gqlTypes.OrderDirection.Desc) {
                            currentComparison *= -1 // Invert the comparison result
                        }

                        // If the current field produces a non-zero comparison, that means these two facilities
                        // are different based on this field, so we use this comparison and stop.
                        if (currentComparison !== 0) {
                            return currentComparison
                        }
                        // If currentComparison is 0, it means the values for this field are equal,
                    }
                    // If all order criteria fields are equal (or no criteria provided/valid),
                    // maintain their original relative order (return 0).
                    return 0
                })
            } else {
                allGqlSubmissions.sort((submissionA, submissionB) => {
                    const createdDateA = new Date(submissionA.createdDate)

                    const createdDateB = new Date(submissionB.createdDate)

                    return createdDateB.getTime() - createdDateA.getTime()
                })
            }

            totalCount = allGqlSubmissions.length

            const startIndex = filters.offset || 0
            const endIndex = startIndex + (filters.limit || 20)

            allGqlSubmissions = allGqlSubmissions.slice(startIndex, endIndex)
        } else {
            let subRef: Query<DocumentData> = dbInstance.collection('submissions')

            if (filters.googleMapsUrl) {
                subRef = subRef.where('googleMapsUrl', '==', filters.googleMapsUrl)
            }
            if (filters.healthcareProfessionalName) {
                subRef = subRef.where('healthcareProfessionalName', '==', filters.healthcareProfessionalName)
            }
            if (filters.isUnderReview !== undefined) {
                subRef = subRef.where('isUnderReview', '==', filters.isUnderReview)
            }
            if (filters.isApproved !== undefined) {
                subRef = subRef.where('isApproved', '==', filters.isApproved)
            }
            if (filters.isRejected !== undefined) {
                subRef = subRef.where('isRejected', '==', filters.isRejected)
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

            // This approach assumes `count().get()` is NOT working due probably an old version of Firestore.
            const allMatchingDocsSnapshot = await subRef.get()

            totalCount = allMatchingDocsSnapshot.docs.length

            // Calculate start and end indices for in-memory pagination
            const startIndex = filters.offset || 0
            const limit = filters.limit || 20
            const endIndex = startIndex + limit

            const paginatedSubmissions = allMatchingDocsSnapshot.docs.slice(startIndex, endIndex)

            allGqlSubmissions = paginatedSubmissions.map(dbSubmission =>
                mapDbEntityTogqlEntity(dbSubmission.data() as dbSchema.Submission))
        }

        return {
            data: {
                nodes: allGqlSubmissions,
                totalCount: totalCount
            },
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error searching submissions by filters ${filters}: ${error}`)

        return {
            data: {
                nodes: [],
                totalCount: 0
            },
            hasErrors: true,
            errors: [{
                field: 'searchSubmissions',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Creates a submission.
 * @param submissionInput the submission to create
 * @returns The submission that was created.
 */
export const createSubmission = async (submissionInput: gqlTypes.CreateSubmissionInput):
Promise<Result<gqlTypes.Submission>> => {
    try {
        const validationResults = validateCreateSubmissionInputs(submissionInput)
        
        if (validationResults.hasErrors) {
            return { 
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: validationResults.errors
            }
        }

        // TO DO: After it's validated we should send already an okay request to the user

        const submissionRef = dbInstance.collection('submissions').doc()
        const newSubmissionId = submissionRef.id
        const newSubmission = mapGqlEntityToDbEntity(submissionInput, newSubmissionId)

        // We want to wrap everyting in a transaction, so when one of the transactions fails we can roll-back
        await dbInstance.runTransaction(async t => {
            await t.set(submissionRef, newSubmission)
            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Create, 
                gqlTypes.ObjectType.Submission, 
                '', 
                JSON.stringify(newSubmission),
                null,
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Failed to create and audit log on ${gqlTypes.ActionType.Create}`) 
            }
        })

        const createdSubmission = await getSubmissionById(newSubmissionId)

        // if we didn't get it back or have errors, this is an actual error.
        if (createdSubmission.hasErrors || !createdSubmission.data) {
            throw new Error(`${JSON.stringify(createdSubmission.errors)}`)
        }

        return {
            data: createdSubmission.data,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error creating submission: ${error}`)

        return {
            data: {} as gqlTypes.Submission,
            hasErrors: true,
            errors: [{
                field: `${error}`,
                errorCode: ErrorCode.SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

/**
 * Updates a submission. 
 * Business logic: Use this method if you want to approve a submission. 
 *     If the isApproved field is true, then it will trigger the approve submission workflow.
 * @param submissionId the submission to update
 * @param fieldsToUpdate the fields to update
 * @returns The submission that was updated.
 */
export const updateSubmission = async (submissionId: string, fieldsToUpdate: Partial<gqlTypes.UpdateSubmissionInput>,
    updatedBy: string):
Promise<Result<gqlTypes.Submission>> => {
    try {
        //business logic: a submission can't be updated or unapproved once it's approved.
        //business logic: you can't approve and update at the same time. 
        if (fieldsToUpdate.isApproved) {
            const approvalResult = await approveSubmission(submissionId, updatedBy)

            return approvalResult
        }
        
        const submissionRef = dbInstance.collection('submissions').doc(submissionId)
        const dbDocument = await submissionRef.get()
        const submissionToUpdate = dbDocument.data() as dbSchema.Submission

        if (fieldsToUpdate.autofillPlaceFromSubmissionUrl && submissionToUpdate.autofillPlaceFromSubmissionUrl) {
            throw new Error('This submission has already been autofilled once before')
        }

        if (fieldsToUpdate.autofillPlaceFromSubmissionUrl && !submissionToUpdate.autofillPlaceFromSubmissionUrl) {
            const updatedResultFromAutofill =
            await autoFillPlacesInformation(submissionId, fieldsToUpdate.googleMapsUrl)

            return updatedResultFromAutofill
        }

        const updatedSubmissionValues: Partial<dbSchema.Submission> = {
            //TODO: guarantee the fields in updatesubmissioninput match submission so this doesn't break. maybe a test?
            ...fieldsToUpdate as Partial<dbSchema.Submission>,
            //business logic: don't allow updating approval status after the previous check
            isApproved: submissionToUpdate.isApproved,
            updatedDate: new Date().toISOString()
        }

        await dbInstance.runTransaction(async t => {
            // We want to preform first a read of the individual document so we are sure we are updating most up-to-date data
            const doc = await t.get(submissionRef)
            const oldSubmission = doc.data() as dbSchema.Submission
            
            t.update(submissionRef, updatedSubmissionValues)
            
            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Update, 
                gqlTypes.ObjectType.Submission, 
                updatedBy,
                JSON.stringify(updatedSubmissionValues),
                JSON.stringify(oldSubmission),
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Faild to create and audit log on ${gqlTypes.ActionType.Update}`) 
            }
        })

        logger.info(`\nDB-UPDATE: Submission ${submissionId} was updated.\nFields updated: ${JSON.stringify(fieldsToUpdate)}`)
        const updatedSubmission = await getSubmissionById(submissionId)

        if (updatedSubmission.hasErrors || !updatedSubmission.data) {
            throw new Error(`ERROR: Error creating submission: ${JSON.stringify(updatedSubmission.errors)}`)
        }

        return {
            data: updatedSubmission.data,
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error updating submission ${submissionId}: ${error}`)

        return {
            data: {} as gqlTypes.Submission,
            hasErrors: true,
            errors: [{
                field: 'updateSubmission',
                errorCode: ErrorCode.SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

export const autoFillPlacesInformation = async (submissionId: string, googleMapsUrl: gqlTypes.InputMaybe<string> | undefined, updatedBy: string = ''): 
Promise<Result<gqlTypes.Submission>> => {
    const updatedResultFromAutofill: Result<gqlTypes.Submission> = {
        data: {} as gqlTypes.Submission,
        hasErrors: false,
        errors: []
    }

    try {
        const submissionRef = dbInstance.collection('submissions').doc(submissionId)
        const dbDocument = await submissionRef.get()
        const currentSubmission = dbDocument.data() as dbSchema.Submission

        if (!currentSubmission) {
            updatedResultFromAutofill.errors?.push({
                field: 'submissionId',
                errorCode: ErrorCode.NOT_FOUND,
                httpStatus: 400
            })

            return updatedResultFromAutofill
        }

        const googlePlacesSearchResult
        = await getFacilityDetailsForSubmission(googleMapsUrl as string)

        if (!googlePlacesSearchResult) {
            updatedResultFromAutofill.errors?.push({
                field: 'googleMapsUrl',
                errorCode: ErrorCode.AUTOFILL_FAILURE,
                httpStatus: 400
            })

            return updatedResultFromAutofill
        }
       
        const facilityInformation = currentSubmission.facility as gqlTypes.FacilitySubmission
        const contact: gqlTypes.Contact = {  
            phone: '', 
            website: null,
            googleMapsUrl: '',
            address: {
                postalCode: '',
                prefectureEn: '',
                addressLine1En: '',
                addressLine2En: '',
                cityEn: '',
                prefectureJa: '',
                addressLine1Ja: '',
                addressLine2Ja: '',
                cityJa: ''
            }
        }

        if (facilityInformation) {
            facilityInformation.nameEn = googlePlacesSearchResult.extractedNameEn
            contact.phone = googlePlacesSearchResult.extractedPhoneNumber
            contact.website = googlePlacesSearchResult.extractedWebsite
            contact.googleMapsUrl = googlePlacesSearchResult.extractedGoogleMapsURI
            contact.address.postalCode
                = googlePlacesSearchResult.extractedPostalCodeFromInformation
            contact.address.prefectureEn
                = googlePlacesSearchResult.extractPrefectureEnFromInformation
            contact.address.addressLine1En
                = googlePlacesSearchResult.extractedAddressLine1En
            facilityInformation.mapLatitude = googlePlacesSearchResult.extractedMapLatitude
            facilityInformation.mapLongitude = googlePlacesSearchResult.extractedMapLongitude
        }

        //update the submission to under review with the new updated date and autofill information
        currentSubmission.facility = facilityInformation
        currentSubmission.isUnderReview = true
        currentSubmission.updatedDate = new Date().toISOString()

        await dbInstance.runTransaction(async t => {
            // We want to preform first a read of the individual document so we are sure we are updating most up-to-date data
            const doc = await t.get(submissionRef)
            const oldSubmission = doc.data() as dbSchema.Submission
            
            t.set(submissionRef, currentSubmission, { merge: true })
            
            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Update, 
                gqlTypes.ObjectType.Submission, 
                updatedBy,
                JSON.stringify(currentSubmission),
                JSON.stringify(oldSubmission),
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Failed to create and audit log on ${gqlTypes.ActionType.Update}`) 
            }
        })

        //set the data to return to the approveResult object
        updatedResultFromAutofill.data = currentSubmission

        //after successful autofilling, set submission field 'autofillPlaceFromSubmissionUrl'
        //to true so that it will not call autofill a second time for the same submission in the future
        currentSubmission.autofillPlaceFromSubmissionUrl = true

        return updatedResultFromAutofill
    } catch (error) {
        logger.error(`Error updating submission ${submissionId}: ${error}`)

        updatedResultFromAutofill.errors?.push({
            field: 'autofillPlaceFromSubmissionUrl',
            errorCode: ErrorCode.SERVER_ERROR,
            httpStatus: 500
        })

        return updatedResultFromAutofill
    }
}

/**
 * Approves a submission. Once approved, it creates a new facility and/or healthcare professional(s).
 * Once it's approved, it can't be unapproved.
 * @param submissionId the submission to approve
 * @returns The submission that was approved.
 */
export const approveSubmission = async (submissionId: string, updatedBy: string): 
Promise<Result<gqlTypes.Submission>> => {
    const approveResult: Result<gqlTypes.Submission> = {
        data: {} as gqlTypes.Submission,
        hasErrors: false,
        errors: []
    }

    try {
        const submissionRef = dbInstance.collection('submissions').doc(submissionId)
        const dbDocument = await submissionRef.get()
        const currentSubmission = dbDocument.data() as dbSchema.Submission

        if (!currentSubmission) {
            approveResult.errors?.push({
                field: 'submissionId',
                errorCode: ErrorCode.NOT_FOUND,
                httpStatus: 400
            })

            return approveResult
        }

        //business logic: we can't approve a submission that's already approved. let's confirm it was previously not approved. 
        if (currentSubmission?.isApproved) {
            approveResult.errors?.push({
                field: 'isApproved',
                errorCode: ErrorCode.SUBMISSION_ALREADY_APPROVED,
                httpStatus: 400
            })

            return approveResult
        }
    
        logger.info(`\nDB-UPDATE: Submission ${submissionId} was approved.`)
        
        let createFacilityResult: Result<gqlTypes.Facility> | undefined

        // Check if facility exists by looking at healthcare professional's facility IDs
        const facilityExists = !!currentSubmission.healthcareProfessionals?.some(hp => hp.facilityIds?.length)

        // Check if healthcare professional exists by looking at facility's healthcare professional IDs
        const healthcareProfessionalExists = !!currentSubmission.facility?.healthcareProfessionalIds?.length

        // Create facility if it doesn't exist
        if (currentSubmission.facility && !facilityExists) {
            createFacilityResult = await createFacility(
                currentSubmission.facility as gqlTypes.CreateFacilityInput, updatedBy
            )
    
            if (createFacilityResult && createFacilityResult.hasErrors) {
                approveResult.errors?.push(...createFacilityResult.errors!)
                return approveResult
            }
        }

        // Create healthcare professional if it doesn't exist
        if (currentSubmission.healthcareProfessionals && !healthcareProfessionalExists) {
            for await (const healthcareProfessional of currentSubmission.healthcareProfessionals ?? []) {
                const healthcareProfessionalInput
                    = healthcareProfessional satisfies gqlTypes.CreateHealthcareProfessionalInput
        
                // If we just created a facility, link it
                if (createFacilityResult) {
                    healthcareProfessionalInput.facilityIds = [createFacilityResult.data.id]
                }
        
                const createHealthcareProfessionalResult = await createHealthcareProfessional(
                    healthcareProfessionalInput, updatedBy
                )
        
                if (createHealthcareProfessionalResult.hasErrors) {
                    approveResult.errors?.push(...createHealthcareProfessionalResult.errors!)
                    return approveResult
                }
            }
        }

        //update the submission to approved only if creating the facility and healthcare professionals succeeds
        currentSubmission.isApproved = true
        currentSubmission.isUnderReview = false
        currentSubmission.updatedDate = new Date().toISOString()

        await dbInstance.runTransaction(async t => {
            // We want to preform first a read of the individual document so we are sure we are updating most up-to-date data
            const doc = await t.get(submissionRef)
            const oldSubmission = doc.data() as dbSchema.Submission
            
            t.set(submissionRef, currentSubmission, { merge: true })
            
            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Update, 
                gqlTypes.ObjectType.Submission, 
                updatedBy,
                JSON.stringify(currentSubmission),
                JSON.stringify(oldSubmission),
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Failed to create and audit log on ${gqlTypes.ActionType.Update}`) 
            }
        })

        //set the data to return to the approveResult object
        approveResult.data = currentSubmission

        return approveResult
    } catch (error) {
        logger.error(`Error approving submission ${submissionId}: ${error}`)

        approveResult.errors?.push({
            field: 'isApproved',
            errorCode: ErrorCode.SERVER_ERROR,
            httpStatus: 500
        })

        return approveResult
    }
}

/**
 * This deletes a submission from the database. If the submission doesn't exist, it will return a validation error.
 * @param id The ID of the submission in the database to delete.
 */
export async function deleteSubmission(id: string, updatedBy: string)
    : Promise<Result<gqlTypes.DeleteResult>> {
    try {
        const submissionRef = dbInstance.collection('submissions').doc(id)
        const dbDocument = await submissionRef.get()

        if (!dbDocument.exists) {
            logger.warn(`Validation Error: User tried deleting non-existant submission: ${id}`)

            return {
                data: {
                    isSuccessful: false
                },
                hasErrors: true,
                errors: [{
                    field: 'deleteSubmission',
                    errorCode: ErrorCode.INVALID_ID,
                    httpStatus: 404
                }]
            }
        }

        const submissionToDelete = dbDocument.data() as dbSchema.Submission
        const convertedEntity = mapDbEntityTogqlEntity(submissionToDelete)

        await dbInstance.runTransaction(async t => {
            await t.delete(submissionRef)
            const createdAuditLog = await createAuditLog(
                gqlTypes.ActionType.Delete, 
                gqlTypes.ObjectType.Submission, 
                updatedBy,
                null,
                JSON.stringify(convertedEntity),
                t
            )

            if (!createdAuditLog.isSuccesful) {
                throw new Error(`Faild to create and audit log on ${gqlTypes.ActionType.Delete}`) 
            }
        })
        
        logger.info(`\nDB-DELETE: Submission ${id} was deleted.\nEntity: ${JSON.stringify(dbDocument)}`)

        return {
            data: {
                isSuccessful: true
            },
            hasErrors: false
        }
    } catch (error) {
        logger.error(`ERROR: Error deleting submission ${id}: ${error}`)

        return {
            data: {
                isSuccessful: false
            },
            hasErrors: true,
            errors: [{
                field: 'deleteSubmission',
                errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
                httpStatus: 500
            }]
        }
    }
}

export function mapGqlEntityToDbEntity(input: gqlTypes.CreateSubmissionInput, newId: string): dbSchema.Submission {
    return {
        id: newId,
        autofillPlaceFromSubmissionUrl: false,
        googleMapsUrl: input.googleMapsUrl as string,
        healthcareProfessionalName: input.healthcareProfessionalName as string,
        spokenLanguages: input.spokenLanguages as gqlTypes.Locale[],
        isUnderReview: false,
        isApproved: false,
        isRejected: false,
        facility: null,
        healthcareProfessionals: [],
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        notes: input.notes ?? ''
    } satisfies dbSchema.Submission
}

function validateIdInput(id: string): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
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

const mapDbEntityTogqlEntity = (dbEntity: dbSchema.Submission): gqlTypes.Submission => {
    const gqlEntity = {
        id: dbEntity.id,
        autofillPlaceFromSubmissionUrl: dbEntity.autofillPlaceFromSubmissionUrl,
        googleMapsUrl: dbEntity.googleMapsUrl,
        healthcareProfessionalName: dbEntity.healthcareProfessionalName,
        spokenLanguages: dbEntity.spokenLanguages,
        facility: dbEntity.facility,
        healthcareProfessionals: dbEntity.healthcareProfessionals,
        isUnderReview: dbEntity.isUnderReview,
        isApproved: dbEntity.isApproved,
        isRejected: dbEntity.isRejected,
        createdDate: dbEntity.createdDate,
        updatedDate: dbEntity.updatedDate,
        notes: dbEntity.notes
    } satisfies gqlTypes.Submission

    return gqlEntity
}
