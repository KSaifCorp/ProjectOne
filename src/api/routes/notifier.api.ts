import { Request, Response, Router } from "express"
import * as _ from "lodash"

import * as Queue from "bull"
require("dotenv").config()

const notificationQueue = new Queue("notification", `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)

export class NotifierApi {
    
    public router: Router;

    constructor() {
        this.router = Router();
        this.init();
    }

    public init() {
        this.router.post("/dispatch", this.dispatch)
    }

    /**
     * Dispatches notification demands from clients to the notification queue
     *
     * @param {Request} request
     * @param {Response} response
     * @memberof NotifierApi
     */
    public dispatch(request: Request, response: Response) {
        notificationQueue.add(request.body, {
            removeOnComplete: true
        })
    }
    
}

const notifierApi = new NotifierApi()
notifierApi.init()
export default notifierApi.router
