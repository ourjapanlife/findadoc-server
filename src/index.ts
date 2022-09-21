import { ApolloServer } from "apollo-server";
import loadSchema from "./schema";
// import { names } from "./typeDefs/fakeData";
import {
  getHealthcareProfessionaById,
  getHealthcareProfessional,
} from "./services/searchService";
import {
  createHealthcareProfessional,
  createHealthcareProfessionals,
} from "./services/healthCareProfessionalService";

const resolvers = {
  Query: {
    getHealthcareProfessionaById,
    getHealthcareProfessional,
  },
  Mutation: {
    createHealthcareProfessional,
    creategetHealthcareProfessionals: createHealthcareProfessionals,
  },
};

const server = new ApolloServer({
  typeDefs: loadSchema(),
  resolvers,
  csrfPrevention: true,
});

const port = 3000;

server.listen({ port });
