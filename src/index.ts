import { ApolloServer } from "apollo-server";
import { Knex } from "knex";
import { Model } from "objection";
import knexConfig from "./database/knexfile";
import loadSchema from "./schema";
import resolvers from "./resolvers";

// Initialize knex.
const knex = Knex(knexConfig.development);

// Bind all Models to a knex instance. If you only have one database in
// your server this is all you have to do. For multi database systems, see
// the Model.bindKnex() method.
Model.knex(knex);

const server = new ApolloServer({
  typeDefs: loadSchema(),
  resolvers,
  csrfPrevention: true,
});

const port = 3000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
  console.log(`🐘 Connected to postgres version ${pg.VERSION}`);
});
