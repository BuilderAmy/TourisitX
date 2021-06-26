// This file mostly contains methods to use in other to get certain variables out.
// I made this because we are all lazy people and no one gives 10 flying shits about SQLize.
// -- Dylan

// Database operations
require('../db')

getUserByID = (uid, callback) => {
    findDB('user', { 'id': uid }, (userResult) => {
        return callback(userResult[0].dataValues)
    })
}


getUserBySession = (sid, callback) => {
    findDB('session', { 'sessionId': sid }, (sessionResult) => {
        if (sessionResult.length !== 1) {
            return callback(null)
        }

        getUserByID(sessionResult[0].dataValues.userId, (userResult) => {
            // Remove sensitive information
            delete userResult.password
            delete userResult.ip_address
            delete userResult.stripe_id
            return callback(userResult)
        })
    })
}

getUserBySessionDangerous = (sid, callback) => {
    findDB('session', { 'sessionId': sid }, (sessionResult) => {
        if (sessionResult.length !== 1) {
            return callback(null)
        }

        getUserByID(sessionResult[0].dataValues.userId, (userResult) => {
            return callback(userResult)
        })
    })
}

isLoggedin = (sid, callback) => {
    if (sid === undefined) {
        return callback(false)
    }

    findDB('session', { 'sessionId': sid }, (result) => {
        if (result.length !== 1) {
            return callback(false)
        }

        const UpdateLastSeenPayload = {
            'lastseen_time': (new Date()).toISOString(),
        }

        updateDB('user', { 'id': result[0].dataValues.userId }, UpdateLastSeenPayload, () => {
            callback(true)
        })
    })
}

// getUserBySession('d237a174694b00af29a22c7db8cb4974d8c4754656b913879452b433f4624d38947d17a31cb8bad396b7307e3d1683c99c5a76f1748e3f8b8fe8398b7801658e', (result) => {
//     console.log(result)
// })

// isLoggedin('d237a174694b00af29a22c7db8cb4974d8c4754656b913879452b433f4624d38947d17a31cb8bad396b7307e3d1683c99c5a76f1748e3f8b8fe8398b7801658e', (result) => {
//     console.log(result)
// })

module.exports = getUserByID
module.exports = getUserBySession
module.exports = getUserBySessionDangerous
module.exports = isLoggedin