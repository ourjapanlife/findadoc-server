import { Submission } from '../typeDefs/dbSchema'
import { DocumentData, getFirestore } from 'firebase-admin/firestore'
import { SpokenLanguage, SpokenLanguageInput } from '../typeDefs/gqlTypes'

export const getSubmissionById = async (id: string) : Promise<Submission | null> => {
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
        throw new Error(`Failed to retrieve submission: ${error}.`)
    }
}

function convertToDbSubmission(submission: import('../typeDefs/gqlTypes').Submission): 
    import('../typeDefs/dbSchema').Submission {
    return {
        ...submission,
        spokenLanguages: submission.spokenLanguages
            .filter(lang => lang !== null) as import('../typeDefs/dbSchema').SpokenLanguage[]
    }
}

export const addSubmission = async (submission: import('../typeDefs/gqlTypes').Submission) : Promise<Submission> => {
    try {
        const dbSubmission = convertToDbSubmission(submission)

        const db = getFirestore()
        const submissionRef = db.collection('submissions')

        const docRef = await submissionRef.add(dbSubmission)

        const newSubmission: Submission = {
            ...dbSubmission,
            id: docRef.id
        }

        return newSubmission
    } catch (error) {
        throw new Error(`Failed to add submission: ${error}.`)
    }
}

export const updateSubmission = async (id: string, updatedFields: Partial<Submission>) : Promise<string> => {
    try {
        const db = getFirestore()
        const submissionRef = db.collection('submissions').doc(id)

        const snapshot = await submissionRef.get()

        const submissionToUpdate = mapDbEntityTogqlEntity(snapshot.data() as DocumentData)

        const updatedSubmission: Submission = {
            ...submissionToUpdate,
            ...updatedFields
        }

        await submissionRef.update(updatedSubmission)

        return 'Submission updated successfully!'
    } catch (error) {
        throw new Error(`Failed to update submission: ${error}.`)
    }
}

// There was a mismatch between the `SpokenLanguage` type in `gqlTypes` and `dbSchema`
function gqlSpokenLanguageToDbSpokenLanguage(lang: SpokenLanguage): import('../typeDefs/dbSchema').SpokenLanguage {
    return {
        iso639_3: lang.iso639_3 as string,
        nameJa: lang.nameJa as string,
        nameEn: lang.nameEn as string,
        nameNative: lang.nameNative as string
    }
}

export const mapAndValidateSpokenLanguages = (spokenLanguages: SpokenLanguageInput[]): 
    import('../typeDefs/dbSchema').SpokenLanguage[] | undefined => {
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

const mapDbEntityTogqlEntity = (dbEntity: DocumentData) : Submission => {
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