require('./../../../src/config/connection')
import * as bodyParser from "body-parser"
import * as chai from "chai"
import * as express from "express"
import * as supertest from "supertest"

import AuthApi from '../../../src/api/routes/auth.api'
import { SPECSHelper } from "../../specs-helper"
import { User, UserDocument } from "../../../src/models/user.model"

const expect = chai.expect;

describe("Auth API", () => {

    const expressApp = express();

    before(async () => {
        expressApp.use(bodyParser.json({ limit: '15mb', type: 'application/json' }));
        expressApp.use('/', AuthApi);

        await SPECSHelper.setup()
    });

    after(async () => {
        await SPECSHelper.teardown()
    });

    describe("Login", async () => {

        it('Send a 412 if no credentials are given', () => {
            return supertest(expressApp)
                .post('/login')
                .expect(412, 'MISSING_CREDENTIALS')
        });

        it("Sends a 412 if only partial credentials are given", () => {
            const credentials = {
                email: 'test-mail@gmail.com'
            }

            return supertest(expressApp)
                .post('/login')
                .send(credentials)
                .expect(412, 'MISSING_CREDENTIALS')
        });

        it("Sends a 401 if the credentials don't belong to any user", () => {
            const credentials = {
                email: 'test-mail@gmail.com',
                password: 'testPassword'
            }

            return supertest(expressApp)
                .post('/login')
                .send(credentials)
                .expect(401, 'INVALID_CREDENTIALS')

        });

        it("Sends a 401 if the credentials are incorrect (but belong to an user)", () => {
            const credentials = {
                email: 'gary@pokemon.com',
                password: 'Pikachu'
            }

            return supertest(expressApp)
                .post('/login')
                .send(credentials)
                .expect(401, 'INVALID_CREDENTIALS')

        });

        it("Sends a 200 with an active session if credentials are valid and match an user", () => {

            const credentials = {
                email: 'gary@pokemon.com',
                password: 'Rattata'
            }

            return supertest(expressApp)
                .post('/login')
                .send(credentials)
                .expect(200)
        });


    });

    describe("Check Signup Token", () => {
        it("Sends a 404 if no user matches the signup token", () => {
            return supertest(expressApp)
                .get('/sign/82FFbX8Qk6jwBy73HBANvmHtz0yHtn5kGI0qRREQACFS4atx8H')
                .expect(404, 'TOKEN_NOT_FOUND')
        })

        it("Sends a 200 WITHOUT the user if there's a match", () => {
            return supertest(expressApp)
                .get('/sign/82FFbX8Qk6jwBy73HBANvmHtz0yHtn5kGI0qRREQACFS4atx8G')
                .expect(200)
        })
    })

    describe("Signup", () => {

        it("Sends a 404 if no user matches the signup token", () => {
            return supertest(expressApp)
                .post('/sign/82FFbX8Qk6jwBy73HBANvmHtz0yHtn5kGI0qRREQACFS4atx8H')
                .expect(404, 'TOKEN_NOT_FOUND')
        })

        it("Sends a 200 with an active session.", () => {
            const signup = {
                name: 'Crystal',
                password: 'Suicine'
            }

            return supertest(expressApp)
                .post('/sign/82FFbX8Qk6jwBy73HBANvmHtz0yHtn5kGI0qRREQACFS4atx8G')
                .send(signup)
                .expect(200)
        })

    });

    describe("Check Reset Password Token", () => {
        it("Sends a 404 if no user matches the reset token", () => {
            return supertest(expressApp)
                .get('/reset/82FFbX8Qk6jwBy73HBANvmHtz0yHtn5kGI0qRREQACFS4atx8H')
                .expect(404, 'TOKEN_NOT_FOUND')
        })

        it("Sends a 200 WITHOUT the user if there's a match", () => {
            return supertest(expressApp)
                .get('/reset/hLa1uzeZaGcWtzpVYRRiCEOXzxlhUIJblOQO1eBS8HdcBAsjU0')
                .expect(200)
        })
    })

    describe("Reset password", () => {
        before(async () => {
            await SPECSHelper.teardown()

            await SPECSHelper.setup()
        })

        after(async () => {
            await SPECSHelper.teardown()

        })

        describe("Request for reset", () => {
            it("Sends a 404 if no mail matches an user", async () => {
                return supertest(expressApp)
                    .post("/reset")
                    .send({ email: 'unknown@mail.com' })
                    .expect(404, 'EMAIL_NOT_FOUND')
            })

            it("Sends a 412 if the account still has a token for a signup", async () => {
                return supertest(expressApp)
                    .post("/reset")
                    .send({ email: 'crystal@pokemon.com' })
                    .expect(412, 'ACCOUNT_PENDING')
            })

            it("Sends a 200 if the password has been reset", async () => {
                return supertest(expressApp)
                    .post("/reset")
                    .send({ email: 'blue@pokemon.com' })
                    .expect(200)
                    .then(async () => {
                        const resetUser: UserDocument = await User.findById('1ca0df5f86abeb66da97ba60')

                        expect(resetUser.password).to.be.null
                        expect(resetUser.resetToken).to.not.be.null
                    })
            })
        })

        describe("Actual reset", () => {
            it("Sends a 404 if no user matches the signup token", () => {
                return supertest(expressApp)
                    .post('/reset/82FFbX8Qk6jwBy73HBANvmHtz0yHtn5kGI0qRREQACFS4atx8H')
                    .expect(404, 'TOKEN_NOT_FOUND')
            })

            it("Sends a 200 with an active session.", async () => {
                const reset = {
                    password: 'Suicine'
                }

                const matchingUser = await User.findOne({ resetToken: 'hLa1uzeZaGcWtzpVYRRiCEOXzxlhUIJblOQO1eBS8HdcBAsjU0' })

                return supertest(expressApp)
                    .post('/reset/hLa1uzeZaGcWtzpVYRRiCEOXzxlhUIJblOQO1eBS8HdcBAsjU0')
                    .send(reset)
                    .expect(200)
                    .then(async () => {

                        const resetUser = await User.findById(matchingUser._id)

                        expect(resetUser.resetToken).to.be.null
                        expect(resetUser.password).to.not.be.null
                    })
            })
        })
    })

});
