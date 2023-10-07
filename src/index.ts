import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'
import { initiatilizeFirebaseInstance } from './firebaseDb'
import { envVariables } from '../utils/environmentVariables'
import { Error } from './result'

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
        // Allows you to choose what error info is visable for client side
        formatError: gqlError => {
            console.log('gqlError', gqlError)
            
            if (gqlError.extensions?.errors) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedErrors = (gqlError.extensions.errors as any[])
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .reduce((formattedError: any, error: Error) => {
                        formattedError.path.push(error.field)
                        formattedError.errors.push(error)
                        return formattedError
                    }, {
                        path: [],
                        errors: []
                    })

                formattedErrors.message = gqlError.message
                formattedErrors.path = gqlError.path

                return formattedErrors
            }

            return gqlError
        }
    })

    console.log('⛽️ Starting server...')
    const { url } = await startStandaloneServer(server, { listen: { port: parseInt(envVariables.serverPort()) } })

    // eslint-disable-next-line no-console
    console.log(`\n🚀 🚀 🚀 Server ready at: ${url}\n`)

    return { server, url }
}

createApolloServer()

