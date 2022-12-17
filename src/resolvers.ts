import { facilities, healthcareProfessionals, specialties } from "./mockData/mockData";

const resolvers = {
  Query: {
    facilities: () => facilities,
    facility: (_parent: any, args: any) => {
      const matchingResults = facilities.filter(
        (location) => location.id === args.id
      );
      const firstResult = matchingResults.length ? matchingResults[0] : null;
      return firstResult;
    },
    healthcareProfessionals: () => healthcareProfessionals,
    healthcareProfessional: (_parent: any, args: any) => {
      const matchingResults = healthcareProfessionals.filter(
        (person) => person.id === args.id
      );
      const firstResult = matchingResults.length ? matchingResults[0] : null;
      return firstResult;
    },
    specialties: () => specialties,
    specialty: (_parent: any, args: any) => {
      const matchingResults = specialties.filter(
        (field) => field.id === args.id
      );
      const firstResult = matchingResults.length ? matchingResults[0] : null;
      return firstResult;
    },
  },
};

export default resolvers;
