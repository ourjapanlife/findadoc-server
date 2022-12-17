import { facilities, healthcareProfessionals, specialties } from "./mockData/mockData";

const resolvers = {
  Query: {
    facilities: () => facilities,
    facility: (_parent: any, args: any) => {
      const matchingResults = facilities.find(
        (location) => location.id === args.id
      );
      return matchingResults;
    },
    healthcareProfessionals: () => healthcareProfessionals,
    healthcareProfessional: (_parent: any, args: any) => {
      const matchingResults = healthcareProfessionals.find(
        (person) => person.id === args.id
      );
      return matchingResults;
    },
    specialties: () => specialties,
    specialty: (_parent: any, args: any) => {
      const matchingResults = specialties.find(
        (field) => field.id === args.id
      );
      return matchingResults;
    },
  },
};

export default resolvers;
