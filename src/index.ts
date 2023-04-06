import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'
import { initializeDb } from './database'

const server = new ApolloServer({
    typeDefs: loadSchema(),
    resolvers,
    csrfPrevention: true
})

async function startServer(port = 3001) {
    await initializeDb()

    await startStandaloneServer(server, {
        listen: { port: port }
    })

    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at: http://localhost:${port}`)
}

startServer()
