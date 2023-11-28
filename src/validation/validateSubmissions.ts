import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { hasScriptTags, isInvalidName } from '../../utils/stringUtils.js'

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

function validateSubmissionSearchBySpokenLanguage(
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

function validateSearchByName(
    filters: gqlTypes.SubmissionSearchFilters,
    validateSearchResults: Result<unknown>
): void {
    const name = filters.healthcareProfessionalName

    if (!name) {
        return
    }

    if (name.trim() === '') {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
    }

    if (name.length > 128) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (hasScriptTags(name)) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.INVALID_INPUT,
            httpStatus: 400
        })
    }

    if (isInvalidName(name)) {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'healthcareProfessionalName',
            errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
            httpStatus: 400
        })
    }
}

function validateSearchByGoogleMapsUrl(
    filters: gqlTypes.SubmissionSearchFilters,
    validateSearchResults: Result<unknown>
): void {
    const mapUrl = filters.googleMapsUrl

    if (!mapUrl) {
        return
    }

    if (mapUrl.trim() === '') {
        validateSearchResults.hasErrors = true
        validateSearchResults.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.MISSING_INPUT,
            httpStatus: 400
        })
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
    validateSubmissionSearchBySpokenLanguage(filters, validateSearchResults)
    validateSearchByName(filters, validateSearchResults)
    validateSearchByGoogleMapsUrl(filters, validateSearchResults)
    validateSearchLimit(filters, validateSearchResults)
    validateSearchOffset(filters, validateSearchResults)

    return validateSearchResults
}