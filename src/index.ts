import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import loadSchema from './schema'
import resolvers from './resolvers'

export const createApolloServer = async (port: number) => {
    const server = new ApolloServer({
        typeDefs: loadSchema(),
        resolvers
    })
  
    const { url } = await startStandaloneServer(server, {listen: { port: port }})
  
    // eslint-disable-next-line no-console
    console.log(`🚀 Query endpoint ready at ${url}`)

    return { server, url }
}

createApolloServer(4000)

