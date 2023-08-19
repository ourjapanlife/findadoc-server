import { createApolloServer } from '../index'
import request from 'supertest'
import { beforeEach, afterAll, expect } from '@jest/globals'

const queryData = {
    query: `query Query($healthcareProfessionalId: ID!) {
        healthcareProfessional(id: $healthcareProfessionalId) {
          id
        }
      }`,
    variables: {
        healthcareProfessionalId: '1'
    }
}

describe('query healthcareProfessionalById', () => {
    let server: any, url: any

    // before the tests we spin up a new Apollo Server
    beforeEach(async () => {
        // Note we must wrap our object destructuring in parentheses because we already declared these variables
        // We pass in the port as 0 to let the server pick its own ephemeral port for testing
        ({ server, url } = await createApolloServer(0))
    })
  
    // after the tests we'll stop the server
    afterAll(done => {
        console.log('server =', server)
        server.stop()
        done()
    })
  
    it('returns an error if a healthcare professional is not found', async () => {
        // send our request to the url of the test server
        const response = await request(url).post('/').send(queryData)

        expect(response.statusCode).toBe(404)
        expect(response.body.errors.length).toBe(1)
        expect(response.body.errors[0].extensions.code).toBe('NOT_FOUND')
        expect(response.body.errors[0].message).toBe('Healthcare professional not found.')
    })
})
