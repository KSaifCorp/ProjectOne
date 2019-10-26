import * as moment from 'moment'
import * as SocketIOClient from 'socket.io-client'
import * as Bull from 'bull'

import * as chai from "chai"
const expect = chai.expect
const ObjectId = require('mongodb').ObjectID


import { SocketService } from '../../src/services/SocketService/socket.service'
import { Notification, NotificationDocument, NotificationClass } from '../../src/models/notification.model'


describe('Socket Service', () => {

    const SERVER_PORT = 43128
    const socketService = new SocketService()

    const testUserId = new ObjectId()
    const testUserId2 = new ObjectId()
    const unreadNotificationId = new ObjectId()
    const readNotificationId = new ObjectId()

    const cleanUp = async () => {
        await Notification.deleteMany({
            _id: {
                $in: [unreadNotificationId, readNotificationId]
            }
        })

        await Notification.deleteMany({
            recipient: testUserId2,
            message: /^Unread Test/g
        })
    }

    let socketClient: SocketIOClient.Socket

    before(async () => {
        await cleanUp()

        socketService.listen(SERVER_PORT)

        socketClient = SocketIOClient(`http://127.0.0.1:${SERVER_PORT}`)

        await new Promise((resolve, reject) => {
            socketClient.once('connect', () => {
                socketClient.once('confirm', () => resolve())

                socketClient.emit('auth', {
                    user: testUserId,
                    origin: 'Test Suite'
                })
            })

            socketClient.once('connect_error', () => reject())
        })

        const notificationBase: NotificationClass = {
            type: 'notification',
            message: 'Hello there',
            recipient: testUserId,
            linkback: 'nope',
            read: false
        }

        // unread notification
        await Notification.create({
            ...notificationBase,
            _id: unreadNotificationId,
            read: false
        })

        // read notification
        await Notification.create({
            ...notificationBase,
            _id: readNotificationId,
            message: 'Hello there again',
            read: true
        })

    })

    after(async () => {
        await cleanUp()
        await Notification.deleteMany({ type: 'notification' })
        socketClient.disconnect()
    })

    it('dispatches a notification', (done) => {

        const notification: NotificationClass = {
            type: 'notification',
            recipient: testUserId,
            message: `Hello there, friend. ${moment().unix()}`,
            linkback: 'nope'
        }

        // dispatch notification
        socketService.process({ data: notification } as Bull.Job<NotificationDocument>)

        // wait for socket message
        socketClient.on('notification', async (data: NotificationDocument) => {
            expect(data['_id']).to.not.be.null
            expect(data.type).to.equal(notification.type)
            expect(data.recipient.toString()).to.equal(notification.recipient.toString())
            expect(data.message).to.equal(notification.message)
            expect(data.linkback).to.equal(notification.linkback)
            expect(data.read).to.be.false

            expect(data.createdAt).to.not.be.null
            expect(moment(data.createdAt).isValid()).to.be.true

            expect(data.updatedAt).to.not.be.null
            expect(moment(data.updatedAt).isValid()).to.be.true

            // check if the notification got saved properly
            const savedNotification = await Notification.findOne({
                _id: ObjectId(data['_id']),
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
            })
            expect(savedNotification).to.not.be.null

            // great success!
            done()
        })
    })

    it('marks an unread notification as read', async () => {
        // check if our unread notification is still unread
        const notificationBefore = await Notification.findOne({
            _id: unreadNotificationId,
        })
        expect(notificationBefore).to.not.be.null
        expect(notificationBefore.read).to.be.false

        const results = await Promise.all([
            // call setNotificationReadStatus and wait for the callback by the server
            new Promise<void>(resolve => {
                socketClient.emit('setNotificationReadStatus', {
                    notificationId: unreadNotificationId.toString(),
                    read: true
                }, () => resolve())
            }),
            // wait for the 'notificationStatusChanged' event
            new Promise<{ notificationId: string, read: boolean }>(resolve => {
                socketClient.once('notificationStatusChanged', (data) => resolve(data))
            })
        ])

        const notificationEventData = results[1]
        expect(notificationEventData).to.not.be.null
        expect(notificationEventData.notificationId).to.equal(unreadNotificationId.toString())
        expect(notificationEventData.read).to.be.true

        // check if the notification got updated to read = true
        const notificationAfter = await Notification.findOne({
            _id: unreadNotificationId,
        })
        expect(notificationAfter).to.not.be.null
        expect(notificationAfter.read).to.be.true
    })

    it('marks a read notification as unread', async () => {
        // check if our notification is actually read
        const notificationBefore = await Notification.findOne({
            _id: readNotificationId,
        })
        expect(notificationBefore).to.not.be.null
        expect(notificationBefore.read).to.be.true

        const results = await Promise.all([
            // call setNotificationReadStatus and wait for the callback by the server
            new Promise(resolve => {
                socketClient.emit('setNotificationReadStatus', {
                    notificationId: readNotificationId.toString(),
                    read: false
                }, () => resolve())
            }),
            // wait for the 'notificationStatusChanged' event
            new Promise<{ notificationId: string, read: boolean }>(resolve => {
                socketClient.once('notificationStatusChanged', (data) => resolve(data))
            })
        ])

        const notificationEventData = results[1]
        expect(notificationEventData).to.not.be.null
        expect(notificationEventData.notificationId).to.equal(readNotificationId.toString())
        expect(notificationEventData.read).to.be.false

        // check if the notification got updated to unread
        const notificationAfter = await Notification.findOne({
            _id: readNotificationId,
        })
        expect(notificationAfter).to.not.be.null
        expect(notificationAfter.read).to.be.false
    })

    it('replays unread notifications on connect', async () => {
        // create 10 notifications
        const notificationIds = []
        for (let i = 0; i < 10; i++) {
            const newNotificationId = new ObjectId()
            await Notification.create({
                _id: newNotificationId,
                type: 'notification',
                message: `Unread Test ${i}`,
                recipient: testUserId2,
                linkback: 'nope'
            })
            notificationIds.push(newNotificationId)
        }

        // connect to the socket server and authenticate
        const separateClient = SocketIOClient(`http://127.0.0.1:${SERVER_PORT}`)
        await new Promise((resolve, reject) => {
            separateClient.once('connect', () => {
                separateClient.once('confirm', () => resolve())

                separateClient.emit('auth', {
                    user: testUserId2,
                    origin: 'Test Suite'
                })
            })

            separateClient.once('connect_error', () => reject())
        })

        const receivedNotifications = []

        // received unread notifications
        await new Promise((resolve, reject) => {
            const onNotificationReceived = async (data) => {
                try {
                    receivedNotifications.push(data)

                    if (receivedNotifications.length >= notificationIds.length) {
                        resolve()
                    } else {
                        separateClient.once('notification', (data) => onNotificationReceived(data))
                    }
                } catch (error) {
                    reject(error)
                }
            }

            separateClient.once('notification', (data) => onNotificationReceived(data))
        })

        // assert that we got our 10 unread notifications (in the same order)
        expect(receivedNotifications.length).to.equal(notificationIds.length)
        for (let i = 0; i < receivedNotifications.length; i++) {
            expect(receivedNotifications[i]._id).to.equal(notificationIds[i]._id.toString())
        }

        // clean up our mess
        await Notification.deleteMany({
            _id: {
                $in: notificationIds
            }
        })

        separateClient.disconnect()
    })
})
