import * as gqlType from './gqlTypes.js'

//While it seems most of these types are identical to the gql types, they are not always identical.
//For example, some fields need to be hidden or obfuscated in the public gql types. (like a password field)
//Any time the gql types are changed, these types should be checked to make sure they are still correct. (the data can become inconsistent)
//When it does change, we need to do a migration.

//Omit is how we can override a field from the inherited type. 
//In this instance, we want to use the dbSchema contact type instead of the gqlType contact type.
export type Facility = Omit<gqlType.Facility, 'contact'> & {
    contact: Contact
}

export type HealthcareProfessional =
    Omit<gqlType.HealthcareProfessional,
        'names' | 'specialties' | 'degrees' | 'acceptedInsurance'>
    & {
        names: LocalizedName[]
        specialties: Specialty[]
        degrees: Degree[]
        acceptedInsurance: Insurance[]
    }

export type Submission = Omit<gqlType.Submission, 'facility' | 'healthcareProfessionals'> & {
    facility: gqlType.FacilitySubmission | null
    healthcareProfessionals: gqlType.HealthcareProfessionalSubmission[]
}

export type AuditLog = Omit<gqlType.AuditLog, 'id' | 'updatedDate'>

export type AuditLogResult = {
    isSuccesful: boolean
}

export type Contact = gqlType.Contact
export type LocalizedName = gqlType.LocalizedName
export type Specialty = gqlType.Specialty
export type Degree = gqlType.Degree
export type Insurance = gqlType.Insurance
