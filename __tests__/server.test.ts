import { expect } from '@jest/globals'
import { buildSchema } from 'graphql'
import { IMockServer, mockServer, addMocksToSchema } from '@graphql-tools/mock'
import { addResolversToSchema } from '@graphql-tools/schema'
import resolvers from '../src/resolvers'
import fs from 'fs'
import path from 'path'
import * as gqlTypes from '../src/typeDefs/gqlTypes'
import { initiatilizeFirebaseInstance } from '../src/firebaseDb'

const schema = buildSchema(fs.readFileSync(
    path.join(__dirname, '../src/typeDefs/schema.graphql'),
    'utf-8'
))

const queryData = {
    query: `query Query($healthcareProfessionalId: ID!) {
        healthcareProfessional(id: $healthcareProfessionalId) {
          id
          names {
            locale
            middleName
            firstName
            lastName
          }
          degrees {
            abbreviation
            nameJa
            nameEn
          }
          spokenLanguages {
            nameNative
            nameEn
            nameJa
            iso639_3
          }
          specialties {
            names {
              locale
              name
            }
          }
          acceptedInsurance
          isDeleted
        }
      }`,
    variables: {
        healthcareProfessionalId: '1'
    }
}

describe('query healthcareProfessionalById', () => {    
    let server: IMockServer

    afterEach(() => {
        jest.restoreAllMocks()
    })
    
    it('successfully returns a healthcare professional', async () => {
        await initiatilizeFirebaseInstance()
        const preserveResolvers = true
        const mocks = {}
        const mySchema = addMocksToSchema({
            schema,
            resolvers: store => ({
                Query: {
                    healthcareProfessional: (_, { id }) => store.get('HealthcareProfessional', id)
                }
            })
        })

        server = mockServer(mySchema, mocks, preserveResolvers)

        const response = await server.query(queryData.query, queryData.variables)
        
        const healthcareProfessional = response.data.healthcareProfessional

        expect(healthcareProfessional.id).toBe('1')

        expect(healthcareProfessional.names[0].firstName).toBeDefined()
        expect(healthcareProfessional.names[0].lastName).toBeDefined()
        expect(healthcareProfessional.names[0].middleName).toBeDefined()

        expect(healthcareProfessional.degrees[0].abbreviation).toBeDefined()
        expect(healthcareProfessional.degrees[0].nameJa).toBeDefined()
        expect(healthcareProfessional.degrees[0].nameEn).toBeDefined()

        expect(healthcareProfessional.spokenLanguages[0].nameNative).toBeDefined()
        expect(healthcareProfessional.spokenLanguages[0].nameEn).toBeDefined()
        expect(healthcareProfessional.spokenLanguages[0].nameJa).toBeDefined()
        expect(healthcareProfessional.spokenLanguages[0].iso639_3).toBeDefined()

        expect(Object.values(gqlTypes.Locale)).toContain(healthcareProfessional.specialties[0].names[0].locale)

        expect(Object.values(gqlTypes.Insurance)).toContain(healthcareProfessional.acceptedInsurance[0])

        expect(typeof healthcareProfessional.isDeleted === 'boolean').toBeTruthy()

        expect(response.errors).toBeUndefined()
    })
    
    it('returns an error if a healthcare professional is not found', async () => {
        await initiatilizeFirebaseInstance()

        const mySchema = addResolversToSchema({schema, resolvers})
        const preserveResolvers = true
        const mocks = {}
        
        server = mockServer(mySchema, mocks, preserveResolvers)

        const response = await server.query(queryData.query, queryData.variables)

        const errors = response.errors ? response.errors : []

        expect(errors[0].extensions.http).toEqual({status: 404})
        expect(errors.length).toBe(1)
        expect(errors[0].extensions.code).toBe('NOT_FOUND')
        expect(errors[0].message).toBe('The healthcare professional does not exist.')
    })
})
