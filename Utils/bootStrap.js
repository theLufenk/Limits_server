/**
 * Created by cl-desktop31 on 26/5/16.
 */
'use strict';

let mongoose = require('mongoose'),
    Config = require('../Config'),
    DAO = require('../DAOManager').queries,
    Models = require('../Models'),
    fs = require('node-fs'),
    moment = require('moment'),
    logger = require('log4js').getLogger('[Bootstrap]'),
    async = require('async'),
    CONSTANTS = require('../Config').constants,
    sendPush = require('../Lib/notificationManager').sendFCMPushNotification;


//Connect to MongoDB
mongoose.connect(Config.dbConfig.config.dbURI, (err) => {
    if (err) {
        logger.error("DB Error: ", err)
        process.exit(1);
    }
    else logger.info('MongoDB Connected--->>>');
});


exports.BOOTSTRAP_ADMIN_SETTINGS = function (callback) {

    var setting1 = {
        type: CONSTANTS.ADMIN_SETTINGS.ADVERTISEMENT_COIN,
        value: 10,
    };
    var setting2 = {
        type: CONSTANTS.ADMIN_SETTINGS.ADMIN_SHARE,
        value: 10,
    };
    async.parallel([
        function (cb) {
            INSERT_ADMIN_SETTINGS(setting1.type, setting1, cb)
        },
        function (cb) {
            INSERT_ADMIN_SETTINGS(setting2.type, setting2, cb)
        }
    ], function (err, done) {
        callback(err, done[0]/*+'\n'+done[1]+'\n'+done[2]*/);
    })
};

function INSERT_ADMIN_SETTINGS(type, status, callback) {
    var needToCreate = true;
    var currStatus;
    async.series([function (cb) {
        var criteria = {
            type: type,
        };
        DAO.getData(Models.adminSettings, criteria, {}, {}, function (err, data) {
            if (data && data.length > 0) {
                needToCreate = false;
                currStatus = data[0].value
            }
            cb()
        })
    }, function (cb) {
        if (needToCreate) {
            DAO.saveData(Models.adminSettings, status, function (err, data) {
                currStatus = 10
                cb(err, data)
            })
        } else {
            cb();
        }
    }], function (err, data) {

        callback(err, 'Bootstrapping finished and ' + type + ' == ' + currStatus || status.price)
    })
};


exports.EXPIRE_CHALLENGES = function (expiryTime, callback) {
    async.auto({
        GET_EXPIRED_CHALLENGES: function (cb) {
            let criteria = {
                status: {$nin: [CONSTANTS.CHALLENGE_TYPES.COMPLETED, CONSTANTS.CHALLENGE_TYPES.REJECTED, CONSTANTS.CHALLENGE_TYPES.EXPIRED]},
                expiryTime: {$lte: expiryTime},
            }
            let projection = {}
            let options = {}
            DAO.getData(Models.challenges, criteria, projection, options, cb)
        },
        SETTLE_CHALLENGES: ['GET_EXPIRED_CHALLENGES', function (prevResult, cb) {
            console.log("...........aaaa...........", prevResult.GET_EXPIRED_CHALLENGES)

            if (prevResult.GET_EXPIRED_CHALLENGES.length) {
                SETTLE_CHALLENGES(prevResult.GET_EXPIRED_CHALLENGES, cb)
            } else
                cb(null, [])
        }],
        UPDATE_CHALLENGES: ['GET_EXPIRED_CHALLENGES', 'SETTLE_CHALLENGES', function (prevResult, cb) {

            if (prevResult.SETTLE_CHALLENGES.length) {
                let criteria = {
                    _id: {$in: prevResult.SETTLE_CHALLENGES}
                }
                let dataToUpdate = {
                    status: CONSTANTS.CHALLENGE_TYPES.EXPIRED
                }
                let options = {
                    multi: true,
                }
                DAO.update(Models.challenges, criteria, dataToUpdate, options, cb)
            } else
                cb(null)
        }]
    }, function (err, result) {
        callback(null)
    })
}

