import healthcareProfessionals from "../mockData/mockData";

const resolvers = {
  Query: {
    healthcareProfessionals: () => healthcareProfessionals,
    healthcareProfessional: (_parent: any, args: any) => {
      const matchingResults = healthcareProfessionals.filter(
        (person) => person.id === args.id
      );
      const firstResult = matchingResults.length ? matchingResults[0] : null;
      return firstResult;
    },
  },
};

export default resolvers;
