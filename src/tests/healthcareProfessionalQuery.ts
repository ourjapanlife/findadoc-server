/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { expect } from 'chai';
import {} from 'mocha';
import supertest from 'supertest';

describe('GraphQL', () => {
    let request: any;

    beforeEach(() => {
        const url = 'http://localhost:3001';

        request = supertest(url);
    });

    it('Returns healthcareProfessional with id = 1', done => {
        request
            .post('/graphql')
            .send({
                query: '{ healthcareProfessional(id: 1) { names { firstName } id }}'
            })
            .expect(200)
            .end((err: any, res: any) => {
                // res will contain array with one user
                if (err) { return done(err); }

                console.log(res.body);
                expect(res.body.data.healthcareProfessional).to.have.property('id').equal('1');
                expect(res.body.data.healthcareProfessional).to.have.property('names');

                const { names } = res.body.data.healthcareProfessional;

                expect(names[0]).to.have.property('firstName').equal('Larissa');
                done();

                return true;
            });
    });

    it('Returns all users', done => {
        request
            .post('/graphql')
            .send({ query: '{ healthcareProfessionals { id } }' })
            .expect(200)
            .end((err:any, res: any) => {
                console.log(res.body);
                // res will contain array of all users
                if (err) { return done(err); }
                // assume there are a 100 users in the database
                expect(res.body.data.healthcareProfessionals).to.have.lengthOf(0);
                done();

                return true;
            });
    });
});
