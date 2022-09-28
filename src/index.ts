import { ApolloServer } from "apollo-server";
import loadSchema from "./schema";
import resolvers from "./typeDefs/resolvers";

const server = new ApolloServer({
  typeDefs: loadSchema(),
  resolvers,
  csrfPrevention: true,
});

const port = 3000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
