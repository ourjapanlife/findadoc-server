/* eslint-disable no-console */
import { expect } from 'chai'
import {} from 'mocha'
import supertest from 'supertest'
import { HealthcareProfessional } from '../typeDefs/gqlTypes'
import responseType from './responseTypes/responseTypes'

describe('GraphQL', () => {
    let request: any

    beforeEach(() => {
        const url = 'http://localhost:3001'

        request = supertest(url)
    })

    it('Returns healthcareProfessional with id = 1', done => {
        request
            .post('/graphql')
            .send({
                query: `{healthcareProfessional(id: 1) {
                    degrees {
                      id
                      abbreviation
                      nameEn
                      nameJa
                    }
                    specialties {
                      id
                      names {
                        locale
                        name
                      }
                    }
                    spokenLanguages {
                      iso639_3
                      nameEn
                      nameJa
                      nameNative
                    }
                    names {
                      firstName
                      lastName
                      locale
                      middleName
                    }
                    id
                    acceptedInsurance
                  }
                }`
            })
            .expect(200)
            .end((err: unknown, res: responseType<HealthcareProfessional>) => {
                // res will contain array with one user
                if (err) { return done(err) }

                console.log(res.body)
                expect(res.body.data.healthcareProfessional).to.have.property('id').equal('1')
                expect(res.body.data.healthcareProfessional).to.have.property('names')

                const { names, acceptedInsurance, degrees, spokenLanguages } = res.body.data.healthcareProfessional

                // names
                expect(names[0]).to.have.property('firstName').equal('Larissa')
                expect(names[0]).to.have.property('middleName').equal('')
                expect(names[0]).to.have.property('lastName').equal('Zhang')
                expect(names[0]).to.have.property('locale').equal('en')

                expect(names[1]).to.have.property('firstName').equal('ラリッサ')
                expect(names[1]).to.have.property('middleName').equal('')
                expect(names[1]).to.have.property('lastName').equal('張')
                expect(names[1]).to.have.property('locale').equal('ja')

                // degrees
                expect(degrees).to.have.length(1)
                expect(degrees[0]).to.have.property('id').equal('1')
                expect(degrees[0]).to.have.property('abbreviation').equal('MD')
                expect(degrees[0]).to.have.property('nameEn').equal('Medical Doctor')
                expect(degrees[0]).to.have.property('nameJa').equal('医師')

                // spoken languages
                expect(spokenLanguages).to.have.length(3)
                expect(spokenLanguages[0]).to.have.property('iso639_3').equal('eng')
                expect(spokenLanguages[1]).to.have.property('iso639_3').equal('cmn')
                expect(spokenLanguages[2]).to.have.property('iso639_3').equal('jpn')

                // specialties
                // TODO

                // insurance
                expect(acceptedInsurance).to.have.length(2)
                expect(acceptedInsurance[0]).to.equal('JAPANESE_HEALTH_INSURANCE')
                expect(acceptedInsurance[1]).to.equal('INTERNATIONAL_HEALTH_INSURANCE')
                done()

                return true
            })
    })
    
    it('Returns all users', done => {
        request
            .post('/graphql')
            .send({ query: '{ healthcareProfessionals { id } }' })
            .expect(200)
            .end((err: unknown, res: responseType<HealthcareProfessional[]>) => {
                console.log(res.body)
                // res will contain array of all users
                if (err) { return done(err) }
                // assume there are a 100 users in the database
                expect(res.body.data.healthcareProfessionals).to.have.lengthOf(9)
                done()

                return true
            })
    })
})
