import { ApolloServer } from "apollo-server";
import knex from "knex";
import loadSchema from "./schema";
import resolvers from "./resolvers";

// Set up Database
const pg = knex({
  client: "pg",
  connection: {
    host: process.env.POSTGRES_HOST,
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  searchPath: ["knex", "public"],
  debug: process.env.NODE_ENV === "development", // debug logging for dev only
});

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
