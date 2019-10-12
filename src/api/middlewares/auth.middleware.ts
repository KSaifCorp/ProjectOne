import { NextFunction, Request, Response } from "express"
import * as jwt from "jsonwebtoken"
import { PRIVATE_KEY, PUBLIC_KEY } from "../../config/keys"


// Prevents an API from being accessed unless the user is authentified
module.exports.isAuthorized = (request: Request, response: Response, next: NextFunction) => {
    console.log("Auth middleware check...")
    const auth = request.headers.authorization
    if (auth) {
        try {
            // Pass token to other methods in the chain
            response.locals.auth = verifyAuth(request.headers.authorization)

            return next()
        } catch (error) {
            console.log("Access refused: ", error)

            return response.status(401).send("UNAUTHORIZED")
        }
    }
    console.log("Access refused. No auth is given")
    return response.status(401).send("UNAUTHORIZED")
}

/**
 * Verifies a token is present and valid
 *
 * @param {*} requestHeadersAuthorization
 * @returns {String} The decoded token
 */
function verifyAuth(requestHeadersAuthorization): String {
    // Split the token to isolate parts (since it's a Bearer token, some parts like "Bearer " have to be left out)
    const tokenArray = requestHeadersAuthorization.split(" ")

    const token = (tokenArray[0] === 'Bearer') ? tokenArray[1] : tokenArray[0]

    // Verify Token
    const verifyOptions = {
        algorithm: "RS256",
        issuer: 'Saif'
    }
    return jwt.verify(token, PUBLIC_KEY, verifyOptions)
}
