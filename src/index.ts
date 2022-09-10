import { ApolloServer } from "apollo-server";
import loadSchema from "./schema";

const names = [
  {
    LastEn: "Kilzer",
    FirstEn: "Ann",
    MiddleEn: "",
    LastJa: "キルザー",
    FirstJa: "杏",
    MiddleJa: "",
  },
  {
    LastEn: "Toyoda",
    FirstEn: "LaShawn",
    MiddleEn: "T",
    LastJa: "豊田",
    FirstJa: "ラシァン",
    MiddleJa: "ティ",
  },
  {
    LastEn: "Ermish",
    FirstEn: "Philip",
    MiddleEn: "Michael",
    LastJa: "アーミッシュ",
    FirstJa: "フィリップ",
    MiddleJa: "マイケル",
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

server.listen({ port }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
