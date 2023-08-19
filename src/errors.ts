import { GraphQLError } from 'graphql'

const CustomErrors = {
    notFound: (message: string) => {
        throw new GraphQLError(message, {
            extensions: {
                code: 'NOT_FOUND',
                http: {
                    status: 404
                }
            }
        }) 
    }
}

export default CustomErrors
