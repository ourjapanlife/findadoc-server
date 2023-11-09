import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { isInvalidName, hasJapaneseCharacters, hasLatinCharacters } from '../../utils/stringUtils.js'
import { ErrorCode, Result } from '../result.js'

export default function validateNames(
    names: gqlTypes.LocalizedNameInput[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!names || !names?.length) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'names',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
        return
    }
    
    if (names && names.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'names',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    const hasSameLocalCode: string[] = []

    names?.forEach(nameObject => {

        if (hasSameLocalCode.includes(nameObject.locale)) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'names',
                errorCode: ErrorCode.CONTAINS_DUPLICATE_LOCAL,
                httpStatus: 400
            })
        } else {
            hasSameLocalCode.push(nameObject.locale)
        }
        
        if (names && nameObject.firstName.length > 30) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'names',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
    
        if (names && !nameObject.firstName.trim()) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'names',
                errorCode: ErrorCode.REQUIRED,
                httpStatus: 400
            })
        }
    
        if (names && nameObject.lastName.length > 30) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'names',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
    
        if (names && !nameObject.lastName.trim()) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'names',
                errorCode: ErrorCode.REQUIRED,
                httpStatus: 400
            })
        }
    
        if (names && nameObject.middleName && nameObject.middleName.length > 60) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'names',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
    
        if (names) {
            const containsInvalidCharFirstName = isInvalidName(nameObject.firstName)
            const containsInvalidCharLastName = isInvalidName(nameObject.lastName)
            const containsInvalidCharMiddleName = nameObject.middleName ? isInvalidName(nameObject.middleName) : false
    
            if (containsInvalidCharFirstName || containsInvalidCharLastName || containsInvalidCharMiddleName) {
                validationResults.hasErrors = true
                validationResults.errors?.push({
                    field: 'names',
                    errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                    httpStatus: 400
                })
            }
        }
    
        if (names && nameObject.locale == 'en_US') {
            const containsJapaneseCharFirstName = hasJapaneseCharacters(nameObject.firstName)
            const containsJapaneseCharLastName = hasJapaneseCharacters(nameObject.lastName)
            const containsJapaneseCharMiddleName = nameObject.middleName ? hasJapaneseCharacters(nameObject.middleName) : false
            
            if (containsJapaneseCharFirstName || containsJapaneseCharLastName || containsJapaneseCharMiddleName) {
                validationResults.hasErrors = true
                validationResults.errors?.push({
                    field: 'names',
                    errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                    httpStatus: 400
                })
            }
        }
    
        if (names && nameObject.locale == 'ja_JP') {
            const containsLatinCharFirstName = hasLatinCharacters(nameObject.firstName)
            const containsLatinCharLastName = hasLatinCharacters(nameObject.lastName)
            const containsLatinCharMiddleName = nameObject.middleName ? hasLatinCharacters(nameObject.middleName) : false
            
            if (containsLatinCharFirstName || containsLatinCharLastName || containsLatinCharMiddleName) {
                validationResults.hasErrors = true
                validationResults.errors?.push({
                    field: 'names',
                    errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                    httpStatus: 400
                })
            }
        }
    })
}