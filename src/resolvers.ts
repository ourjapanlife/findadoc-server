import crypto from 'crypto';
import {
  facilities,
  healthcareProfessionals,
  specialties as medicalField,
} from './mockData/mockData';
import { getFacilityById, getFacilities } from './services/facilityService';

const resolvers = {
  Query: {
    facilities: (_parent: any, args: any) => {
      // TODO: add a validation step for incoming parameters
      const matchingFacilities = getFacilities(args.specialty, args.location, args.spokenLanguage);

      return matchingFacilities;
    },
    facility: (_parent: any, args: any) => {
      // TODO: add a validation step for incoming parameters
      const matchingFacility = getFacilityById(args.id);
      return matchingFacility;
    },
    healthcareProfessionals: () => healthcareProfessionals,
    healthcareProfessional: (_parent: any, args: any) => {
      const matchingHealthcareProfessional = healthcareProfessionals.find(
        (person) => person.id === args.id,
      );
      return matchingHealthcareProfessional;
    },
    specialties: () => medicalField,
    specialty: (_parent: any, args: any) => {
      const matchingSpecialty = medicalField.find(
        (field) => field.id === args.id,
      );
      return matchingSpecialty;
    },
  },
  Mutation: {
    createHealthcareProfessional: (_parent: any, args: any) => {
      const id = crypto.randomUUID();

      const {
        names,
        degrees,
        spokenLanguages,
        specialties,
        acceptedInsuranceOptions,
      } = args.input;

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
        acceptedInsuranceOptions,
      };

      return healthcareProfessional;
    },
  },
};

export default resolvers;
