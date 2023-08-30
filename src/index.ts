import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'
import { initiatilizeFirebaseInstance } from './firebaseDb'

export const createApolloServer = async (port = 4000) => {
    await initiatilizeFirebaseInstance()

    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })
  
    const { url } = await startStandaloneServer(server, {listen: { port: port }})
  
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at: ${url}`)

    return { server, url }
}

createApolloServer()

