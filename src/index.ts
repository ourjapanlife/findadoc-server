import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'
import { initializeDb } from './database'
import { getFacilityById, getFacilities } from './services/facilityService'
import { getHealthcareProfessionalById, getHealthcareProfessionals } from './services/healthcareProfessionalService'
import {seedDatabase} from './databaseSeedTool'

const server = new ApolloServer({
    typeDefs: loadSchema(),
    resolvers,
    csrfPrevention: true
})

async function startServer(port = 3001) {
    await initializeDb()

    // console.log(await getFacilityById('1'))
    // console.log(await getHealthcareProfessionalById('1'))
    // console.log(await getFacilities())
    // console.log(await getHealthcareProfessionals())

    await startStandaloneServer(server, {
        listen: { port: port }
    })

    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at: http://localhost:${port}`)
}

startServer()
