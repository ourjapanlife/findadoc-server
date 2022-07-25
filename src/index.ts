import { ApolloServer, gql } from "apollo-server";
import fs from 'fs'
import path from 'path'

const names = [
  {
    en: 'Ann',
    ja: '杏',
  },
  {
    en: 'LaShawn',
    ja: 'ラシャーン',
  },
  {
    en: 'Philip',
    ja: 'フィリップ',
  },
];

const resolvers = {
  Query: {
    name: () => names,
  },
};

// todo add error handling
// and find a less hacky way of doing this
const typeString = fs.readFileSync(path.join(__dirname, './typeDefs/schema.graphql'),"utf-8")
const typeDefs = gql`${typeString}`

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
});

const port = 3000;

server.listen({ port }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
