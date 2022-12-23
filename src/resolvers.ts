import crypto from "crypto";
import {
  facilities,
  healthcareProfessionals,
  specialties as medicalField,
} from "./mockData/mockData";

const resolvers = {
  Query: {
    facilities: () => facilities,
    facility: (_parent: any, args: any) => {
      const matchingFacility = facilities.find(
        (location) => location.id === args.id
      );
      return matchingFacility;
    },
    healthcareProfessionals: () => healthcareProfessionals,
    healthcareProfessional: (_parent: any, args: any) => {
      const matchingHealthcareProfessional = healthcareProfessionals.find(
        (person) => person.id === args.id
      );
      return matchingHealthcareProfessional;
    },
    specialties: () => medicalField,
    specialty: (_parent: any, args: any) => {
      const matchingSpecialty = medicalField.find(
        (field) => field.id === args.id
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

      // TODO: Eventually this should check if a specialty already exists in the DB and match it to that if it does.
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
