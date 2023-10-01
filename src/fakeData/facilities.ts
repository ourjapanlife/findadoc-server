import * as gqlTypes from '../typeDefs/gqlTypes'

export const fakeFacilities = () => {
    const facility : gqlTypes.FacilityInput = {
        nameEn: 'Zoo',
        nameJa: '動物園',
        contact: {
            address: {
                // generate fake data from type PhysicalAddress in gqlTypes.ts file
                addressLine1En: '1-1-1',
                addressLine2En: 'Ueno',
                cityEn: 'Taito',
                prefectureEn: 'Tokyo',
                postalCode: '100-0000'            
            },
            email: 'zoo@test.com',
            phone: '08000000000',
            website: 'https://zoo.test.com',
            mapsLink: ''
        },
        healthcareProfessionals: [],
        healthcareProfessionalIds: []
    }

    return [facility]
}
