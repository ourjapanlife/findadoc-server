import { ApolloServer } from "apollo-server";
import loadSchema from "./schema";

const names = [
  {
    en: "Ann",
    ja: "杏",
  },
  {
    en: "LaShawn",
    ja: "ラシャーン",
  },
  {
    en: "Philip",
    ja: "フィリップ",
  },
];

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

server.listen({ port });
