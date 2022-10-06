// eslint-disable-next-line import/no-extraneous-dependencies
import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:3000/graphql",
  documents: ["src/typeDefs/*.graphql"],
  generates: {
    "src/typeDefs/gqlTypes.ts": {
      plugins: ["typescript-resolvers"],
    },
  },
  debug: true,
};

export default config;
