import { ApolloServer } from "apollo-server";
import loadSchema from "./schema";
import names from "./mockData/mockData";

const resolvers = {
  Query: {
    names: () => names,
  },
};

const server = new ApolloServer({
  typeDefs: loadSchema(),
  resolvers,
  csrfPrevention: true,
});

const port = 3000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
