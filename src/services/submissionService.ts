import { DocumentData, Query } from 'firebase-admin/firestore'
import * as gqlTypes from '../typeDefs/gqlTypes'
import * as dbSchema from '../typeDefs/dbSchema'
import { dbInstance } from '../firebaseDb'
import { CustomErrors, ErrorCode, Result } from '../result'
import { hasSpecialCharacters } from '../../utils/stringUtils'

/**
 * Gets the Submission from the database that matches the id.
 * @param id A string that matches the id of the Firestore Document for the Submission.
 * @returns A Submission object.
 */
export const getSubmissionById = async (id: string) : Promise<Result<gqlTypes.Submission| null>> => {
    try {
        const validationResult = validateIdInput(id)

        if (validationResult.hasErrors) {
            return validationResult
        }
    
        const submissionRef = dbInstance.collection('submissions')
        const snapshot = await submissionRef.where('id', '==', id).get()
        
        if (snapshot.docs.length < 1) {
            throw new Error('Submission was not found.')
        }

        const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

        const searchResults = {
            data: convertedEntity,
            hasErrors: false
        }

        return searchResults
    } catch (error) {
        return CustomErrors.notFound(`${error}`)
    }
}

function validateIdInput(id: string): Result<gqlTypes.Submission> {
    const validationResults: Result<gqlTypes.Submission> = {
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

/**
 * Get all the submissions in the database when no filters are provided.
 * When there are filters provided it will return all the submissions according to the filters.
 * @param filters An object that contains parameters to filter on. 
 * When no parameters are provided, filters is an empty object.
 * @returns A submissions object
 */
export async function searchSubmissions(filters: dbSchema.SubmissionSearchFilters = {}) {
    try {
        const {
            googleMapsUrl,
            healthcareProfessionalName,
            isUnderReview,
            isApproved,
            isRejected,
            orderBy = [{
                fieldToOrder: 'createdDate',
                orderDirection: 'desc'
            }],
            limit = 20,
            createdDate,
            updatedDate,
            spokenLanguages
        } = filters

        let subRef: Query<DocumentData> = dbInstance.collection('submissions')

        if (googleMapsUrl) {
            subRef = subRef.where('googleMapsUrl', '==', googleMapsUrl)
        }

        if (healthcareProfessionalName) {
            subRef = subRef.where('healthcareProfessionalName', '==', healthcareProfessionalName)
        }

        if (typeof isUnderReview !== 'undefined') {
            subRef = subRef.where('isUnderReview', '==', isUnderReview)
        }

        if (typeof isApproved !== 'undefined') {
            subRef = subRef.where('isApproved', '==', isApproved)
        }

        if (typeof isRejected !== 'undefined') {
            subRef = subRef.where('isRejected', '==', isRejected)
        }

        if (orderBy && Array.isArray(orderBy)) {
            orderBy.forEach(order => {
                if (order) {
                    subRef = subRef.orderBy(order.fieldToOrder, order.orderDirection)
                }
            })
        }

        if (limit) {
            subRef = subRef.limit(limit)
        }

        if (createdDate) {
            subRef = subRef.where('createdDate', '==', createdDate)
        }

        if (updatedDate) {
            subRef = subRef.where('updatedDate', '==', updatedDate)
        }

        const snapshot = await subRef.get()

        let submissions = snapshot.docs.map(doc => 
            mapDbEntityTogqlEntity({ ...doc.data(), id: doc.id}))

        if (spokenLanguages && spokenLanguages.length) {
            const requiredLanguages = spokenLanguages
                .map((lang: { iso639_3: string }) => lang.iso639_3)

            submissions = submissions.filter(sub => 
                requiredLanguages.every((reqLang: string) => 
                    sub.spokenLanguages.some(subLang => subLang.iso639_3 === reqLang)))
        }

        return submissions
    } catch (error) {
        throw new Error(`Error retrieving submissions: ${error}`)
    }
}

function convertToDbSubmission(submission: gqlTypes.Submission): 
    dbSchema.Submission {
    return {
        ...submission,
        id: submission.id,
        isUnderReview: false,
        isApproved: false,
        isRejected: false,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        spokenLanguages: submission.spokenLanguages
            .filter(lang => lang !== null) as dbSchema.SpokenLanguage[]
    }
}

export const addSubmission = async (submissionInput: gqlTypes.Submission): 
    Promise<Result<dbSchema.Submission>> => {
    const addSubmissionResult: Result<dbSchema.Submission> = {
        hasErrors: false,
        errors: []
    }

    const validationResults = validateSubmissionInputFields(submissionInput)

    if (validationResults.hasErrors) {
        return validationResults
    }

    const nonNullLanguages = submissionInput.spokenLanguages
        .filter(lang => !!lang) as gqlTypes.SpokenLanguageInput[]

    const spokenLanguagesResult = mapAndValidateSpokenLanguages(nonNullLanguages)

    if (spokenLanguagesResult.hasErrors) {
        return {
            hasErrors: true,
            errors: spokenLanguagesResult.errors
        }
    }
    
    const submissionRef = dbInstance.collection('submissions').doc()
    const newSubmissionId = submissionRef.id

    const newSubmission = convertToDbSubmission({
        ...submissionInput,
        spokenLanguages: spokenLanguagesResult.data as gqlTypes.SpokenLanguageInput[],
        id: newSubmissionId
    })

    await submissionRef.set(newSubmission)

    addSubmissionResult.data = newSubmission

    return addSubmissionResult
}

export const updateSubmission = async (submissionId: string, fieldsToUpdate: Partial<dbSchema.Submission>): 
    Promise<Result<dbSchema.Submission | null>> => {
    try {
        const submissionRef = dbInstance.collection('submissions').doc(submissionId)

        const snapshot = await submissionRef.get()

        const submissionToUpdate = mapDbEntityTogqlEntity(snapshot.data() as DocumentData)

        const updatedSubmissionValues: dbSchema.Submission = {
            ...submissionToUpdate,
            ...fieldsToUpdate,
            updatedDate: new Date().toISOString()
        }

        await submissionRef.set(updatedSubmissionValues, {merge: true})

        const updatedSubmission = await getSubmissionById(submissionRef.id)

        return updatedSubmission as Result<dbSchema.Submission>
    } catch (error) {
        throw new Error(`Error updating submission: ${error}`)
    }
}

const validateSubmissionInputFields = (input: gqlTypes.SubmissionInput): Result<dbSchema.Submission> => {
    const validatedSubmissionResult: Result<dbSchema.Submission> = {
        hasErrors: false,
        errors: []
    }
    
    if (!input.googleMapsUrl || !input.googleMapsUrl.trim()) {
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

export function convertGqlSubmissionUpdateToDbSubmissionUpdate(submission: Partial<gqlTypes.Submission>):
    Partial<dbSchema.Submission> {
    const { spokenLanguages, ...remainingSubmissionFields } = submission
    
    if (!spokenLanguages) {
        return { ...remainingSubmissionFields }
    }

    return {
        ...remainingSubmissionFields,
        spokenLanguages: spokenLanguages
            .filter((lang): lang is gqlTypes.SpokenLanguage => 
                lang !== null && lang !== undefined &&
                typeof lang.iso639_3 === 'string' &&
                typeof lang.nameJa === 'string' &&
                typeof lang.nameEn === 'string' &&
                typeof lang.nameNative === 'string')
            .map((lang): dbSchema.SpokenLanguage => ({
                iso639_3: lang.iso639_3 as string,
                nameJa: lang.nameJa as string,
                nameEn: lang.nameEn as string,
                nameNative: lang.nameNative as string
            }))
    }
}

function gqlSpokenLanguageToDbSpokenLanguage(lang: gqlTypes.SpokenLanguage): 
    dbSchema.SpokenLanguage {
    return {
        iso639_3: lang.iso639_3 as string,
        nameJa: lang.nameJa as string,
        nameEn: lang.nameEn as string,
        nameNative: lang.nameNative as string
    }
}

export const mapAndValidateSpokenLanguages = (spokenLanguages: gqlTypes.SpokenLanguageInput[]): 
    Result<dbSchema.SpokenLanguage[]> => {
    const validatedSpokenLanguagesResults: Result<dbSchema.SpokenLanguage[]> = {
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

    const validatedLanguages = spokenLanguages
        .filter(lang => lang && 
            lang.iso639_3?.trim() && 
            lang.nameJa?.trim() && 
            lang.nameEn?.trim() && 
            lang.nameNative?.trim())
        .map(lang => ({
            iso639_3: lang.iso639_3?.trim() as string,
            nameJa: lang.nameJa?.trim() as string,
            nameEn: lang.nameEn?.trim() as string,
            nameNative: lang.nameNative?.trim() as string
        }))
    
    if (validatedLanguages.length !== spokenLanguages.length) {
        validatedSpokenLanguagesResults.hasErrors = true
        validatedSpokenLanguagesResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })

        return validatedSpokenLanguagesResults
    }

    validatedSpokenLanguagesResults.data = validatedLanguages.map(gqlSpokenLanguageToDbSpokenLanguage)
    return validatedSpokenLanguagesResults
}

export const mapGqlSearchFiltersToDbSearchFilters = (filters: gqlTypes.SubmissionSearchFilters = {}):
    dbSchema.SubmissionSearchFilters => {
    const mappedLanguages = filters.spokenLanguages?.map(lang => lang ? {
        iso639_3: lang.iso639_3 ?? '',
        nameJa: lang.nameJa ?? '',
        nameEn: lang.nameEn ?? '',
        nameNative: lang.nameNative ?? ''
    } : undefined)

    const filteredLanguages = (mappedLanguages ?? [])
        .filter(lang => lang !== undefined) as dbSchema.SpokenLanguage[]

    const mappedOrderBy = filters.orderBy ? filters.orderBy
        .filter((o): o is gqlTypes.OrderBy => Boolean(o && o.fieldToOrder && o.orderDirection))
        .map(order => ({
            fieldToOrder: order.fieldToOrder as string,
            orderDirection: order.orderDirection as dbSchema.OrderDirection
        })) : undefined

    return {
        ...filters,
        googleMapsUrl: filters.googleMapsUrl === null ? undefined : filters.googleMapsUrl,
        healthcareProfessionalName: filters.healthcareProfessionalName === null ? undefined : 
            filters.healthcareProfessionalName,
        spokenLanguages: filteredLanguages,
        isUnderReview: filters.isUnderReview ?? undefined,
        isApproved: filters.isApproved ?? undefined,
        isRejected: filters.isRejected ?? undefined,
        orderBy: mappedOrderBy,
        limit: filters.limit === null ? undefined : filters.limit,
        createdDate: filters.createdDate ?? undefined,
        updatedDate: filters.updatedDate ?? undefined
    }
}

const mapDbEntityTogqlEntity = (dbEntity: DocumentData) : dbSchema.Submission => {
    const gqlEntity = {
        id: dbEntity.id,
        googleMapsUrl: dbEntity.googleMapsUrl,
        healthcareProfessionalName: dbEntity.healthcareProfessionalName,
        spokenLanguages: dbEntity.spokenLanguages,
        isUnderReview: dbEntity.isUnderReview,
        isApproved: dbEntity.isApproved,
        isRejected: dbEntity.isRejected,
        createdDate: dbEntity.createdDate,
        updatedDate: dbEntity.updatedDate
    }

    return gqlEntity
}