function SETTLE_CHALLENGES(challenges, callback) {
    var challengeIds = []
    async.each(challenges, function (obj, eachCB) {

        async.auto({
            CHECK_CHALLENGE: (autoCB) => {
                let userId = null;
                let coins = 0;
                let wonBy = '';
                let lostBy = '';
                let isWon = false;
                switch (obj.status) {
                    case CONSTANTS.CHALLENGE_TYPES.ACCEPTED:
                        if (obj.ischallengedByCompleted && !obj.ischallengedToCompleted) {      // challengedBy completed challengedTo not completed
                            if (obj.type == CONSTANTS.CHALLENGE_TYPES.CUSTOM) {

                                if (obj.challengedByTime <= obj.targetTime && obj.targetDistance <= obj.challengedByDistance) {
                                    userId = obj.challengedBy
                                    coins = obj.coins * 2
                                    isWon = true
                                    wonBy = obj.challengedBy
                                    lostBy = obj.challengedTo
                                }

                            } else {
                                userId = obj.challengedBy
                                coins = obj.coins * 2
                                isWon = true
                                wonBy = obj.challengedBy
                                lostBy = obj.challengedTo
                            }

                        }
                        if (!obj.ischallengedByCompleted && obj.ischallengedToCompleted) {      //challengedTo completed challengedBy not completed
                            if (obj.type == CONSTANTS.CHALLENGE_TYPES.CUSTOM) {

                                if (obj.challengedToTime <= obj.targetTime && obj.targetDistance <= obj.challengedToDistance) {
                                    userId = obj.challengedTo
                                    coins = obj.coins * 2
                                    isWon = true
                                    wonBy = obj.challengedTo
                                    lostBy = obj.challengedBy
                                }

                            } else {
                                userId = obj.challengedTo
                                coins = obj.coins * 2
                                isWon = true
                                wonBy = obj.challengedTo
                                lostBy = obj.challengedBy
                            }
                        }
                        break;
                    case CONSTANTS.CHALLENGE_TYPES.PENDING:
                        userId = obj.challengedBy
                        coins = obj.coins
                        break;
                }
                console.log("............aaaaaaaa..........", userId, coins, wonBy, isWon)

                autoCB(null, {userId: userId, coins: coins, wonBy: wonBy, isWon: isWon, lostBy: lostBy})
            },
            UPDATE_USER: ['CHECK_CHALLENGE', (prevResult, autoCB) => {
                if (!!prevResult.CHECK_CHALLENGE.userId) {
                    let criteria = {
                        _id: prevResult.CHECK_CHALLENGE.userId
                    }
                    let dataToUpdate = {
                        $inc: {coins: prevResult.CHECK_CHALLENGE.coins}
                    }
                    let options = {
                        new: true
                    }

                    DAO.findAndUpdate(Models.user, criteria, dataToUpdate, options, function (err, res) {
                        //console.log("............aaaaaaaa..........",criteria,dataToUpdate,res)
                        autoCB()
                    })
                } else
                    autoCB()
            }],
            UPDATE_CHALLENGE: ['CHECK_CHALLENGE', (prevResult, autoCB) => {
                if (prevResult.CHECK_CHALLENGE.isWon) {
                    let criteria = {
                        _id: obj._id
                    }
                    let dataToUpdate = {
                        status: CONSTANTS.CHALLENGE_TYPES.COMPLETED,
                        wonBy: prevResult.CHECK_CHALLENGE.wonBy
                    }
                    let options = {
                        new: true
                    }
                    DAO.findAndUpdate(Models.challenges, criteria, dataToUpdate, {}, autoCB)
                } else {
                    challengeIds.push(obj._id)
                    autoCB(null)

                }
            }],
            CREATE_NOTIFICATION: ['CHECK_CHALLENGE', (prevResult, autoCB) => {

                if (prevResult.CHECK_CHALLENGE.isWon) {
                    let dataToSave = [];
                    dataToSave.push({
                        userId: prevResult.CHECK_CHALLENGE.wonBy,
                        text: 'You won a challenge and earned ' + obj.coins * 2 + ' coins',
                        title: 'Challenge Won!',
                        challengeId: obj._id,

                    }, {
                        userId: prevResult.CHECK_CHALLENGE.wonBy,
                        text: 'You lost a challenge ',
                        title: 'Challenge Lost!',
                        challengeId: obj._id,
                    })
                    DAO.insertMany(Models.notifications, dataToSave, {}, autoCB)

                } else
                    autoCB(null)
            }],

            GET_USERS: ['CHECK_CHALLENGE', (prevResult, cb) => {
                let criteria = {
                    _id: [obj.challengedTo, obj.challengedBy]
                }
                DAO.getData(Models.user, criteria, {}, {}, function (err, res) {
                    if (err)
                        cb(err)
                    else {
                        let winner = {},
                            looser = {};
                        if (prevResult.CHECK_CHALLENGE.isWon) {
                            if ((res[0]._id).toString() == prevResult.CHECK_CHALLENGE.wonBy.toString()) {
                                winner = {
                                    name: res[0].firstName + ' ' + res[0].lastName,
                                    deviceToken: res[0].deviceDetails.deviceToken
                                }
                                looser = {
                                    name: res[1].firstName + ' ' + res[1].lastName,
                                    deviceToken: res[1].deviceDetails.deviceToken
                                }
                            } else {
                                winner = {
                                    name: res[1].firstName + ' ' + res[1].lastName,
                                    deviceToken: res[1].deviceDetails.deviceToken
                                }
                                looser = {
                                    name: res[0].firstName + ' ' + res[0].lastName,
                                    deviceToken: res[0].deviceDetails.deviceToken
                                }
                            }
                            cb(null, {winner: winner, looser: looser})
                        } else {
                            let deviceToken = []
                            if (!!res[0].deviceDetails.deviceToken)
                                deviceToken.push(res[0].deviceDetails.deviceToken)
                            if (!!res[1].deviceDetails.deviceToken)
                                deviceToken.push(res[1].deviceDetails.deviceToken)
                            cb(null, deviceToken)
                        }

                    }
                })


            }],

            SEND_WINNER_PUSH: ['CHECK_CHALLENGE', 'GET_USERS', (previousResult, cb) => {
                if (previousResult.CHECK_CHALLENGE.isWon) {
                    let dataToSend = {
                        challengeId: obj._id,
                        message: ' You Won against ' + previousResult.GET_USERS.winner.name
                    }

                    if (previousResult.GET_USERS.winner.deviceToken)
                        sendPush([previousResult.GET_USERS.winner.deviceToken], dataToSend, cb)
                    else cb()
                } else
                    cb()

            }],
            SEND_LOOSER_PUSH: ['CHECK_CHALLENGE', 'GET_USERS', (previousResult, cb) => {
                if (previousResult.CHECK_CHALLENGE.isWon) {
                    let dataToSend = {
                        challengeId: obj._id,
                        message: 'You lost to ' + previousResult.GET_USERS.looser.name
                    }

                    if (previousResult.GET_USERS.looser.deviceToken)
                        sendPush([previousResult.GET_USERS.looser.deviceToken], dataToSend, cb)
                    else cb()
                } else
                    cb()

            }],
            SEND_EXPIRED_PUSH: ['CHECK_CHALLENGE', 'GET_USERS', (previousResult, cb) => {
                if (!previousResult.CHECK_CHALLENGE.isWon) {
                    let dataToSend = {
                        challengeId: obj._id,
                        message: 'Challenge Expired!'
                    }

                    if (previousResult.GET_USERS.length)
                        sendPush(previousResult.GET_USERS, dataToSend, cb)
                    else
                        cb()
                } else
                    cb()
            }],
        }, function (err, res) {
            eachCB()
        })

    }, function (err, res) {
        callback(null, challengeIds)
    })
}


