import crypto from 'crypto';
import { getFacilityById, getFacilities } from './services/facilityService';
import { getHealthcareProfessionalById, getHealthcareProfessionals } from './services/healthcareProfessionalService';
import { getSpecialtyById, getSpecialties } from './services/specialtyService';
import { getSpokenLanguageByIso, getSpokenLanguages } from './services/spokenLanguageService';
import {
    Degree,
    Facility,
    Insurance,
    HealthcareProfessional,
    Specialty,
    LocaleNameInput,
    HealthcareProfessionalInput,
    SpokenLanguage
} from './typeDefs/gqlTypes';

const resolvers = {
    Query: {
        facilities: () => {
            // TODO: add a validation step for incoming parameters
            const matchingFacilities = getFacilities();

            return matchingFacilities;
        },
        facility: (_parent: Facility, args: { id: string; }) => {
            // TODO: add a validation step for incoming parameters
            const matchingFacility = getFacilityById(args.id);

            return matchingFacility;
        },
        healthcareProfessionals: () => {
            // TODO: add a validation step for incoming parameters
            const matchingProfessionals = getHealthcareProfessionals();

            return matchingProfessionals;
        },
        healthcareProfessional: (_parent: HealthcareProfessional, args: { id: string; }) => {
            // TODO: add a validation step for incoming parameters
            const matchingHealthcareProfessional = getHealthcareProfessionalById(args.id);

            return matchingHealthcareProfessional;
        },
        specialties: () => {
            // TODO: add a validation step for incoming parameters
            const matchingSpecialties = getSpecialties();

            return matchingSpecialties;
        },
        specialty: (_parent: Specialty, args: { id: string; }) => {
            // TODO: add a validation step for incoming parameters
            const matchingSpecialty = getSpecialtyById(args.id);

            return matchingSpecialty;
        },
        spokenLanguages: () => getSpokenLanguages(),
        spokenLanguage: (_parent: SpokenLanguage, args: {iso639_3: string;}) => getSpokenLanguageByIso(args.iso639_3)
    },
    Mutation: {
        createHealthcareProfessional: (_parent: HealthcareProfessionalInput, args: {
      id: string,
      names: Array<LocaleNameInput>,
      degrees: Array<Degree>,
      spokenLanguages: Array<SpokenLanguage>,
      specialties: Array<Specialty>,
      acceptedInsurance: Array<Insurance>
    }) => {
            const id = crypto.randomUUID();

            const {
                names,
                degrees,
                spokenLanguages,
                specialties,
                acceptedInsurance
            } = args;

            // TODO: Eventually this should check if a specialty already exists in the DB
            // and match it to that if it does.
            specialties.map((specialty: { id: string }) => {
                if (!specialty.id) {
                    // eslint-disable-next-line no-param-reassign
                    specialty.id = crypto.randomUUID();
                }
                return specialty.id;
            });

            const healthcareProfessional = {
                id,
                names,
                degrees,
                spokenLanguages,
                specialties,
                acceptedInsurance
            };

            return healthcareProfessional;
        }
    }
};

export default resolvers;
