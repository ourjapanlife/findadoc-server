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
    },
    missingInput: (message: string) => {
        throw new GraphQLError(message, {
            extensions: {
                code: 'MISSING_INPUT',
                http: {
                    status: 400
                }
            }
        }) 
    }
}

export default CustomErrors
