
import { SpokenLanguage } from '../typeDefs/gqlTypes';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSpokenLanguages = async () => {
    const res = await prisma.spokenLanguage.findMany();

    return res as Array<SpokenLanguage>;
};

