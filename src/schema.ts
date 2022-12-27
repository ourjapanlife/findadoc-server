import { gql } from 'apollo-server';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { DocumentNode } from 'graphql';
import { join } from 'path';

export default function loadSchema(): DocumentNode {
  try {
    // console.log('STARTING!!');
    // const typeString = join(__dirname, './typeDefs/schema.graphql');
    // console.log('TYPESTRING FINISHED');
    // const facility = join(__dirname, './typeDefs/facility.graphql');
    const schema = loadSchemaSync(join(__dirname, 'typeDefs/*.graphql'), { loaders: [new GraphQLFileLoader()] });
    return gql`
      ${schema}
    `;
  } catch (e) {
    console.log(e);
  }
  return gql``;
}
