
import { SpokenLanguage } from '../typeDefs/gqlTypes'
import prisma from '../db/client'

export const getSpokenLanguages = async () => {
    const languages = await prisma.spokenLanguage.findMany()

    return languages as Array<SpokenLanguage>
}

export const getSpokenLanguageByIso = async (iso639_3: string) => {
    const found = await prisma.spokenLanguage.findFirst({
        where: {
            iso639_3
        }
    })

    return found as SpokenLanguage
}

