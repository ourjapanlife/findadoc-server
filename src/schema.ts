import { gql } from 'apollo-server';

import fs from 'fs';
import { DocumentNode } from 'graphql';
import path from 'path';

export default function loadSchema(): DocumentNode {
  try {
    const typeString = fs.readFileSync(
      path.join(__dirname, './typeDefs/schema.graphql'),
      'utf-8',
    );
    return gql`
      ${typeString}
    `;
  } catch (e) {
    console.log(e);
  }
  return gql``;
}
