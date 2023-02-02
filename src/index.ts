import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'

const server = new ApolloServer({
    typeDefs: loadSchema(),
    resolvers,
    csrfPrevention: true
})

const port = 3001

function startServer() {
    return startStandaloneServer(server, {
        listen: { port: port }
    })
}

// eslint-disable-next-line no-console
startServer().then(() => console.log(`🚀  Server ready at: http://localhost:${port}`))

