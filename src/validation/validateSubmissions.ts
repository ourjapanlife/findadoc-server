import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { hasScriptTags, isInvalidName } from '../../utils/stringUtils.js'
import { validateContactInput } from './validateFacility.js'
import { validateNames, validateDegrees, validateSpecialties, validateInsurance, validateSpokenLanguages } from './validationHealthcareProfessional.js'

export function validateIdInput(id: string): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (!id) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
        return validationResults
    }

    const okId = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

    if (!okId.test(id) || id.length > 4096) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
    }

    return validationResults
}

function validateSubmissionOrderBy(
    filters: gqlTypes.SubmissionSearchFilters,
    validateSearchResults: Result<unknown>
): void {
    if (!filters.orderBy || filters.orderBy.length === 0) {
        return
    }
    
    const validOrderByFields = [
        'googleMapsUrl',
        'healthcareProfessionalName',
        'isUnderReview',
        'isApproved',
        'isRejected',
        'createdDate',
        'updatedDate'
    ]

    if (filters.orderBy?.some(order => order.fieldToOrder === 'id')) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'orderBy',
            errorCode: ErrorCode.ORDERBY_OPTION_INVALID,
            httpStatus: 400
        })
    }

    const invalidOrderByOption = filters.orderBy?.find(order => 
        !validOrderByFields.includes(order.fieldToOrder))

    if (invalidOrderByOption) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'orderBy',
            errorCode: ErrorCode.ORDERBY_OPTION_NOT_FOUND,
            httpStatus: 400
        })
    }

    if (filters.orderBy.length > 2) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'orderBy',
            errorCode: ErrorCode.ORDERBY_OPTION_MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (filters.orderBy.length === 2 && 
        filters.orderBy[0].fieldToOrder === filters.orderBy[1].fieldToOrder) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'orderBy',
            errorCode: ErrorCode.ORDERBY_FIELD_SELECTED_TWICE,
            httpStatus: 400
        })
    }
}

function validateSubmissionSpokenLanguage(
    filters: gqlTypes.SubmissionSearchFilters,
    validateSearchResults: Result<unknown>
): void {
    if (!filters.spokenLanguages) {
        return
    }

    if (filters.spokenLanguages.length == 0) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'spokenLanguages',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
    }
    
    for (const lang of filters.spokenLanguages) {
        if (!Object.values(gqlTypes.Locale).includes(lang)) {
            validateSearchResults.hasErrors = true
            validateSearchResults.errors?.push({
                field: 'spokenLanguages',
                errorCode: ErrorCode.INVALID_LANGUAGE_INPUT,
                httpStatus: 400
            })
        }
    }
    
    const languageCodeOccurrences: { [key: string]: number } = {}

    for (const lang of filters.spokenLanguages) {
        if (languageCodeOccurrences[lang]) {     
            validateSearchResults.hasErrors = true
            validateSearchResults.errors?.push({
                field: 'spokenLanguages',
                errorCode: ErrorCode.INVALID_LANGUAGE_INPUT,
                httpStatus: 400
            })
            break
        } else {
            languageCodeOccurrences[lang] = 1
        }
    }
}

function validateSubmissionName(
    filters: gqlTypes.SubmissionSearchFilters,
    validateNameResults: Result<unknown>
): void {
    const name = filters.healthcareProfessionalName

    // Check if "healthcareProfessionalName" is provided in the search filters.
    // If not included (undefined), exit the function as this filter is optional.
    if (name === undefined) {
        return
    }

    // If "healthcareProfessionalName" is provided, reject empty or null values.
    if (name === null || name.trim() === '') {
        validateNameResults.hasErrors = true
        validateNameResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
        return
    }

    if (name.length > 128) {
        validateNameResults.hasErrors = true
        validateNameResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (hasScriptTags(name)) {
        validateNameResults.hasErrors = true
        validateNameResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.INVALID_INPUT,
            httpStatus: 400
        })
    }

    if (isInvalidName(name)) {
        validateNameResults.hasErrors = true
        validateNameResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
            httpStatus: 400
        })
    }
}

function validateSubmissionGoogleMapsUrl(
    filters: gqlTypes.SubmissionSearchFilters,
    validateSearchResults: Result<unknown>
): void {
    const mapUrl = filters.googleMapsUrl

    // Check if "googleMapsUrl" is provided in the search filters.
    // If not included (undefined), exit the function as this filter is optional.
    if (mapUrl === undefined) {
        return
    }

    // If "googleMapsUrl" is provided, reject empty or null values.
    if (mapUrl === null || mapUrl.trim() === '') {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
        return
    }

    if (mapUrl.length > 1028) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (hasScriptTags(mapUrl)) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.INVALID_INPUT,
            httpStatus: 400
        })
    }
}

function validateSearchLimit(
    filters: gqlTypes.SubmissionSearchFilters,
    validateSearchResults: Result<unknown>
): void {
    if (filters.limit && filters.limit > 1000) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (filters.limit && filters.limit < 0) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }
}

function validateSearchOffset(
    filters: gqlTypes.SubmissionSearchFilters,
    validateSearchResults: Result<unknown>
): void {
    if (filters.offset && filters.offset > 10000) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'offset',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (filters.offset && filters.offset < 0) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'offset',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }
}

export function validateSubmissionSearchFilters(filters: gqlTypes.SubmissionSearchFilters): Result<unknown> {
    const validateSearchResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    validateSubmissionOrderBy(filters, validateSearchResults)
    validateSubmissionSpokenLanguage(filters, validateSearchResults)
    validateSubmissionName(filters, validateSearchResults)
    validateSubmissionGoogleMapsUrl(filters, validateSearchResults)
    validateSearchLimit(filters, validateSearchResults)
    validateSearchOffset(filters, validateSearchResults)

    return validateSearchResults
}

