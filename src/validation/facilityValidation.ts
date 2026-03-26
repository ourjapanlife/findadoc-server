import * as gqlTypes from '../typeDefs/gqlTypes.js'
import { ErrorCode, Result } from '../result.js'
import { hasScriptTags, hasSpecialCharacters, isValidEmail, isValidPhoneNumber, isValidWebsite } from '../../utils/stringUtils.js'

// Used for v4 uuid
const UUID_REGEX =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

/**
 * Validates the ID input for database queries, checking for length and special characters.
 */
export function validateIdInput(id: string): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (UUID_REGEX.test(id)) {
        return validationResults
    }

    if (id && (hasSpecialCharacters(id) || id.length > 4096)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'id',
            errorCode: ErrorCode.INVALID_ID,
            httpStatus: 400
        })
    }

    return validationResults
}

/**
 * Validates search input to prevent overly long text filters or extreme limit/offset values.
 */
export function validateFacilitiesSearchInput(searchInput: gqlTypes.FacilitySearchFilters): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: [],
        hasErrors: false,
        errors: []
    }

    if (searchInput.nameEn && searchInput.nameEn.toLowerCase().length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.nameJa && searchInput.nameJa.length > 128) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    if (searchInput.limit !== null && searchInput.limit !== undefined && searchInput.limit > 1000) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (searchInput.limit !== null && searchInput.limit !== undefined && searchInput.limit < 0) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'limit',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }

    if (searchInput.offset !== null && searchInput.offset !== undefined && searchInput.offset > 100000) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'offset',
            errorCode: ErrorCode.MAX_LIMIT,
            httpStatus: 400
        })
    }

    if (searchInput.offset !== null && searchInput.offset !== undefined && searchInput.offset < 0) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'offset',
            errorCode: ErrorCode.MIN_LIMIT,
            httpStatus: 400
        })
    }

    return validationResults
}

/**
 * Validates the input for creating a facility, ensuring required fields are present and valid.
 * Rules:
 * - nameEn: required, non-empty after trim, max 128 chars, no script tags
 * - nameJa: required, non-empty after trim, max 128 chars, no script tags
 * - mapLatitude: required, range [-90, 90]
 * - mapLongitude: required, range [-180, 180]
 * - contact: validated via validateContactInput
 */
export function validateCreateFacilityInput(input: gqlTypes.CreateFacilityInput): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (!input.nameEn || !input.nameEn.trim()) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameEn',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    } else {
        if (input.nameEn.length > 128) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameEn',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
        if (hasScriptTags(input.nameEn)) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameEn',
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }
    }

    if (!input.nameJa || !input.nameJa.trim()) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'nameJa',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    } else {
        if (input.nameJa.length > 128) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameJa',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
        if (hasScriptTags(input.nameJa)) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameJa',
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }
    }

    // mapLatitude must be in range [-90, 90]
    if (input.mapLatitude < -90 || input.mapLatitude > 90) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'mapLatitude',
            errorCode: ErrorCode.INVALID_COORDINATES,
            httpStatus: 400
        })
    }

    // mapLongitude must be in range [-180, 180]
    if (input.mapLongitude < -180 || input.mapLongitude > 180) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'mapLongitude',
            errorCode: ErrorCode.INVALID_COORDINATES,
            httpStatus: 400
        })
    }

    if (input.contact) {
        const contactValidationResults = validateContactInput(input.contact)

        if (contactValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...contactValidationResults.errors as [])
        }
    }

    return validationResults
}

/**
 * Validates the input for updating a facility.
 * All fields are optional; only provided fields are validated.
 * Rules:
 * - nameEn: if provided, non-empty after trim, max 128 chars, no script tags
 * - nameJa: if provided, non-empty after trim, max 128 chars, no script tags
 * - mapLatitude: if provided, range [-90, 90]
 * - mapLongitude: if provided, range [-180, 180]
 * - contact: if provided, validated via validateContactInput
 */
export function validateUpdateFacilityInput(input: Partial<gqlTypes.UpdateFacilityInput>): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (input.nameEn !== undefined) {
        if (!input.nameEn.trim()) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameEn',
                errorCode: ErrorCode.REQUIRED,
                httpStatus: 400
            })
        }
        if (input.nameEn.length > 128) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameEn',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
        if (hasScriptTags(input.nameEn)) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameEn',
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }
    }

    if (input.nameJa !== undefined) {
        if (!input.nameJa.trim()) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameJa',
                errorCode: ErrorCode.REQUIRED,
                httpStatus: 400
            })
        }
        if (input.nameJa.length > 128) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameJa',
                errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
                httpStatus: 400
            })
        }
        if (hasScriptTags(input.nameJa)) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'nameJa',
                errorCode: ErrorCode.CONTAINS_INVALID_CHARACTER,
                httpStatus: 400
            })
        }
    }

    if (input.mapLatitude !== undefined && (input.mapLatitude < -90 || input.mapLatitude > 90)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'mapLatitude',
            errorCode: ErrorCode.INVALID_COORDINATES,
            httpStatus: 400
        })
    }

    if (input.mapLongitude !== undefined && (input.mapLongitude < -180 || input.mapLongitude > 180)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'mapLongitude',
            errorCode: ErrorCode.INVALID_COORDINATES,
            httpStatus: 400
        })
    }

    if (input.contact) {
        const contactValidationResults = validateContactInput(input.contact)

        if (contactValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...contactValidationResults.errors as [])
        }
    }

    return validationResults
}

