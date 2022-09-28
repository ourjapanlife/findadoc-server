import { names, healthcareProfessionals } from "../mockData/mockData";

// need to set the proper types for the params

const resolvers = {
  Query: {
    names: () => names,
    name: (_parent: any, args: any) => {
      if (args.language !== undefined) {
        return names.filter(
          (person) => person.id === args.id && person.language === args.language
        );
      }
      return names.filter((person) => person.id === args.id);
    },
    healthcareProfessionals: () => healthcareProfessionals,
    healthcareProfessional: (_parent: any, args: any) => {
      const doctor = healthcareProfessionals.filter(
        (person) => person.id === args.id
      );
      return doctor[0];
    },
  },
};

export default resolvers;