export function validateCreateSubmissionInputs(input:gqlTypes.CreateSubmissionInput): Result<unknown> {
    const validateSubmissionInputs: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    validateSubmissionName(input, validateSubmissionInputs)
    validateSubmissionGoogleMapsUrl(input, validateSubmissionInputs)
    validateSubmissionSpokenLanguage(input, validateSubmissionInputs)

    return validateSubmissionInputs
}

export function isValidHpInput(hp: gqlTypes.CreateHealthcareProfessionalInput | null | undefined): boolean {
    if (!hp) { return false }
    if (!Array.isArray(hp.names) || hp.names.length === 0) { return false }

    const first = hp.names[0]

    if (!first.locale) { return false }
    if (!first.firstName) { return false }
    if (!first.lastName) { return false }

    return true
}

export function validateUpdateSubmissionInput(
    input: Partial<gqlTypes.UpdateSubmissionInput>
): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (input.healthcareProfessionalName !== undefined) {
        validateSubmissionName(
            { healthcareProfessionalName: input.healthcareProfessionalName } as gqlTypes.SubmissionSearchFilters,
            validationResults
        )
    }

    if (input.googleMapsUrl !== undefined) {
        validateSubmissionGoogleMapsUrl(
            { googleMapsUrl: input.googleMapsUrl } as gqlTypes.SubmissionSearchFilters,
            validationResults
        )
    }

    if (input.spokenLanguages !== undefined) {
        validateSubmissionSpokenLanguage(
            { spokenLanguages: input.spokenLanguages } as gqlTypes.SubmissionSearchFilters,
            validationResults
        )
    }

    if (input.notes !== undefined && input.notes !== null) {
        if (input.notes.length > 4096) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'notes',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }

        if (hasScriptTags(input.notes)) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'notes',
                errorCode: ErrorCode.INVALID_INPUT,
                httpStatus: 400
            })
        }
    }

    if (input.facility) {
        if (input.facility.nameEn && input.facility.nameEn.length > 128) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'facility.nameEn',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }

        if (input.facility.nameJa && input.facility.nameJa.length > 128) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'facility.nameJa',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }

        if (input.facility.contact) {
            const contactValidation = validateContactInput(input.facility.contact)

            if (contactValidation.hasErrors) {
                validationResults.hasErrors = true
                validationResults.errors?.push(...(contactValidation.errors ?? []))
            }
        }
    }

    if (input.healthcareProfessionals && input.healthcareProfessionals.length > 0) {
        input.healthcareProfessionals.forEach((hp, index) => {
            if (hp.names) {
                const namesValidation: Result<unknown> = {
                    data: undefined,
                    hasErrors: false,
                    errors: []
                }

                validateNames(hp.names, namesValidation)
                if (namesValidation.hasErrors) {
                    validationResults.hasErrors = true
                    namesValidation.errors?.forEach(err => {
                        validationResults.errors?.push({
                            ...err,
                            field: err.field.replace('names', `healthcareProfessionals[${index}].names`)
                        })
                    })
                }
            }

            if (hp.degrees !== undefined) {
                const degreesValidation: Result<unknown> = {
                    data: undefined,
                    hasErrors: false,
                    errors: []
                }

                validateDegrees(hp.degrees, degreesValidation)
                if (degreesValidation.hasErrors) {
                    validationResults.hasErrors = true
                    degreesValidation.errors?.forEach(err => {
                        validationResults.errors?.push({
                            ...err,
                            field: `healthcareProfessionals[${index}].degrees`
                        })
                    })
                }
            }

            if (hp.specialties !== undefined) {
                const specialtiesValidation: Result<unknown> = {
                    data: undefined,
                    hasErrors: false,
                    errors: []
                }

                validateSpecialties(hp.specialties, specialtiesValidation)
                if (specialtiesValidation.hasErrors) {
                    validationResults.hasErrors = true
                    specialtiesValidation.errors?.forEach(err => {
                        validationResults.errors?.push({
                            ...err,
                            field: `healthcareProfessionals[${index}].specialties`
                        })
                    })
                }
            }

            if (hp.acceptedInsurance !== undefined) {
                const insuranceValidation: Result<unknown> = {
                    data: undefined,
                    hasErrors: false,
                    errors: []
                }

                validateInsurance(hp.acceptedInsurance, insuranceValidation)
                if (insuranceValidation.hasErrors) {
                    validationResults.hasErrors = true
                    insuranceValidation.errors?.forEach(err => {
                        validationResults.errors?.push({
                            ...err,
                            field: `healthcareProfessionals[${index}].acceptedInsurance`
                        })
                    })
                }
            }

            if (hp.spokenLanguages !== undefined) {
                const languagesValidation: Result<unknown> = {
                    data: undefined,
                    hasErrors: false,
                    errors: []
                }

                validateSpokenLanguages(hp.spokenLanguages, languagesValidation)
                if (languagesValidation.hasErrors) {
                    validationResults.hasErrors = true
                    languagesValidation.errors?.forEach(err => {
                        validationResults.errors?.push({
                            ...err,
                            field: `healthcareProfessionals[${index}].spokenLanguages`
                        })
                    })
                }
            }

            if (hp.additionalInfoForPatients && hp.additionalInfoForPatients.length > 2048) {
                validationResults.hasErrors = true
                validationResults.errors?.push({
                    field: `healthcareProfessionals[${index}].additionalInfoForPatients`,
                    errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                    httpStatus: 400
                })
            }
        })
    }

    const statusFlags = [input.isUnderReview, input.isApproved, input.isRejected].filter(Boolean)

    if (statusFlags.length > 1) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'status',
            errorCode: ErrorCode.INVALID_INPUT,
            httpStatus: 400
        })
    }

    return validationResults
}