import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes.js'
import * as dbSchema from '../typeDefs/dbSchema.js'
import { dbInstance } from '../firebaseDb.js'
import { ErrorCode, Result } from '../result.js'
import { hasSpecialCharacters } from '../../utils/stringUtils.js'
import { createFacility } from './facilityService.js'
import { createHealthcareProfessional } from './healthcareProfessionalService.js'

/**
 * Gets the Submission from the database that matches the id.
 * @param id A string that matches the id of the Firestore Document for the Submission.
 * @returns A Submission object.
 */
export const getSubmissionById = async (id: string): Promise<Result<gqlTypes.Submission | undefined>> => {
    try {
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            return validationResult as Result<gqlTypes.Submission>
        }

        const submissionRef = dbInstance.collection('submissions')
        
        const snapshot = await submissionRef.doc(id).get()

        if (!snapshot.exists) {
            return {
                data: undefined,
                hasErrors: true,
                errors: [{
                    field: 'id',
                    errorCode: ErrorCode.NOT_FOUND,
                    httpStatus: 404
                }]
            }
        }
        
        const dbEntity = snapshot.data() as dbSchema.Submission
        const convertedEntity = mapDbEntityTogqlEntity(dbEntity)

        const searchResults = {
            data: convertedEntity,
            hasErrors: false
        }

        return searchResults
    } catch (error) {
        console.log(`Error retrieving submission by id ${id}: ${error}`)

        return {
            data: undefined,
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
    : Promise<Result<gqlTypes.Submission[]>> {
    try {
        //TODO: convert this to a validation method instead of a mapping method
        // const searchFilters = submissionService.mapGqlSearchFiltersToDbSearchFilters(args.filters)

        let subRef: Query<DocumentData> = dbInstance.collection('submissions')

        if (filters.googleMapsUrl) {
            subRef = subRef.where('googleMapsUrl', '==', filters.googleMapsUrl)
        }

        if (filters.healthcareProfessionalName) {
            subRef = subRef.where('healthcareProfessionalName', '==', filters.healthcareProfessionalName)
        }

        if(filters.spokenLanguages && filters.spokenLanguages.length > 0) {
            subRef = subRef.where('spokenLanguages', 'array-contains-any', filters.spokenLanguages)
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
                    subRef = subRef.orderBy(order.fieldToOrder, order.orderDirection)
                }
            })
        } else {
            //default
            subRef = subRef.orderBy('createdDate', 'desc')
        }

        //default is 20
        subRef = subRef.limit(filters.limit ?? 20)

        const snapshot = await subRef.get()

        const submissions = snapshot.docs.map(doc => mapDbEntityTogqlEntity({
            ...doc.data() as dbSchema.Submission,
            id: doc.id
        } satisfies dbSchema.Submission))

        console.log(`DB-SEARCH: ${JSON.stringify(submissions)} submissions were found. the original query ${JSON.stringify(filters)}`)

        return {
            hasErrors: false,
            data: submissions
        }
    } catch (error) {
        console.log(`Error searching submissions by filters ${filters}: ${error}`)

        return {
            data: [],
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
        
        const validationResults = validateSubmissionInputFields(submissionInput)
        
        if (validationResults.hasErrors) {
            return validationResults as Result<gqlTypes.Submission>
        }
        
        const spokenLanguagesResult = validateSpokenLanguages(submissionInput.spokenLanguages)
        
        if (spokenLanguagesResult.hasErrors) {
            return {
                data: {} as gqlTypes.Submission,
                hasErrors: true,
                errors: spokenLanguagesResult.errors
            }
        }
        
        const submissionRef = dbInstance.collection('submissions').doc()
        const newSubmissionId = submissionRef.id
        const newSubmission = convertToDbSubmission(submissionInput, newSubmissionId)

        await submissionRef.set(newSubmission)


        const createdSubmission = await getSubmissionById(newSubmissionId)

        if (createdSubmission.hasErrors || !createdSubmission.data) {
            throw new Error(`Error creating submission: ${JSON.stringify(createdSubmission.errors)}`)
        }

        return {
            data: createdSubmission.data,
            hasErrors: false
        }
    } catch (error) {
        console.log(`Error creating submission: ${error}`)

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
export const updateSubmission = async (submissionId: string, fieldsToUpdate: Partial<gqlTypes.UpdateSubmissionInput>):
    Promise<Result<gqlTypes.Submission>> => {
    try {
        //business logic: a submission can't be updated or unapproved once it's approved.
        //business logic: you can't approve and update at the same time. 
        if (fieldsToUpdate.isApproved) {
            const approvalResult = await approveSubmission(submissionId)

            return approvalResult
        }

        const submissionRef = dbInstance.collection('submissions').doc(submissionId)
        const snapshot = await submissionRef.get()
        const submissionToUpdate = snapshot.data() as dbSchema.Submission

        const updatedSubmissionValues: Partial<dbSchema.Submission> = {
            //TODO: guarantee the fields in updatesubmissioninput match submission so this doesn't break. maybe a test?
            ...fieldsToUpdate as Partial<dbSchema.Submission>,
            //business logic: don't allow updating approval status after the previous check
            isApproved: submissionToUpdate.isApproved,
            updatedDate: new Date().toISOString()
        }

        await submissionRef.set(updatedSubmissionValues, { merge: true })

        console.log(`DB-UPDATE: Submission ${submissionId} was updated. \n Fields updated: ${JSON.stringify(fieldsToUpdate)}`)

        const updatedSubmission = await getSubmissionById(submissionId)

        if (updatedSubmission.hasErrors || !updatedSubmission.data) {
            throw new Error(`Error creating submission: ${JSON.stringify(updatedSubmission.errors)}`)
        }

        return {
            data: updatedSubmission.data,
            hasErrors: false
        }
    } catch (error) {
        console.log(`Error updating submission ${submissionId}: ${error}`)

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

/**
 * Approves a submission. Once approved, it creates a new facility and/or healthcare professional(s).
 * Once it's approved, it can't be unapproved.
 * @param submissionId the submission to approve
 * @returns The submission that was approved.
 */
export const approveSubmission = async (submissionId: string): Promise<Result<gqlTypes.Submission>> => {
    const approveResult: Result<gqlTypes.Submission> = {
        data: {} as gqlTypes.Submission,
        hasErrors: false,
        errors: []
    }

    try {
        const submissionRef = dbInstance.collection('submissions').doc(submissionId)
        const snapshot = await submissionRef.get()
        const currentSubmission = snapshot.data() as dbSchema.Submission

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

        //update the submission to approved
        currentSubmission.isApproved = true
        currentSubmission.updatedDate = new Date().toISOString()

        await submissionRef.set(currentSubmission, { merge: true })

        console.log(`DB-UPDATE: Submission ${submissionId} was approved.`)

        //try creating healthcare professional(s)
        for await (const healthcareProfessional of currentSubmission.healthcareProfessionals ?? []) {
            const healthcareProfessionalInput
                = healthcareProfessional satisfies gqlTypes.CreateHealthcareProfessionalInput
            const createHealthcareProfessionalResult = await createHealthcareProfessional(healthcareProfessionalInput)

            if (createHealthcareProfessionalResult.hasErrors) {
                approveResult.errors?.concat(createHealthcareProfessionalResult.errors!)
                return approveResult
            }
        }

        //try creating the facility
        const createFacilityResult = await createFacility(currentSubmission.facility as dbSchema.Facility)

        if (createFacilityResult.hasErrors) {
            approveResult.errors?.concat(createFacilityResult.errors!)
            return approveResult
        }

        return approveResult
    } catch (error) {
        console.log(`Error approving submission ${submissionId}: ${error}`)

        approveResult.errors?.push({
            field: 'isApproved',
            errorCode: ErrorCode.SERVER_ERROR,
            httpStatus: 500
        })

        return approveResult
    }
}

function convertToDbSubmission(input: gqlTypes.CreateSubmissionInput, newId: string): dbSchema.Submission {
    return {
        id: newId,
        googleMapsUrl: input.googleMapsUrl as string,
        healthcareProfessionalName: input.healthcareProfessionalName as string,
        spokenLanguages: input.spokenLanguages as gqlTypes.Locale[],
        isUnderReview: false,
        isApproved: false,
        isRejected: false,
        facility: null,
        healthcareProfessionals: [],
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    }
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

const validateSubmissionInputFields = (input: gqlTypes.CreateSubmissionInput): Result<unknown> => {
    const validatedSubmissionResult: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (!input.googleMapsUrl?.trim()) {
        validatedSubmissionResult.hasErrors = true
        validatedSubmissionResult.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
    }

    if (input.googleMapsUrl && input.googleMapsUrl.length > 1028) {
        validatedSubmissionResult.hasErrors = true
        validatedSubmissionResult.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (!input.healthcareProfessionalName || !input.healthcareProfessionalName.trim()) {
        validatedSubmissionResult.hasErrors = true
        validatedSubmissionResult.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
    }

    if (input.healthcareProfessionalName && input.healthcareProfessionalName.length > 128) {
        validatedSubmissionResult.hasErrors = true
        validatedSubmissionResult.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    return validatedSubmissionResult
}

export const validateSpokenLanguages = (spokenLanguages: gqlTypes.Locale[] | undefined | null): Result<unknown> => {
    const validatedSpokenLanguagesResults: Result<unknown> = {
        data: [],
        hasErrors: false,
        errors: []
    }

    if (!spokenLanguages) {
        validatedSpokenLanguagesResults.hasErrors = true
        validatedSpokenLanguagesResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
        return validatedSpokenLanguagesResults
    }

    if (spokenLanguages.length < 1) {
        validatedSpokenLanguagesResults.hasErrors = true
        validatedSpokenLanguagesResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })

        return validatedSpokenLanguagesResults
    }

    return validatedSpokenLanguagesResults
}

const mapDbEntityTogqlEntity = (dbEntity: dbSchema.Submission): gqlTypes.Submission => {
    const gqlEntity = {
        id: dbEntity.id,
        googleMapsUrl: dbEntity.googleMapsUrl,
        healthcareProfessionalName: dbEntity.healthcareProfessionalName,
        spokenLanguages: dbEntity.spokenLanguages,
        facility: dbEntity.facility,
        healthcareProfessionals: dbEntity.healthcareProfessionals,
        isUnderReview: dbEntity.isUnderReview,
        isApproved: dbEntity.isApproved,
        isRejected: dbEntity.isRejected,
        createdDate: dbEntity.createdDate,
        updatedDate: dbEntity.updatedDate
    } satisfies gqlTypes.Submission

    return gqlEntity
}

