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
    
    if (names.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'names',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    const localesUsed: string[] = []

    names.forEach((nameObject, index) => {
        const isDuplicateLocale: boolean = localesUsed.includes(nameObject.locale)

        if (isDuplicateLocale) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].locale`,
                errorCode: ErrorCode.CONTAINS_DUPLICATE_LOCAL,
                httpStatus: 400
            })
        } else {
            localesUsed.push(nameObject.locale)
        }
        
        if (nameObject.firstName.length > 30) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].firstName`,
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
    
        if (!nameObject.firstName?.trim()) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].firstName`,
                errorCode: ErrorCode.REQUIRED,
                httpStatus: 400
            })
        }
    
        if (nameObject.lastName.length > 30) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].lastName`,
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
    
        if (!nameObject.lastName?.trim()) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].lastName`,
                errorCode: ErrorCode.REQUIRED,
                httpStatus: 400
            })
        }
    
        if (nameObject.middleName && nameObject.middleName.length > 60) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].middleName`,
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }

        if (nameObject.middleName && !nameObject.middleName?.trim()) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].middleName`,
                errorCode: ErrorCode.MISSING_INPUT,
                httpStatus: 400
            })
        }
    
        const containsInvalidCharFirstName = isInvalidName(nameObject.firstName)
        const containsInvalidCharLastName = isInvalidName(nameObject.lastName)
        const containsInvalidCharMiddleName = nameObject.middleName ? isInvalidName(nameObject.middleName) : false

        if (containsInvalidCharFirstName || containsInvalidCharLastName || containsInvalidCharMiddleName) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].${containsInvalidCharFirstName ? 'firstName' : containsInvalidCharLastName ? 'lastName' : 'middleName'}`,
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }
        
        switch(nameObject.locale) {
            case gqlTypes.Locale.EnUs:
                const containsJapaneseCharFirstName = hasJapaneseCharacters(nameObject.firstName)
                const containsJapaneseCharLastName = hasJapaneseCharacters(nameObject.lastName)
                const containsJapaneseCharMiddleName = nameObject.middleName ? hasJapaneseCharacters(nameObject.middleName) : false
            
                if (containsJapaneseCharFirstName || containsJapaneseCharLastName || containsJapaneseCharMiddleName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].${containsInvalidCharFirstName ? 'firstName' : containsInvalidCharLastName ? 'lastName' : 'middleName'}`,
                        errorCode: ErrorCode.CONTAINS_JAPANESE_CHARACTER,
                        httpStatus: 400
                    })
                }
                break;
            case gqlTypes.Locale.JaJp:
                const containsLatinCharFirstName = hasLatinCharacters(nameObject.firstName)
                const containsLatinCharLastName = hasLatinCharacters(nameObject.lastName)
                const containsLatinCharMiddleName = nameObject.middleName ? hasLatinCharacters(nameObject.middleName) : false
            
                if (containsLatinCharFirstName || containsLatinCharLastName || containsLatinCharMiddleName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].${containsInvalidCharFirstName ? 'firstName' : containsInvalidCharLastName ? 'lastName' : 'middleName'}`,
                        errorCode: ErrorCode.CONTAINS_LATIN_CHARACTER,
                        httpStatus: 400
                    })
                }
        }
    
    })
}