/*-------------------------------------------------------------------------------
 * add admin defaults
 * -----------------------------------------------------------------------------*/
//     forgotPasswordLinkLifetime: 15,                                 // in minutes
//     faqLink: "https://www.google.com/",
//     termsAndConditionLink: "https://www.google.com/",
//     canTieUpWithinRadius : 1,
//     deleteTieupAfter : 1,
//     percentToAdmin : 30,
//     spotsWithinRadius : 5,
//     meetupsWithinRadius : 5,
//     tieupWithinRadius : 5,
//     dockWithinRadius : 5,
//     paymentAmountHoldBefore : 60,                                       // In Minutes
//     paymentAmountCaptureBefore : 10,                                    // In Minutes
//     contactDetails: {
//         "emailId": "support@tieup.com",
//         "countryCode": "+44",
//         "phoneNumber": "43534543543543",
//         "websiteLink": "https://www.google.com/"
//     }
// };
// DAO.count(Models.adminDefaults, {}, (err, count)=> {
//     if (err)  logger.error("err--->>>>", err);
//     else if (count > 0) logger.info("admin default already added");
//     else {
//         DAO.update(Models.adminDefaults, {}, adminDefaultsData, { lean: true, upsert: true }, (err, res) => {
//             logger.info("admin defaults-->>>>>", err, res)
//         });
//     }
// });
// let appVersionData1 = {
//     currentVersion: 100,
//     forceUpdate: 0,
//     currentCriticalVersion: 100,
//     type: Config.constants.DEVICE_TYPE.ANDROID,
//     appType: Config.constants.USER_TYPE.USER
// };
// DAO.count(Models.appVersion, { appType: Config.constants.USER_TYPE.USER, type: Config.constants.DEVICE_TYPE.ANDROID }, (err, count)=> {
//     if (err) logger.error("err in android app version--->>>>", err);
//     else if (count > 0) logger.info("app version already added for android");
//     else {
//         DAO.update(Models.appVersion, { appType: Config.constants.USER_TYPE.USER, type: Config.constants.DEVICE_TYPE.ANDROID },
//             { $setOnInsert: appVersionData1 }, { lean: true, upsert: true }, (err, res)=> {
//                 logger.info("app version data for android", res)
//         });
//     }
// });
// let appVersionData2 = {
//     currentVersion: 100,
//     forceUpdate: 0,
//     currentCriticalVersion: 100,
//     type: Config.constants.DEVICE_TYPE.IOS,
//     appType: Config.constants.USER_TYPE.USER
// };
// DAO.count(Models.appVersion, { appType: Config.constants.USER_TYPE.USER, type: Config.constants.DEVICE_TYPE.IOS }, (err, count)=> {
//     if (err) logger.error("err in IOS app version--->>>>", err);
//     else if (count > 0) logger.info("app version already added for IOS");
//     else {
//         DAO.update(Models.appVersion, { appType: Config.constants.USER_TYPE.USER, type: Config.constants.DEVICE_TYPE.IOS },
//             { $setOnInsert: appVersionData2 }, { lean: true, upsert: true }, (err, res)=> {
//                 logger.info("app version data for IOS", res)
//             });
//     }
// });

