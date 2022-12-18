import { facilities, healthcareProfessionals, specialties } from "./mockData/mockData";

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
    specialties: () => specialties,
    specialty: (_parent: any, args: any) => {
      const matchingSpecialty = specialties.find(
        (field) => field.id === args.id
      );
      return matchingSpecialty;
    },
  },
};

export default resolvers;
