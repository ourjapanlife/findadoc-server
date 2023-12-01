
import Fastify from 'fastify'
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify'
import cors from '@fastify/cors'
import * as middie from '@fastify/middie'
import { ApolloServer, BaseContext, GraphQLRequestContext } from '@apollo/server'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import loadSchema from './schema.js'
import resolvers from './resolvers.js'
import { envVariables } from '../utils/environmentVariables.js'

export const createApolloFastifyServer = async () => {
    //fastify is our http server (a better alternative to express)
    const fastify = Fastify()

    //middie is fast and helps us to use middleware with fastify (we can use express middleware with fastify thanks to this)
    await fastify.register(middie.fastifyMiddie)

    await fastify.register(cors, {
        origin: 'https://findadoc.jp',
        // allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
        credentials: true
    })

    const apolloServer = new ApolloServer<BaseContext>({
        typeDefs: loadSchema(),
        resolvers,
        //allows the sandbox to be used in production as well as locally
        introspection: true,
        plugins: [
            fastifyApolloDrainPlugin(fastify),
            //enables the apollo sandbox as the landing page
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
    
    console.log('⛽️ Starting server...')
    //this is called instead of startStandaloneServer() since we're using fastify (https://www.apollographql.com/docs/apollo-server/api/apollo-server/#start)
    //the apollo server isn't listening until fastify is actually started. 
    await apolloServer.start()
    await fastify.register(fastifyApollo(apolloServer))

    //start the actual fastify http server
    const url = await fastify.listen({ port: parseInt(envVariables.serverPort()) }, err => {
        if (err) {
            console.log(err)
        }
    })

    // eslint-disable-next-line no-console
    console.log(`\n🚀 🚀 🚀 Server ready at: ${url}\n`)
}
