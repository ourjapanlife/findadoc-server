import { HealthcareProfessional, LocaleName, Contact, Degree, 
    Specialty, SpokenLanguage, Insurance, Facility } from '../typeDefs/dbSchema'
import { DocumentData, WhereFilterOp, getFirestore } from 'firebase-admin/firestore'
import { PhysicalAddress } from '../typeDefs/gqlTypes'
import crypto from 'crypto'

export const getFacilityById = async (id: string) : Promise<Facility | null> => {
    const db = getFirestore()
    const facilityRef = db.collection('facilities')
    const whereCondition = '=' as WhereFilterOp
    const snapshot = await facilityRef.where('id', whereCondition, id).get()

    if (snapshot.docs.length < 1) {
        return null
    }

    const convertedEntity = mapDbEntityTogqlEntity(snapshot.docs[0].data())

    return convertedEntity
}

export const addFacility = async (input: any) : Promise<Facility> => {
    input = input.input

    const db = getFirestore()
   
    const facilityRef = db.collection('facilities')

    // const healthcareProfessionals = validateHealthcareProfessionalsInput(input.healthcareProfessionals)

    // console.log(healthcareProfessionals)
    
    // const healthcareProDocRefs = await saveHealthProToDb(db, healthcareProfessionals)

    // console.log(healthcareProDocRefs)
    
    // const healthcareProIdList: any = []

    // await healthcareProDocRefs.forEach((doc: any) => {
    //     healthcareProIdList.push(doc.id)
    // })

    // console.log('id list', healthcareProIdList)

    const newFacility = {
        id: crypto.randomUUID(),
        contact: validateContactInput(input.contact),
        healthcareProfessionals: validateHealthcareProfessionalsInput(input.healthcareProfessionals),
        nameEn: validateNameEnInput(input.nameEn),
        nameJa: validateNameJaInput(input.nameJa)
    } satisfies Facility
    
    facilityRef.add(newFacility)

    return newFacility as Facility
}

export const searchFacilities = async (userSearchQuery : string[]) : Promise<Facility[]> => {
    const db = getFirestore()
    const hpRef = db.collection('healthcareProfessionals')
    // make this a real query
    const snapshot = await hpRef.where('id', 'in', userSearchQuery).get()

    const facilities = [] as Facility[]

    snapshot.forEach(doc => {
        const convertedEntity = mapDbEntityTogqlEntity(doc.data())

        facilities.push(convertedEntity)
    })

    return facilities
}

const mapDbEntityTogqlEntity = (dbEntity : DocumentData) : Facility => {
    const gqlEntity = {
        id: dbEntity.id,
        nameEn: dbEntity.nameEn,
        nameJa: dbEntity.nameJa,
        contact: dbEntity.contact,
        healthcareProfessionals: dbEntity.healthcareProfessionals
    } satisfies Facility
    
    return gqlEntity
}

function validateContactInput(contactInput: Record<string, any>) : Contact {
    const facilityContact = {
        address: contactInput.address as PhysicalAddress,
        email: contactInput.email as string,
        mapsLink: contactInput.mapsLink as string,
        phone: contactInput.phone as string,
        website: contactInput.website as string
    }

    return facilityContact
}

function validateHealthcareProfessionalsInput(healthcareProfessionalsInput: any) : HealthcareProfessional[] {
    const healthcareProfessionals = healthcareProfessionalsInput.map((input: any) => {
        const healthcareProfessional = 
            {
                id: crypto.randomUUID(),
                names: input.names as [LocaleName],
                degrees: input.degrees as Degree[], 
                spokenLanguages: input.spokenLanguages as [SpokenLanguage],
                specialties: input.specialties as [Specialty],
                acceptedInsurance: input.acceptedInsurance as [Insurance]
            } satisfies HealthcareProfessional

        return healthcareProfessional
    })
        
    return healthcareProfessionals
}

function validateNameEnInput(nameEnInput: string) : string {
    const nameEn = nameEnInput

    return nameEn
}

function validateNameJaInput(nameJaInput: string) : string {
    const nameJa = nameJaInput

    return nameJa
}

async function saveHealthProToDb(db: any, healthcarePro: any) {
    const healthProRef = db.collection('healthcareProfessionals')

    return await healthcarePro.map((person: HealthcareProfessional) => {
        healthProRef.add(person)
    })
}
