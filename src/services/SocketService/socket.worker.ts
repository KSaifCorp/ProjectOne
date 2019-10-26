import * as _ from "lodash"
import * as Queue from 'bull'

import { SocketService } from "./socket.service"

require("dotenv").config()
const defaultSocketsPort = 5000
const socketsPort = (process.env.SOCKETS_PORT ? parseInt(process.env.SOCKETS_PORT, 10) : defaultSocketsPort)

/**
 * Run this worker as a daemon to process queued socket emition demands from who knows where.
 * I'm just the postman dude, I ain't know nothing.
 *
 * @export
 * @class SocketWorker
 */
export class SocketWorker {

    /**
     * Incoming notifications queue
     *
     * @property
     */
    private queue: Queue.Queue


    /**
     * Socket server and message broker. This is where all the magic happens
     *
     * @property
     */
    private socketService: SocketService

    /**
     * @constructor
     */
    constructor()
    {
        this.queue = new Queue('socket', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
        this.socketService = new SocketService()
    }


    /**
     * Setups queue processing and starts the sockets server
     *
     * @method
     */
    public init()
    {
        this.queue.process(async (job) => await this.socketService.process(job))
        this.socketService.listen(socketsPort)
    }

}

const socketWorker = new SocketWorker()
socketWorker.init()
export default socketWorker
