import * as jwt from "jsonwebtoken"

import { PRIVATE_KEY, PUBLIC_KEY } from '../../config/keys'

// Interfaces
import { SessionInterface } from "../../interfaces/session.interface"
import { AuthSubject } from "../../interfaces/authSubject.interface"

// Models
import { UserDocument } from "../../models/user.model"


export class AuthService {

    /**
     * Creates the session for the user logging in
     *
     * @param {UserDocument} user
     * @param {(number | string)} [tokenExpiration=1296000]
     * @returns {Promise<Session>}
     * @memberof AuthService
     */
    public async createSession(user: UserDocument, tokenExpiration: number | string = 1296000): Promise<SessionInterface> {

        // const permissions = await userService.resolvePermissionsFromAccessPerimeter(currentEntity)
        const permissions = []

        const authSubject: AuthSubject = {
            _id: user['_id'],
            name: user.name,
            isStaff: user.isStaff,
            permissions: permissions
        }

        // @ts-ignore
        const jwtBearerToken = jwt.sign(
            {
                user: user['_id']
            },
            PRIVATE_KEY,
            {
                issuer: 'Saif',
                subject: JSON.stringify(authSubject),
                algorithm: 'RS256',
                expiresIn: tokenExpiration
            }
        )

        return {
            bearer: jwtBearerToken,
            subject: authSubject,
            expiresIn: tokenExpiration
        }
    }

    /**
     * Verifies the validity of a token
     *
     * @private
     * @param {string} token
     * @returns {boolean}
     * @memberof AuthService
     */
    private verifyTokenValidity(token: string): boolean {

        try {
            return jwt.verify(token, PUBLIC_KEY, { issuer: 'Saif', algorithm: 'RS256' })
        } catch (error) {
            return false
        }
    }

    /**
     * Generates a 30-character long auth token for signup & password reset.
     *
     * No duplicates are checked since there are 4.51*10^17 possibilities (exactly 450 883 717 216 034 179 combinations
     * which is 450 million billion possibilties...)
     *
     * @private
     * @param {number} [length=30]
     * @returns {string}
     * @memberof AuthService
     */
    public generateAuthToken(length = 30): string {
        const values = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let uniqueId = ""
        for (let i = length; i > 0; --i) {
            uniqueId += values[Math.round(Math.random() * (values.length - 1))]
        }

        return uniqueId
    }
}

const authService = new AuthService()
export default authService


