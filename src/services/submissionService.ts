import { DocumentData, getFirestore, Query } from 'firebase-admin/firestore'
import * as gqlType from '../typeDefs/gqlTypes'
import * as dbSchema from '../typeDefs/dbSchema'

export const getSubmissionById = async (id: string) : Promise<dbSchema.Submission | null> => {
    try {
        const db = getFirestore()
        const submissionRef = db.collection('submissions')
        const snapshot = await submissionRef.doc(id).get()

        if (!snapshot.exists) {
            return null
        }

        const convertedEntity = mapDbEntityTogqlEntity(snapshot.data() as DocumentData)

        return convertedEntity
    } catch (error) {
        throw new Error(`Error retrieving submission: ${error}`)
    }
}

export async function getSubmissions(filters: dbSchema.SubmissionSearchFilters = {}) {
    try {
        const db = getFirestore()
        let subRef: Query<DocumentData> = db.collection('submissions')

        if (filters.googleMapsUrl) {
            subRef = subRef.where('googleMapsUrl', '==', filters.googleMapsUrl)
        }

        if (filters.healthcareProfessionalName) {
            subRef = subRef.where('healthcareProfessionalName', '==', filters.healthcareProfessionalName)
        }

        if (typeof filters.isUnderReview !== 'undefined') {
            subRef = subRef.where('isUnderReview', '==', filters.isUnderReview)
        }

        if (typeof filters.isApproved !== 'undefined') {
            subRef = subRef.where('isApproved', '==', filters.isApproved)
        }

        if (typeof filters.isRejected !== 'undefined') {
            subRef = subRef.where('isRejected', '==', filters.isRejected)
        }

        const snapshot = await subRef.get()

        let submissions = snapshot.docs.map(doc => 
            mapDbEntityTogqlEntity({ ...doc.data(), id: doc.id}))

        if (filters.spokenLanguages && filters.spokenLanguages.length) {
            const requiredLanguages = filters.spokenLanguages
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

function convertToDbSubmission(submission: gqlType.Submission): 
    dbSchema.Submission {
    return {
        ...submission,
        spokenLanguages: submission.spokenLanguages
            .filter(lang => lang !== null) as dbSchema.SpokenLanguage[]
    }
}

export const addSubmission = async (submission: gqlType.Submission): 
    Promise<dbSchema.Submission> => {
    try {
        const dbSubmission = convertToDbSubmission(submission)

        const db = getFirestore()
        const submissionRef = db.collection('submissions')

        const docRef = await submissionRef.add(dbSubmission)

        const newSubmission: dbSchema.Submission = {
            ...dbSubmission,
            id: docRef.id
        }

        return newSubmission
    } catch (error) {
        throw new Error(`Error adding submission: ${error}`)
    }
}

export const updateSubmission = async (id: string, updatedFields: Partial<dbSchema.Submission>): 
    Promise<string> => {
    try {
        const db = getFirestore()
        const submissionRef = db.collection('submissions').doc(id)

        const snapshot = await submissionRef.get()

        const submissionToUpdate = mapDbEntityTogqlEntity(snapshot.data() as DocumentData)

        const updatedSubmission: dbSchema.Submission = {
            ...submissionToUpdate,
            ...updatedFields
        }

        await submissionRef.update(updatedSubmission)

        return 'Submission updated successfully!'
    } catch (error) {
        throw new Error(`Error updating submission: ${error}`)
    }
}

export function convertGqlSubmissionUpdateToDbSubmissionUpdate(submission: Partial<gqlType.Submission>):
    Partial<dbSchema.Submission> {
    const { spokenLanguages, ...remainingSubmissionFields } = submission
    
    if (!spokenLanguages) {
        return { ...remainingSubmissionFields }
    }

    return {
        ...remainingSubmissionFields,
        spokenLanguages: spokenLanguages
            .filter((lang): lang is gqlType.SpokenLanguage => 
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

function gqlSpokenLanguageToDbSpokenLanguage(lang: gqlType.SpokenLanguage): 
    dbSchema.SpokenLanguage {
    return {
        iso639_3: lang.iso639_3 as string,
        nameJa: lang.nameJa as string,
        nameEn: lang.nameEn as string,
        nameNative: lang.nameNative as string
    }
}

export const mapAndValidateSpokenLanguages = (spokenLanguages: gqlType.SpokenLanguageInput[]): 
    dbSchema.SpokenLanguage[] | undefined => {
    if (!spokenLanguages || ! spokenLanguages.length) { return undefined }

    const validatedLanguages = spokenLanguages
        .filter(lang => lang && lang.iso639_3 && lang.nameJa && lang.nameEn && lang.nameNative)
        .map(lang => ({
            iso639_3: lang.iso639_3 as string,
            nameJa: lang.nameJa as string,
            nameEn: lang.nameEn as string,
            nameNative: lang.nameNative as string
        }))
    
    if (validatedLanguages.length !== spokenLanguages.length) {
        throw new Error('Some spoken languages are missing required fields.')
    }

    return validatedLanguages.map(gqlSpokenLanguageToDbSpokenLanguage)
}

export const mapGqlSearchFiltersToDbSearchFilters = (filters: gqlType.SubmissionSearchFilters):
    dbSchema.SubmissionSearchFilters => {
    const mappedLanguages = filters.spokenLanguages?.map(lang => lang ? {
        iso639_3: lang.iso639_3 ?? '',
        nameJa: lang.nameJa ?? '',
        nameEn: lang.nameEn ?? '',
        nameNative: lang.nameNative ?? ''
    } : undefined)

    const filteredLanguages = (mappedLanguages ?? [])
        .filter(lang => lang !== undefined) as dbSchema.SpokenLanguage[]

    return {
        ...filters,
        // fix: false might be a better default for these booleans than undefined.
        // fix: false might be a better default for these booleans than undefined.
        googleMapsUrl: filters.googleMapsUrl === null ? undefined : filters.googleMapsUrl,
        healthcareProfessionalName: filters.healthcareProfessionalName == null ? undefined : 
            filters.healthcareProfessionalName,
        spokenLanguages: filteredLanguages,
        isUnderReview: filters.isUnderReview === null ? undefined : filters.isUnderReview,
        isApproved: filters.isApproved === null ? undefined : filters.isApproved,
        isRejected: filters.isRejected === null ? undefined : filters.isRejected
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
        isRejected: dbEntity.isRejected
    }

    return gqlEntity
}
