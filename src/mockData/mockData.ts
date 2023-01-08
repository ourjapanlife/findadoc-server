// locale will be used for the site's language settings

import {
    Degree,
    Facility,
    Insurance,
    Language,
    HealthcareProfessional,
    Specialty
} from '../typeDefs/gqlTypes';

// language is the spoken language

const facilities: Array<Facility> = [
    {
        id: '1',
        names: [
            {
                name: 'Amazing Clinic',
                locale: 'en'
            },
            {
                name: 'アメージングクリニック',
                locale: 'ja'
            }
        ],
        contact: {
            email: 'some_email@some_email.jp',
            phone: '040-000-0000',
            website: 'amazing-clinic-url.jp',
            mapsLink: 'https://some_googlemaps_link.com'
        },
        healthcareProfessionals: [
            {
                id: '1',
                names: [
                    {
                        lastName: 'Ermish',
                        firstName: 'Philip',
                        middleName: 'Michael',
                        locale: 'en'
                    },
                    {
                        lastName: 'アーミッシュ',
                        firstName: 'フィリップ',
                        middleName: 'マイケル',
                        locale: 'ja'
                    }
                ],
                degrees: [<Degree>'DOCTOR_OF_MEDICINE'],
                spokenLanguages: [<Language>'JAPANESE', <Language>'ENGLISH'],
                specialties:
          [
              {
                  id: '1',
                  names:
                [
                    { name: 'General Practice', locale: 'en' },
                    { name: '一般診療', locale: 'ja' }
                ]
              }
          ],
                acceptedInsuranceOptions: [
          <Insurance>'EMPLOYER_HEALTH_INSURANCE'
                ]
            }
        ]
    }
];

const healthcareProfessionals: Array<HealthcareProfessional> = [
    {
        id: '1',
        names: [
            {
                lastName: 'Ermish',
                firstName: 'Philip',
                middleName: 'Michael',
                locale: 'en'
            },
            {
                lastName: 'アーミッシュ',
                firstName: 'フィリップ',
                middleName: 'マイケル',
                locale: 'ja'
            }
        ],
        degrees: [<Degree>'DOCTOR_OF_PHILOSOPHY'],
        spokenLanguages: [<Language>'JAPANESE', <Language>'ENGLISH'],
        specialties: [
            {
                id: '1',
                names: [{ name: 'General Practice', locale: 'en' }, { name: '一般診療', locale: 'ja' }]
            }
        ],
        acceptedInsuranceOptions: [
      <Insurance>'NATIONAL_HEALTH_INSURANCE'
        ]
    },
    {
        id: '2',
        names: [
            {
                lastName: 'Kilzer',
                firstName: 'Ann',
                middleName: '',
                locale: 'en'
            },
            {
                lastName: 'キルザー',
                firstName: '杏',
                middleName: '',
                locale: 'ja'
            }
        ],
        degrees: [<Degree>'DOCTOR_OF_PHILOSOPHY'],
        spokenLanguages: [<Language>'JAPANESE'],
        specialties: [
            {
                id: '2',
                names: [{ name: 'Internal Medicine', locale: 'en' }, { name: '内科', locale: 'ja' }]
            }
        ],
        acceptedInsuranceOptions: [
      <Insurance>'NATIONAL_HEALTH_INSURANCE'
        ]
    },
    {
        id: '3',
        names: [
            {
                lastName: 'Toyoda',
                firstName: 'LaShawn',
                middleName: 'T',
                locale: 'en'
            },
            {
                lastName: '豊田',
                firstName: 'ラシァン',
                middleName: 'ティ',
                locale: 'ja'
            }
        ],
        degrees: [<Degree>'DOCTOR_OF_PHILOSOPHY'],
        spokenLanguages: [<Language>'ENGLISH'],
        specialties: [
            {
                id: '3',
                names: [{ name: 'Pediatrics', locale: 'en' }, { name: '小児科', locale: 'ja' }]
            }
        ],
        acceptedInsuranceOptions: [
      <Insurance>'NATIONAL_HEALTH_INSURANCE'
        ]
    }
];

const specialties: Array<Specialty> = [
    {
        id: '1',
        names: [
            {
                name: 'General Practice',
                locale: 'en'
            },
            {
                name: '一般診療',
                locale: 'ja'
            }
        ]
    },
    {
        id: '2',
        names: [
            {
                name: 'Orthopedics',
                locale: 'en'
            },
            {
                name: '整形外科',
                locale: 'ja'
            }
        ]
    },
    {
        id: '3',
        names: [
            {
                name: 'Dentistry',
                locale: 'en'
            },
            {
                name: '歯科',
                locale: 'ja'
            }
        ]
    }
];

export { facilities, healthcareProfessionals, specialties };
