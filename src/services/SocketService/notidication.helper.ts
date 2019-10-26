import * as Queue from "bull"
import { NotificationClass } from "../../models/notification.model"

/**
 * Set of functions to deal with client-side notifications
 *
 * @class
 */
export class NotificationHelper
{
    /**
     * Socket message queue. Notifications will be sent there.
     *
     * @property
     */
    private socketQueue: Queue.Queue<NotificationClass>

    /**
     * @constructor
     */
    constructor()
    {
        this.socketQueue = new Queue('socket', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
    }

    /**
     * Sends a notification
     *
     * @param {NotificationInterface} notification
     */
    public async sendNotification(notification: NotificationClass): Promise<Queue.Job<NotificationClass>>
    {
        return await this.socketQueue.add(notification, {
            removeOnComplete: true
        })
    }

    /**
     * Send a notification to multiple recipients
     *
     * @param {NotificationClass} notification Notification object. Its `recipient` property can be null there.
     * @param {number[]} recipients Recipients list
     */
    public async sendMulticastNotification(notification: NotificationClass, recipients: number[]): Promise<Array<Queue.Job<NotificationClass>>>
    {
        const promises = recipients.map(async recipientId => {
            const recipientNotification: NotificationClass = {
                ...notification,
                recipient: recipientId
            }

            return await this.socketQueue.add(recipientNotification, {
                removeOnComplete: true
            })
        })

        return await Promise.all(promises)
    }
}

const notificationHelper = new NotificationHelper()
export default notificationHelper
