import { GraphQLError } from 'graphql'

export type Result<T> = {
    data?: T,
    hasErrors: boolean,
    errors?: Error[]
}

type Error = {
    field: string,
    errorCode: ErrorCode,
    httpStatus?: number,
}

export enum ErrorCode {
    NOT_FOUND = 'NOT_FOUND',
    MISSING_INPUT = 'MISSING_INPUT',
    NEGATIVE_NUMBER = 'NEGATIVE_NUMBER',
    INVALID_ID = 'INVALID_ID',
    INVALID_LENGTH_TOO_LONG = 'INVALID_LENGTH_NAME_TOO_LONG',
    MAX_LIMIT = 'MAX_LIMIT',
    MIN_LIMIT = 'MIN_LIMIT',
    INVALID_EMAIL = 'INVALID_EMAIL',
    INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
    INVALID_WEBSITE = 'INVALID_WEBSITE'
}

export const CustomErrors = {
    notFound: (message: string) => {
        throw new GraphQLError(message, {
            extensions: {
                code: 'NOT_FOUND',
                http: {
                    status: 404
                }
            }
        }) 
    },
    missingInput: (message: string) => {
        throw new GraphQLError(message, {
            extensions: {
                code: 'MISSING_INPUT',
                http: {
                    status: 400
                }
            }
        }) 
    }
}