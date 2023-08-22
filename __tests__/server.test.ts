import { createApolloServer } from '../src/index'
import { beforeEach, afterAll, expect } from '@jest/globals'
import request from 'supertest'

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
    let server: { stop: () => void }, url: string

    beforeEach(async () => {
        ({ server, url } = await createApolloServer(0))
    })
    afterAll(done => {
        server.stop()
        done()
    })
    
    it('returns an error if a healthcare professional is not found', async () => {
        const response = await request(url).post('/').send(queryData)

        expect(response.statusCode).toBe(404)
        expect(response.body.errors.length).toBe(1)
        expect(response.body.errors[0].extensions.code).toBe('NOT_FOUND')
        expect(response.body.errors[0].message).toBe('Healthcare professional not found.')
    })
})
