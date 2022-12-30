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



// from Philip - 
// create similar methods for mutations in the services. Make sure they are abstracted from knowing anything about the API/gql. 
// validate our inputs. (make sure they're not empty if required, valid types such as number vs string, etc.) make sure types in our enums are only allowed like "english" in languages
// When we can call the db, make sure the service calls are async. 
// wrap the service call in a try catch. 
// Implement failure state for api calls. Invalid input, server error, etc.   We probably need error code so client knows how to handle it. 
// next step
// create an auth service that can authenticate and authorize a user. 
// Set up our api queries and mutations to always check auth first.
// Bonus credit
// create a searchService that gets both facilities and professionals and has some mixture of results of the two. 
// create a new query for more generalized search that isn't specific to facility/professional
// next step
// admin dashboard methods.
