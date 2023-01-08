import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: 'http://localhost:3001',
    generates: {
        'src/typeDefs/gqlTypes.ts': {
            plugins: ['typescript', 'typescript-resolvers']
        }
    },
    debug: true
};

export default config;
