import { PhysicalAddress } from './gqlTypes'

export type Contact = {
  email: string
  phone: string
  website: string
  mapsLink: string
  address: PhysicalAddress
}

export type Facility = {
  nameEn: string
  nameJa: string
  contact: Contact
  healthcareProfessionalIds: string[]
  healthcareProfessionals: HealthcareProfessional[]
}

export type HealthcareProfessional = {
  names: LocaleName[],
  degrees: Degree[],
  spokenLanguages: SpokenLanguage[],
  specialties: Specialty[],
  acceptedInsurance: Insurance[],
  isDeleted: boolean
}

export type LocaleName = {
  lastName: string
  firstName: string
  middleName: string
  locale: Locale
}

export enum Locale {
    ENGLISH,
    JAPANESE
}

export type Specialty = {
  id: string
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
  isRejected: boolean
}

export type SubmissionFilters = {
  isUnderReview?: boolean,
  isApproved?: boolean,
  isRejected?: boolean
}

export type Degree = {
  id: string
  nameJa: string
  nameEn: string
  abbreviation: string
}

export enum Insurance {
  JAPANESE_HEALTH_INSURANCE,
  INTERNATIONAL_HEALTH_INSURANCE,
  INSURANCE_NOT_ACCEPTED
}
