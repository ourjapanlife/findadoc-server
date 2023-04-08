import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'
import { initializeDb, getFacilities, getHealthcareProfessionals } from './database'

import {seedDatabase} from './databaseSeedTool'

const server = new ApolloServer({
    typeDefs: loadSchema(),
    resolvers,
    csrfPrevention: true
})

async function startServer(port = 3001) {
    await initializeDb()

    // seedDatabase()
    console.log(await getFacilities())
    // console.log(await getHealthcareProfessionals())

    await startStandaloneServer(server, {
        listen: { port: port }
    })

    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at: http://localhost:${port}`)
}

startServer()
