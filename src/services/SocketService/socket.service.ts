import * as SocketIO from 'socket.io'
import { Job } from 'bull'
import { Types } from 'mongoose'

import { Notification, NotificationDocument, NotificationClass } from '../../models/notification.model'

/**
 * Provides a Socket.IO server and handling/routing logic for client-side notifications
 *
 * @class
 */
export class SocketService {

    /**
     * Socket.IO server for client-side notifications
     *
     * @property
     */
    private io: SocketIO.Server

    constructor() {
        this.io = SocketIO({
            transports: ['websocket', 'polling']
        })

        this.io.on('connect', (socket: SocketIO.Socket) => {
            this.handleNewConnection(socket)
        })
    }

    /**
     * Starts the HTTP/WebSockets server on the specified port
     * @method
     * @param {number} port HTTP port number
    */
    public listen(port: number): void {
        this.io.listen(port)
        console.log(`started on port ${port}`)
    }

    /**
     * Queue handler function for incoming notifications sent by other services.
     * Takes care of routing said notifications to the target user.
     *
     * @method
     * @param {Job<NotificationInterface>} job
    */
    public async process(job: Job<NotificationClass>) {

        const notification: NotificationClass = new NotificationClass(job.data)

        const savedNotification: NotificationDocument = await this.savedNotification(notification)

        if (savedNotification) {
            await this.alertSubscriptions(notification.recipient, savedNotification)
        }

    }

    /**
     * Handles an new client connection and sets up all required event handlers for that socket
     *
     * @method
     * @param {SocketIO.Socket} socket
     */
    protected async handleNewConnection(socket: SocketIO.Socket) {

        // When the user sends their own auth packet, they're added to the list of clients
        socket.on('auth', async (message: { user: number, origin: string }) => {

            await this.addSubscription(socket, message.user, message.origin)
            socket.emit('confirm', message)

            // Register RPC method 'setNotificationReadStatus'
            socket.on('setNotificationReadStatus', async (data, callback = (notification: NotificationClass) => {}) => {
                const updatedNotification = await this.setNotificationReadStatus(data.notificationId, data.userId, data.read)

                this.getRoomForUser(message.user).emit('notificationStatusChanged', {
                    notificationId: updatedNotification['_id'].toString(),
                    read: updatedNotification.read
                })

                callback(updatedNotification)

            })

            const notifications = await this.getUnreadNotifications(message.user)
            for (const notification of notifications) {
                this.alertSubscriptions(message.user, notification)
            }

        })

    }

    /**
     * Saves a notification to MongoDB
     *
     * @method
     * @param {NotificationInterface} notification
     */
    private async savedNotification(notification: NotificationDocument | NotificationClass): Promise<NotificationDocument> {

        const storedNotification = await Notification.create(notification)

        if (!storedNotification) {
            return null
        }

        return {
            ...storedNotification.toObject(),
            _id: storedNotification._id.toString()
        }

    }

    /**
     * Dispatches a notification to the specified user
     *
     * @method
     * @param {number} userId
     * @param {NotificationInterface} notification
     */
    protected async alertSubscriptions(userId: number, notification: NotificationDocument)
    {
        this.getRoomForUser(userId).emit('notification', notification)
    }

    /**
     * Get all unread notifications for the specified user
     *
     * @method
     * @param {number} userId
     */
    protected async getUnreadNotifications(userId: number): Promise<Array<NotificationDocument>>
    {
        return await Notification.find({
            recipient: userId,
            read: false
        }).lean()
    }

    /**
     * Change the status (read/unread) of a notification
     *
     * @method
     * @param {string} notificationId
     * @param {number} userId
     * @param {boolean} read  Status flag: read or unread
     */
    protected async setNotificationReadStatus(notificationId: string, userId: number, read: boolean): Promise<NotificationDocument>
    {
        const result = await Notification.findOneAndUpdate(
            {
                _id: Types.ObjectId(notificationId),
                user: userId
            },
            {
                $set: { read }
            },
            {
                new: true
            }
        ).lean()

        if (!result) {
            return null
        }

        return result
    }

    /**
     * Registers a new subscription
     *
     * @method
     * @param {SocketIO.Socket} socket
     * @param {number} userId
     * @param {string} origin
     */
    protected async addSubscription(socket: SocketIO.Socket, userId: number, origin: string)
    {
        // join user room to receive targeted notifications
        socket.join(this.getRoomNameForUser(userId))
    }

    /**
     * Get the Socket.IO room name of the specified user.
     * Instead of keeping track of all sockets/subscriptions of a user manually and iterating on all its known sockets, we just
     * add each authenticated socket to the Socket.IO room of its user.
     * This way, sending an event to all known sockets of a user is just a matter of sending that event to the right room (and
     * letting Socket.IO take care of the rest natively, even on replicated systems).
     *
     * @method
     * @param {number} userId
     */
    protected getRoomForUser(userId: number): SocketIO.Namespace
    {
        return this.io.in(this.getRoomNameForUser(userId))
    }

    /**
     * Get the Socket.IO room name of the specified user
     *
     * @method
     * @param {number} userId
     */
    protected getRoomNameForUser(userId: number): string
    {
        return `user/${userId}`
    }
}
