import { Insurance, Locale, PhysicalAddress } from './gqlTypes'

export type Contact = {
    email: string
    phone: string
    website: string
    mapsLink: string
    address: PhysicalAddress
}

export type Facility = {
    id: string
    nameEn: string
    nameJa: string
    contact: Contact
    healthcareProfessionalIds: string[]
    createdDate: string,
    updatedDate: string,
    isDeleted: boolean
}

export type HealthcareProfessional = {
    id: string
    names: LocaleName[],
    degrees: Degree[],
    spokenLanguages: SpokenLanguage[],
    specialties: Specialty[],
    acceptedInsurance: Insurance[],
    isDeleted: boolean,
    createdDate: string,
    updatedDate: string
}

export type LocaleName = {
    lastName: string
    firstName: string
    middleName: string
    locale: Locale
}

export type Specialty = {
    names: SpecialtyName[]
}

export type SpecialtyName = {
    name: string,
    locale: Locale
}

export type SpokenLanguage = {
    iso639_3: string
    nameJa: string
    nameEn: string
    nameNative: string
}

export type Submission = {
    id: string,
    googleMapsUrl: string,
    healthcareProfessionalName: string,
    spokenLanguages: SpokenLanguage[],
    isUnderReview: boolean,
    isApproved: boolean,
    isRejected: boolean,
    createdDate: string,
    updatedDate: string
}

export type SubmissionSearchFilters = {
    googleMapsUrl?: string,
    healthcareProfessionalName?: string,
    spokenLanguages?: SpokenLanguage[],
    isUnderReview?: boolean,
    isApproved?: boolean,
    isRejected?: boolean,
    orderBy?: OrderBy[],
    limit?: number
    createdDate?: string,
    updatedDate?: string
}

export type OrderBy = {
    orderDirection: OrderDirection,
    fieldToOrder: string
}

export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc'
}

export type Degree = {
    nameJa: string
    nameEn: string
    abbreviation: string
}
