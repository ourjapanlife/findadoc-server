
import Fastify from 'fastify'
import { fastifyApolloDrainPlugin, fastifyApolloHandler } from '@as-integrations/fastify'
import corsPlugin from '@fastify/cors'
import rateLimitPlugin from '@fastify/rate-limit'
import compressionPlugin from '@fastify/compress'
import supertokens from 'supertokens-node'
import { plugin as superTokensPlugin, errorHandler as superTokensErrorHandler } from 'supertokens-node/framework/fastify/index.js'
import { ApolloServer, BaseContext, GraphQLRequestContext } from '@apollo/server'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import loadSchema from './schema.js'
import resolvers from './resolvers.js'
import { envVariables } from '../utils/environmentVariables.js'
import { buildUserContext } from './auth.js'
import { logger } from './logger.js'

export const createApolloFastifyServer = async (customPort?: number): Promise<string> => {
    logger.info('⛽️ Starting server...')

    //fastify is our http server (a modern, faster alternative to express)
    const fastify = await Fastify()

    //cors is a middleware that allows us to make requests from the a different url (findadoc.jp) to our server (api.findadoc.jp)
    await fastify.register(corsPlugin, {
        origin: 'https://findadoc.jp',
        allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
        // methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true
    })

    //add rate limiting to prevent abuse
    await fastify.register(rateLimitPlugin, {
        max: 100,
        timeWindow: '1 minute'
    })

    //add compression to reduce the size of the requests/responses (makes the api faster)
    await fastify.register(compressionPlugin)

    //supertokens auth integration
    await fastify.register(superTokensPlugin)
    await fastify.setErrorHandler(superTokensErrorHandler())

    //set up the apollo graphql server
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
                        logger.info(`Apollo Request received:\n Query: ' + ${requestContext.request.query} \nVariables: ${JSON.stringify(requestContext.request.variables)}`, { type: 'graphqlquery' })
                    }
                }
            }
        ]
    })

    //this is called instead of startStandaloneServer() since we're using fastify (https://www.apollographql.com/docs/apollo-server/api/apollo-server/#start)
    //the apollo server isn't listening until fastify is actually started. 
    await apolloServer.start()

    //this adds the apollo server to fastify. 
    //Instead of using fastifyApolloHandler(apollo), we use the handler so we can choose the url 
    await fastify.route({
        url: '/api',
        method: ['GET', 'POST', 'OPTIONS'],
        // preHandler: verifySession(),
        handler: fastifyApolloHandler(apolloServer, {
            //this is where we add the supertokens user authentication to the context. We can access this context in the resolvers
            context: buildUserContext
        })
    })

    //start the actual fastify http server
    const serverUrl = await fastify.listen({ port: customPort ?? parseInt(envVariables.serverPort()) })

    logger.info(`\n🚀 🚀 🚀 Server ready at: ${serverUrl}\n`)

    return serverUrl
}