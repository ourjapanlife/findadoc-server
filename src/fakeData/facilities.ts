import * as gqlTypes from '../typeDefs/gqlTypes'

export const fakeFacilities = () => {
    const facility : gqlTypes.CreateFacilityInput = {
        nameEn: 'Zoo',
        nameJa: '動物園',
        contact: {
            address: {
                // generate fake data from type PhysicalAddress in gqlTypes.ts file
                addressLine1En: '1-1-1',
                addressLine2En: 'Ueno',
                addressLine1Ja: '上野',
                addressLine2Ja: '1-1-1',
                cityEn: 'Taito',
                cityJa: '台東区',
                prefectureEn: 'Tokyo',
                prefectureJa: '東京都',
                postalCode: '100-0000'            
            },
            email: 'zoo@test.com',
            phone: '08000000000',
            website: 'https://zoo.test.com',
            googleMapsUrl: 'http://maps.google.com/maps?q=35.715581,139.773728'
        },
        healthcareProfessionalIds: []
    }

    return [facility]
}
