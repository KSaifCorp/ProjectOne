import { Request, Response, Router } from "express"
import * as bcrypt from 'bcrypt'
import { isEmpty } from 'lodash'

// Models
import { User, UserDocument} from "../../models/user.model"

// Interfaces
import { SessionInterface } from "../../interfaces/session.interface"

// Services
import authService from "../../services/AuthService/auth.service"

require("dotenv").config();

export interface LoginDto {
    email: string
    password: string
}

export class AuthApi {

    public router: Router;

    constructor() {
        this.router = Router();
        this.init();
    }

    public init() {
        this.router.post("/login", this.login.bind(this));
        this.router.get('/sign/:token', this.checkSignupToken)
        this.router.post("/sign/:token", this.signup.bind(this));
        this.router.get('/reset/:token', this.checkResetToken)
        this.router.post('/reset', this.triggerPasswordReset.bind(this))
        this.router.post('/reset/:token/', this.resetPassword.bind(this))
    }

    /**
     * Logs the user and creates a session
     * @param {Request} request
     * @param {Response} response
     * @returns {Promise<Response>}
     * @memberof AuthApi
     */
    public async login(request: Request, response: Response): Promise<Response> {

        if (isEmpty(request.body)) {
            return response.status(412).send('MISSING_CREDENTIALS')
        }

        const { email, password } = request.body as LoginDto

        try {

            if (email === undefined || password === undefined) {
                return response.status(412).send('MISSING_CREDENTIALS')
            }

            const matchingUser: UserDocument = await User
                .findOne({ email })
                .populate('perimeter.entity', '_id name')

            if (!matchingUser) {
                return response.status(401).send('INVALID_CREDENTIALS')
            }

            if (await bcrypt.compare(password, matchingUser.password)) {
                const authResult: SessionInterface = await authService.createSession(matchingUser)
                return response.status(200).send(authResult)
            } else {
                // Good Email with wrong password case
                return response.status(401).send('INVALID_CREDENTIALS')
            }


        } catch (error) {
            return response.status(500).send(error)
        }
    }

    /**
     * Finalizes the signup procedure of an user and sends back an active session
     *
     * @param {Request} request
     * @param {Response} response
     * @returns {Promise<Response>}
     * @memberof AuthApi
     */
    public async signup(request: Request, response: Response): Promise<Response> {

        const matchingUser: UserDocument = await User.findOne({ signupToken: request.params.token })

        if (!matchingUser) {
            return response.status(404).send('TOKEN_NOT_FOUND')
        }

        try {
            const { name, password } = request.body

            matchingUser.name = name
            matchingUser.signupToken = null

            matchingUser.password = await bcrypt.hash(password, 10)
            matchingUser.signupToken = null

            const signedUser: UserDocument = await User.findByIdAndUpdate(
                matchingUser['_id'],
                matchingUser,
                {
                    new: true
                }
            )

            const authResult: SessionInterface = await authService.createSession(signedUser)

            return response.status(200).send(authResult)
        } catch (error) {
            return response.status(500).send(error)
        }
    }

    /**
     * Checks the validity of a signup token. If an user matches, then it justs sends a 200 with
     * no user.
     *
     * @param {Request} request
     * @param {Response} response
     * @returns {Promise<Response>}
     * @memberof AuthApi
     */
    public async checkSignupToken(request: Request, response: Response): Promise<Response> {
        try {

            const matchingUser = await User.findOne({ signupToken: request.params.token })

            if (!matchingUser) {
                return response.status(404).send('TOKEN_NOT_FOUND')
            }

            return response.status(200).send()
        } catch (error) {
            return response.status(500).send(error)
        }
    }

    /**
     * Checks the validity of a reset password token. If an user matches, then it justs sends a 200 with
     * no user.
     *
     * @param {Request} request
     * @param {Response} response
     * @returns {Promise<Response>}
     * @memberof AuthApi
     */
    public async checkResetToken(request: Request, response: Response): Promise<Response> {
        try {
            const matchingUser: UserDocument = await User.findOne({ resetToken: request.params.token })

            if (!matchingUser) {
                return response.status(404).send('TOKEN_NOT_FOUND')
            }

            return response.status(200).send()
        } catch (error) {
            return response.status(500).send(error)
        }
    }

    /**
     * Resets the password of an user and sends back an active session
     *
     * @param {Request} request
     * @param {Response} response
     * @returns {Promise<Response>}
     * @memberof AuthApi
     */
    public async resetPassword(request: Request, response: Response): Promise<Response> {
        const matchingUser: UserDocument = await User.findOne({ resetToken: request.params.token })

        if (!matchingUser) {
            return response.status(404).send('TOKEN_NOT_FOUND')
        }

        try {
            const password = request.body.password

            // Requires node 8.12.0+
            matchingUser.password = await bcrypt.hash(password, 10)
            matchingUser.resetToken = null

            const signedUser: UserDocument = await User.findByIdAndUpdate(
                matchingUser['_id'],
                matchingUser,
                {
                    new: true
                }
            )

            const authResult: SessionInterface = await authService.createSession(signedUser)

            return response.status(200).send(authResult)
        } catch (error) {
            return response.status(500).send(error)
        }
    }

    /**
     * Triggers the reset of password for an user
     *
     * TODO: Send mail with resetToken URL
     *
     * @param {Request} request
     * @param {Response} response
     * @returns {Promise<Response>}
     * @memberof UserApi
     */
    public async triggerPasswordReset(request: Request, response: Response): Promise<Response> {
        try {
            const matchingUser = await User.findOne({ email: request.body.email })

            if (!matchingUser) {
                return response.status(404).send('EMAIL_NOT_FOUND')
            }

            if (matchingUser.signupToken) {
                return response.status(412).send('ACCOUNT_PENDING')
            }

            const token = authService.generateAuthToken()

            await User.findByIdAndUpdate(
                matchingUser._id,
                {
                    $set: { password: null, resetToken: token }
                }
            )

            // TODO : user redis + bull for mail queue
            // const options = {
            //     target: [
            //         {
            //             address: matchingUser.email
            //         },
            //     ],
            //     words: {
            //         url: `${process.env.FRONT_URL}/reset-password?token=${token}`,
            //         title: `Réinitialisez votre mot de passe.`
            //     },
            //     template: 'reset-user-password'
            // }

            // await mailBull.add(options)

            return response.status(200).send()
        } catch (error) {
            return response.status(500).send(error)
        }
    }


}

const authApi = new AuthApi();
export default authApi.router