/**
 * Validates contact information for a facility.
 * Rules:
 * - googleMapsUrl: required, non-empty after trim, max 2048 chars
 * - phone: required, non-empty after trim, valid phone number format
 * - email: optional, valid email format (case-insensitive), max 128 chars
 * - website: optional, valid URL format (case-insensitive), max 2048 chars
 * - address: validated via validateAddressInput
 */
export function validateContactInput(contactInput: gqlTypes.ContactInput): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    if (!contactInput) {
        return validationResults
    }

    // googleMapsUrl is required, max 2048 chars
    if (!contactInput.googleMapsUrl || !contactInput.googleMapsUrl.trim()) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    } else if (contactInput.googleMapsUrl.length > 2048) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'googleMapsUrl',
            errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG,
            httpStatus: 400
        })
    }

    // phone is required, must be valid format
    if (!contactInput.phone || !contactInput.phone.trim()) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'phone',
            errorCode: ErrorCode.REQUIRED,
            httpStatus: 400
        })
    } else if (!isValidPhoneNumber(contactInput.phone)) {
        validationResults.hasErrors = true
        validationResults.errors?.push({
            field: 'phone',
            errorCode: ErrorCode.INVALID_PHONE_NUMBER,
            httpStatus: 400
        })
    }

    // email is optional, max 128 chars, must be valid format (compared case-insensitively)
    if (contactInput.email) {
        if (!isValidEmail(contactInput.email.toLowerCase()) || contactInput.email.length > 128) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'email',
                errorCode: ErrorCode.INVALID_EMAIL,
                httpStatus: 400
            })
        }
    }

    // website is optional, max 2048 chars, must be valid URL format (compared case-insensitively)
    if (contactInput.website) {
        if (!isValidWebsite(contactInput.website.toLowerCase()) || contactInput.website.length > 2048) {
            validationResults.hasErrors = true
            validationResults.errors?.push({
                field: 'website',
                errorCode: ErrorCode.INVALID_WEBSITE,
                httpStatus: 400
            })
        }
    }

    if (contactInput.address) {
        const addressValidationResults = validateAddressInput(contactInput.address)

        if (addressValidationResults.hasErrors) {
            validationResults.hasErrors = true
            validationResults.errors?.push(...addressValidationResults.errors as [])
        }
    }

    return validationResults
}

/**
 * Validates a physical address for a facility.
 * Rules:
 * - addressLine1En: required, non-empty after trim, max 128 chars
 * - addressLine2En: optional, max 128 chars
 * - addressLine1Ja: required, non-empty after trim, max 128 chars
 * - addressLine2Ja: optional, max 128 chars
 * - cityEn: required, non-empty after trim, max 64 chars
 * - cityJa: required, non-empty after trim, max 64 chars
 * - postalCode: required, non-empty after trim, max 18 chars
 * - prefectureEn: required, non-empty after trim, max 128 chars
 * - prefectureJa: required, non-empty after trim, max 128 chars
 */
function validateRequiredStringField(
    value: string | undefined | null, field: string, maxLength: number, results: Result<unknown>
): void {
    if (!value || !value.trim()) {
        results.hasErrors = true
        results.errors?.push({ field, errorCode: ErrorCode.REQUIRED, httpStatus: 400 })
    } else if (value.length > maxLength) {
        results.hasErrors = true
        results.errors?.push({ field, errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG, httpStatus: 400 })
    }
}

function validateOptionalStringField(
    value: string | undefined | null, field: string, maxLength: number, results: Result<unknown>
): void {
    if (value && value.length > maxLength) {
        results.hasErrors = true
        results.errors?.push({ field, errorCode: ErrorCode.INVALID_LENGTH_TOO_LONG, httpStatus: 400 })
    }
}

export function validateAddressInput(input: gqlTypes.PhysicalAddressInput): Result<unknown> {
    const validationResults: Result<unknown> = {
        data: undefined,
        hasErrors: false,
        errors: []
    }

    validateRequiredStringField(input.addressLine1En, 'addressLine1En', 128, validationResults)
    validateOptionalStringField(input.addressLine2En, 'addressLine2En', 128, validationResults)
    validateRequiredStringField(input.addressLine1Ja, 'addressLine1Ja', 128, validationResults)
    validateOptionalStringField(input.addressLine2Ja, 'addressLine2Ja', 128, validationResults)
    validateRequiredStringField(input.cityEn, 'cityEn', 64, validationResults)
    validateRequiredStringField(input.cityJa, 'cityJa', 64, validationResults)
    validateRequiredStringField(input.postalCode, 'postalCode', 18, validationResults)
    validateRequiredStringField(input.prefectureEn, 'prefectureEn', 128, validationResults)
    validateRequiredStringField(input.prefectureJa, 'prefectureJa', 128, validationResults)

    return validationResults
}
