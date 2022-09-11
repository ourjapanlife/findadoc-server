import { ApolloServer } from "apollo-server";
import loadSchema from "./schema";
import { names } from "./fakeData";
import {getHealthCareProfessionaById, getHealthCareProfessional} from "./services/searchService"
import { createHealthCareProfessional } from "./services/healthCareProfessionalService"

const resolvers = {
  Query: {
    getHealthCareProfessionaById: getHealthCareProfessionaById,
    getHealthCareProfessional: getHealthCareProfessional
  },
  Mutation: {
    createHealthCareProfessional: createHealthCareProfessional
    creategetHealthCareProfessionals(healthCareProfessionals: [HealthCareProfessional]) => {}
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
