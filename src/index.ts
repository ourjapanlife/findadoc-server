import { ApolloServer } from "apollo-server";
import loadSchema from "./schema";
import { names } from "./fakeData";
import {getHealthcareProfessionaById, getHealthcareProfessional} from "./services/searchService"
import { createHealthcareProfessional } from "./services/healthCareProfessionalService"

const resolvers = {
  Query: {
    getHealthcareProfessionaById: getHealthcareProfessionaById,
    getHealthcareProfessional: getHealthcareProfessional
  },
  Mutation: {
    createHealthcareProfessional: createHealthcareProfessional
    creategetHealthcareProfessionals(healthCareProfessionals: [HealthcareProfessional]) => {
      
    }
  }
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
