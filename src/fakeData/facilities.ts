import { Facility } from '../typeDefs/dbSchema'

export const fakeFacilities = () => {
    const facility : Facility = {
        id: '1',
        nameEn: 'Zoo',
        nameJa: '動物園',
        contact: {
            email: 'zoo@test.com',
            phone: '08000000000',
            website: 'https://zoo.test.com',
            mapsLink: ''
        },
        healthcareProfessionals: []
    }

    return [facility]
}