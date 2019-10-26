import { Document, model, Schema } from 'mongoose'
import { User } from "./user.model"

export class NotificationClass  {
    public type: string
    public message: string
    public recipient: number
    public linkback: string
    public read?: boolean
    public createdAt?: Date
    public updatedAt?: Date

    constructor(obj?: Partial<NotificationClass>) {
        if (!obj) {
            return
        }

        this.type = (obj.type || null)
        this.message = (obj.message || null)
        this.recipient = (obj.recipient || null)
        this.linkback = (obj.linkback || null)
        this.read = (obj.read || false)
        this.createdAt = (obj.createdAt || null)
        this.updatedAt = (obj.updatedAt || null)
    }
}

const notificationModel = new Schema({
    type: { type: String, required: true },
    message: { type: String, required: true },
    recipient: { type: Schema.Types.ObjectId, ref: User, required: true },
    linkback: { type: String, required: false },
    read: { type: Boolean, default: false }
}, {
    timestamps: true
})

export interface NotificationDocument extends NotificationClass, Document { }

export const Notification = model<NotificationDocument>("Notification", notificationModel)
