export type Contact = {
  email: string
  phone: string
  website: string
  mapsLink: string
}

export type Facility = {
  id: string
  nameEn: string
  nameJa: string
  contact: Contact
  healthcareProfessionals: [HealthcareProfessional]
}

export type HealthcareProfessional = {
  id: string,
  names: [LocaleName],
  degrees: [Degree],
  spokenLanguages: [SpokenLanguage],
  specialties: [Specialty],
  acceptedInsurance: [Insurance]
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
  names: [SpecialtyName]
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
