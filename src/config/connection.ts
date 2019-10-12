import mongoose = require('mongoose')
const dotenv = require("dotenv")
dotenv.config()
// mongoose.Promise = global.Promise;

const host = process.env.MONGO_DB_HOST || "127.0.0.1"
const port = process.env.MONGO_DB_PORT || "27017"
const dbName = process.env.MONGO_DB_NAME || "projectOne"

const options = { useNewUrlParser: true, useFindAndModify: true }

if (process.env.MONGO_DB_URL) {
    mongoose.connect(process.env.MONGO_DB_URL, options)
}
else if (process.env.MONGO_DB_USER && process.env.MONGO_DB_PWD) {
    console.log('CONNECTING WITH AUTHENTICATION.')
    mongoose.connect(`mongodb://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PWD}@${host}:${port}/${dbName}`, options)
} else {
    console.log(`CONNECTING WITHOUT AUTHENTICATION: ${host}:${port}`)
    mongoose.connect(`mongodb://${host}:${port}/${dbName}`, options)
}

const db = mongoose.connection

db.on('error', (error) => {
    console.log('Connection Error.', error)
})

db.once('open', () => {
    console.log('Connection ok!')
})

module.exports = mongoose
