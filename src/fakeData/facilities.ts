import * as gqlTypes from '../typeDefs/gqlTypes'

export const fakeFacilities = () => {
    const facilityOne : gqlTypes.FacilityInput = {
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
            website: 'https://zoo.test',
            mapsLink: ''
        },
        healthcareProfessionals: []
    }
    
    const facilityTwo : gqlTypes.FacilityInput = {
        nameEn: 'Tsunashima Well Clinic',
        nameJa: '綱島ウェルクリニック',
        contact: {
            address: {
                // generate fake data from type PhysicalAddress in gqlTypes.ts file
                addressLine1En: '1-2-13-3F',
                addressLine2En: 'Kohoku-ku, Tsunashima-higashi',
                cityEn: 'Yokohama',
                prefectureEn: 'Kanagawa',
                postalCode: '223-0052'
            },
            email: 'wellclinic@test.com',
            phone: '0455441115',
            website: 'https://wellclinic.test',
            mapsLink: ''
        },
        healthcareProfessionals: []
    }

    const facilityThree : gqlTypes.FacilityInput = {
        nameEn: 'Heisei Yokohama Hospital',
        nameJa: '平成横浜病院',
        contact: {
            address: {
                // generate fake data from type PhysicalAddress in gqlTypes.ts file
                addressLine1En: '550',
                addressLine2En: 'Totsuka-ku, Totsuka-cho',
                cityEn: 'Yokohama',
                prefectureEn: 'Kanagawa',
                postalCode: '244-0003'
            },
            email: 'heisei-hospital@test.com',
            phone: '0451234555',
            website: 'https://heisei-hospital.test',
            mapsLink: ''
        },
        healthcareProfessionals: []
    }

    const facilityFour : gqlTypes.FacilityInput = {
        nameEn: 'Chiba Medical Center',
        nameJa: '千葉医療センター',
        contact: {
            address: {
                // generate fake data from type PhysicalAddress in gqlTypes.ts file
                addressLine1En: '4-1-2',
                addressLine2En: 'Chuo-ku, Tsubakimori',
                cityEn: 'Chiba',
                prefectureEn: 'Chiba',
                postalCode: '260-8606'
            },
            email: 'chiba.medical@test.com',
            phone: '0451234555',
            website: 'https://chiba.medical.test',
            mapsLink: ''
        },
        healthcareProfessionals: []
    }

    const facilityFive : gqlTypes.FacilityInput = {
        nameEn: 'Odoriba Dental Clinic',
        nameJa: '踊場歯科',
        contact: {
            address: {
                // generate fake data from type PhysicalAddress in gqlTypes.ts file
                addressLine1En: '1-2-1-1F',
                addressLine2En: 'Izumi-ku, Nakada-Minami',
                cityEn: 'Yokohama',
                prefectureEn: 'Kanagawa',
                postalCode: '245-0013'
            },
            email: 'odoriba-dental@test.com',
            phone: '045642975',
            website: 'https://odoriba.dental.test',
            mapsLink: ''
        },
        healthcareProfessionals: []
    }

    const facilitySix : gqlTypes.FacilityInput = {
        nameEn: 'Minato Yokohama Animal Clinic',
        nameJa: 'みなとよこはま動物病院',
        contact: {
            address: {
                // generate fake data from type PhysicalAddress in gqlTypes.ts file
                addressLine1En: '2-10-20',
                addressLine2En: 'Isogo-ku, Mori',
                cityEn: 'Yokohama',
                prefectureEn: 'Kanagawa',
                postalCode: '235-0023'
            },
            email: 'minato.yokohama@test.com',
            phone: '0457516310',
            website: 'https://minato.yokohama.test',
            mapsLink: ''
        },
        healthcareProfessionals: []
    }

    return [facilityOne, facilityTwo, facilityThree, facilityFour, facilityFive, facilitySix]
}
