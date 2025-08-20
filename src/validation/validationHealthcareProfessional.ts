import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { isInvalidName, hasJapaneseCharacters, hasLatinCharacters } from '../../utils/stringUtils.js'
import { ErrorCode, Result } from '../result.js'

export function validateNames(
    names: gqlTypes.LocalizedNameInput[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!names || !names.length) {
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

        // 30 characters is the limit on passports and driver's licenses 
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
                errorCode: ErrorCode.MISSING_INPUT,
                httpStatus: 400
            })
        }

        // 35 characters, since people can have 2 middle names, so 5 characters extra as a buffer
        if (nameObject.middleName && nameObject.middleName.length > 35) {
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

        // 30 characters is the limit on passports and driver's licenses 
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
                errorCode: ErrorCode.MISSING_INPUT,
                httpStatus: 400
            })
        }

        const containsInvalidCharFirstName = isInvalidName(nameObject.firstName)
        const containsInvalidCharLastName = isInvalidName(nameObject.lastName)
        const containsInvalidCharMiddleName = nameObject.middleName ? isInvalidName(nameObject.middleName) : false

        if (containsInvalidCharFirstName) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].firstName`,
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }

        if (containsInvalidCharMiddleName) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].middleName`,
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }

        if (containsInvalidCharLastName) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: `names[${index}].lastName`,
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }

        switch (nameObject.locale) {
            case gqlTypes.Locale.EnUs: {
                const containsJapaneseCharFirstName = hasJapaneseCharacters(nameObject.firstName)
                const containsJapaneseCharLastName = hasJapaneseCharacters(nameObject.lastName)
                const containsJapaneseCharMiddleName = nameObject.middleName
                    ? hasJapaneseCharacters(nameObject.middleName)
                    : false

                if (containsJapaneseCharFirstName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].firstName`,
                        errorCode: ErrorCode.CONTAINS_JAPANESE_CHARACTER,
                        httpStatus: 400
                    })
                }

                if (containsJapaneseCharMiddleName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].middleName`,
                        errorCode: ErrorCode.CONTAINS_JAPANESE_CHARACTER,
                        httpStatus: 400
                    })
                }

                if (containsJapaneseCharLastName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].lastName`,
                        errorCode: ErrorCode.CONTAINS_JAPANESE_CHARACTER,
                        httpStatus: 400
                    })
                }
                break
            }
            case gqlTypes.Locale.JaJp: {
                const containsLatinCharFirstName = hasLatinCharacters(nameObject.firstName)
                const containsLatinCharLastName = hasLatinCharacters(nameObject.lastName)
                const containsLatinCharMiddleName = nameObject.middleName
                    ? hasLatinCharacters(nameObject.middleName)
                    : false

                if (containsLatinCharFirstName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].firstName`,
                        errorCode: ErrorCode.CONTAINS_LATIN_CHARACTER,
                        httpStatus: 400
                    })
                }

                if (containsLatinCharMiddleName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].middleName`,
                        errorCode: ErrorCode.CONTAINS_LATIN_CHARACTER,
                        httpStatus: 400
                    })
                }

                if (containsLatinCharLastName) {
                    validationResults.hasErrors = true
                    validationResults.errors?.push({
                        field: `names[${index}].lastName`,
                        errorCode: ErrorCode.CONTAINS_LATIN_CHARACTER,
                        httpStatus: 400
                    })
                }
            }
        }
    })
}

export function validateDegrees(
    degrees: gqlTypes.InputMaybe<gqlTypes.Degree[]> | undefined,
    validationResults: Result<unknown>
): void {
    if (!degrees || !degrees.length) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'degrees',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
        return
    }

    if (degrees && degrees.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'degrees',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }
}

export function validateProfessionalsSearchInput(
    searchInput: gqlTypes.InputMaybe<gqlTypes.HealthcareProfessionalSearchFilters> | undefined
): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: [],
        hasErrors: false,
        errors: []
    }

    if (!searchInput) {
        return validationResults
    }

    if (searchInput.specialties && searchInput.specialties.length > 48) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'specialties',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.spokenLanguages && searchInput.spokenLanguages.length > 64) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.offset && searchInput.offset > 100000) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'offset',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (searchInput.offset && searchInput.offset < 0) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'offset',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }

    if (searchInput.limit && searchInput.limit > 1000) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (searchInput.limit && searchInput.limit < 0) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }

    return validationResults
}

export function validateSpecialties(
    specialties: gqlTypes.Specialty[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!specialties || !specialties.length) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'specialties',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
        return
    }

    if (specialties.length > 32) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'specialties',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }
}

export function validateInsurance(
    insurance: gqlTypes.Insurance[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!insurance || !insurance.length) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'insurance',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
        return
    }

    if (insurance && insurance.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'insurance',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }
}

export function validateSpokenLanguages(
    spokenLanguages: gqlTypes.Locale[] | undefined | null,
    validationResults: Result<unknown>
): void {
    if (!spokenLanguages || !spokenLanguages.length) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
        return
    }

    if (spokenLanguages && spokenLanguages.length > 16) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }
}
