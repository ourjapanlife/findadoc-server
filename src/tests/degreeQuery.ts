/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { expect } from 'chai'
import {} from 'mocha'
import supertest from 'supertest'

describe('GraphQL', () => {
    let request: any

    beforeEach(() => {
        const url = 'http://localhost:3001'

        request = supertest(url)
    })

    it('Returns degree with id = 1', done => {
        request
            .post('/graphql')
            .send({
                query: '{ degree(id: 1) { id nameJa nameEn abbreviation }}'
            })
            .expect(200)
            .end((err: any, res: any) => {
                // res will contain array with one user
                if (err) { return done(err) }

                console.log(res.body)
                expect(res.body.data.degree).to.have.property('id').equal('1')
                expect(res.body.data.degree).to.have.property('nameJa').equal('医師')
                expect(res.body.data.degree).to.have.property('nameEn').equal('Medical Doctor')
                expect(res.body.data.degree).to.have.property('abbreviation').equal('MD')

                done()

                return true
            })
    })

    it('Returns all degrees', done => {
        request
            .post('/graphql')
            .send({
                query: '{ degrees { id nameJa nameEn abbreviation }}'
            })
            .expect(200)
            .end((err: any, res: any) => {
                // res will contain array with one user
                if (err) { return done(err) }

                console.log(res.body)
                expect(res.body.data.degrees).to.have.lengthOf(14)

                done()

                return true
            })
    })
})
