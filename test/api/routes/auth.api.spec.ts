import * as bodyParser from "body-parser"
import * as chai from "chai"
import * as express from "express"
import * as supertest from "supertest"

import AuthApi from '../../../src/api/routes/auth.api'

const expect = chai.expect;

describe("Auth API", () => {

    const expressApp = express();

    before(async () => {
        expressApp.use(bodyParser.json({ limit: '15mb', type: 'application/json' }));
        expressApp.use('/', AuthApi);
    });

    after(async () => { });

    describe("Login", async () => {

        it('Send a 412 if no credentials are given', () => {

        });

        it("Sends a 412 if only partial credentials are given", () => {

        });

        it("Sends a 401 if the credentials don't belong to any user", () => {

        });

        it("Sends a 401 if the credentials are incorrect (but belong to an user)", () => {

        });

        it("Sends a 200 with an active session if credentials are valid and match an user", () => {

        });


    });

    describe("Signup", () => {

        it("Sends a 404 if no user matches the signup token", () => {

        });

        it("Sends a 200 with an active session.", () => {

        });

    });

});
