import names from "../mockData/mockData";

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
  },
};

export default resolvers;
