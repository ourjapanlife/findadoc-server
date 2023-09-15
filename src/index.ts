import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'
import { initiatilizeFirebaseInstance } from './firebaseDb'
import { envVariables } from '../utils/environmentVariables'

import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'

export const createApolloServer = async () => {
    await initiatilizeFirebaseInstance()

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers,
        //allows the sandbox to be used in production as well as locally
        introspection: true,
        plugins: [
            //enables the apollo sanbox as the landing page
            ApolloServerPluginLandingPageLocalDefault()
        ],
        formatError: (formattedError, error) => {
            return {
                message: formattedError.message
            }
        }
    })
  
    console.log('⛽️ Starting server...')
    const { url } = await startStandaloneServer(server, {listen: { port: parseInt(envVariables.serverPort()) }})
  
    // eslint-disable-next-line no-console
    console.log(`\n🚀 🚀 🚀 Server ready at: ${url}\n`)

    return { server, url }
}

createApolloServer()

