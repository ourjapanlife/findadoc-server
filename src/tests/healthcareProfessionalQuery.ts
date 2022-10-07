import { expect, should } from "chai";
import {} from "mocha";
import supertest from "supertest";

describe("GraphQL", () => {
  let request: any;
  beforeEach(() => {
    const url = `http://localhost:3000`;
    request = supertest(url);
  });

  it("Returns healthcareProfessional with id = 1", (done) => {
    request
      .post("/graphql")
      .send({
        query: "{ healthcareProfessional(id: 1) { names { firstName } id }}",
      })
      .expect(200)
      .end((err: any, res: any) => {
        // res will contain array with one user
        if (err) return done(err);

        console.log(res.body);
        expect(res.body.data.healthcareProfessional).to.have.property("id");
        expect(res.body.data.healthcareProfessional).to.have.property("names");

        const { names } = res.body.data.healthcareProfessional;

        expect(names[0]).to.have.property("firstName");
        done();

        return true;
      });
  });

  //   it("Returns all users", (done) => {
  //     request
  //       .post("/graphql")
  //       .send({ query: "{ user { id name username email } }" })
  //       .expect(200)
  //       .end((err, res) => {
  //         // res will contain array of all users
  //         if (err) return done(err);
  //         // assume there are a 100 users in the database
  //         res.body.user.should.have.lengthOf(100);
  //       });
  //   });
});
