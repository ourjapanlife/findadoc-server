import { gql } from "apollo-server";

import fs from "fs";
import { DocumentNode } from "graphql";
import path from "path";

export function loadSchema(): DocumentNode {
  // todo add error handling
  // and find a less hacky way of doing this
  const typeString = fs.readFileSync(
    path.join(__dirname, "./typeDefs/schema.graphql"),
    "utf-8"
  );
  return gql`
    ${typeString}
  `;
}
