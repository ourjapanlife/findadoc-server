import { ApolloServer } from 'apollo-server'
import loadSchema from './schema'
import resolvers from './resolvers'

const server = new ApolloServer({
    typeDefs: loadSchema(),
    resolvers,
    csrfPrevention: true
})

const port = 3001

server.listen({ port }).then(({ url }) => {
    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at ${url}`)
})
