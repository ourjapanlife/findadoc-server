import { ApolloServer, BaseContext, GraphQLRequestContext } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import loadSchema from './schema.js'
import resolvers from './resolvers.js'
import { initializeAuth } from './auth.js'
import { initiatilizeFirebaseInstance } from './firebaseDb.js'
import { envVariables } from '../utils/environmentVariables.js'

export const createApolloServer = async () => {
    await initiatilizeFirebaseInstance()

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers,
        //allows the sandbox to be used in production as well as locally
        introspection: true,
        plugins: [
            //enables the apollo sanbox as the landing page
            ApolloServerPluginLandingPageLocalDefault(),
            {
                async requestDidStart(requestContext: GraphQLRequestContext<BaseContext>) {
                    //we want to skip logging requests from the apollo query explorer internal introspection query
                    const isApolloIntrospectionQuery = requestContext.request.query?.includes('IntrospectionQuery')

                    if (!isApolloIntrospectionQuery) {
                        console.log(`Apollo Request received:\n Query: ' + ${requestContext.request.query} \nVariables: ${JSON.stringify(requestContext.request.variables)}`)
                    }
                }
            }
        ]
    })

    app.use(cors({
        origin: "https://findadoc.jp",
        allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
        credentials: true,
    }));
        
    console.log('⛽️ Starting server...')
    const { url } = await startStandaloneServer(server, { listen: { port: parseInt(envVariables.serverPort()) } })

    // eslint-disable-next-line no-console
    console.log(`\n🚀 🚀 🚀 Server ready at: ${url}\n`)

    return { server, url }
}

await createApolloServer()

