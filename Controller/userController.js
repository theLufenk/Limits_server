
'use strict';
let async = require('async'),
    DAO = require('../DAOManager').queries,
    ERROR = require('../Config').responseMessages.ERROR,
    SUCCESS = require('../Config').responseMessages.SUCCESS,
    sendEmail = require('../Lib/notificationManager').sendEmailToUser,
    CONSTANTS = require('../Config').constants,
    CONFIG = require('../Config'),
    PUSH_MSG = require('../Config').pushMessages.PUSH_MSG,
    PUSH_FLAG = require('../Config').constants.PUSH_FLAG,
    Lib = require('../Lib'),
    moment = require('moment'),
    _ = require('underscore'),
    lodash = require('lodash'),
    tokenManager = require('../Lib').TokenManager,
    sendPush = require('../Lib/notificationManager').sendFCMPushNotification,
    util = require('../Utils').universalFunctions,
    mongoose = require('mongoose'),
    stripeManager = Lib.stripeManager,
    userPicFolder = require('../Config/s3BucketCredentials').folder.user,
    boatPicFolder = require('../Config/s3BucketCredentials').folder.boat,
    tieupPicFolder = require('../Config/s3BucketCredentials').folder.tieup,
    meetupPicFolder = require('../Config/s3BucketCredentials').folder.meetup,
    dockPicFolder = require('../Config/s3BucketCredentials').folder.dock,
    Models = require('../Models/'),
    request = require('request'),
    logger = require('log4js').getLogger('[User Controller]');

    
exports.registerUser = (payload, callbackRegister) => {
    var arr;
    if (payload.registeredBy == 2) {
        arr = {
            $or: [{socialId: payload.socialId},
                {email: payload.email},
                {phoneNumber: payload.phoneNumber}]
        }
    } else {
        arr = {
            $or: [
                {email: payload.email},
                {phoneNumber: payload.phoneNumber}]
        }
    }
    let userId = '',
        dataToUpdate = {
            /* profilePic: {
             original: "",
             thumbnail: ""
             }*/
        },
        dataToSet = {
            firstName: payload.firstName.replace(/\b./g, (a) => a.toUpperCase()),
            lastName: payload.lastName.replace(/\b./g, (a) => a.toUpperCase()),
            email: payload.email.toLowerCase(),
            countryCode: payload.countryCode,
            phoneNumber: payload.phoneNumber,
            registeredBy: payload.registeredBy,
            deviceDetails: {
                deviceType: payload.deviceType,
                deviceToken: payload.deviceToken
            },
            appVersion: payload.appVersion,
            registrationDate: new Date(),
            locationLongLat: {"type": "Point", "coordinates": [payload.longitude, payload.latitude]}

        };

    if (payload.socialId && payload.socialImageURL != null) {

        dataToSet.profilePic = {
            original: payload.socialImageURL,
            thumbnail: payload.socialImageURL
        };

        dataToUpdate.profilePic = {
            original: payload.socialImageURL,
            thumbnail: payload.socialImageURL
        };
    }


    async.auto({
        CHECK_FB_ID: function (callback) {

            var criteria = arr
            var projection = {};
            var option = {
                lean: true
            };
            DAO.getData(Models.user, criteria, projection, option, function (err, result) {
                if (err) {
                    cb(err)
                }
                else if (result.length) {

                    if (result[0].isBlocked == true)
                        callback(ERROR.USER_BLOCKED);
                    else {
                        callback(null, {result: result[0], response: 1});
                    }
                }
                else {
                    callback(null, {response: 0})

                }
            });

        },

        CHECK_REGISTER_WITH_SOCIAL_OR_EMAIL: (callback) => {
            if (payload.socialId) {
                dataToSet.socialId = payload.socialId;
                dataToSet.isVerified = true;
                callback()
            }
            else {
                util.cryptData(payload.password, (err, result) => {
                    if (err) callback(err);
                    else {
                        dataToSet.password = result;
                        callback()
                    }
                });
            }
        },
        CREATE_USER: ['CHECK_REGISTER_WITH_SOCIAL_OR_EMAIL', 'CHECK_FB_ID', (previousData, callback) => {
            console.log("................11111111111.................", previousData, arr)
            if (previousData.CHECK_FB_ID.response == 0) {

                DAO.saveData(Models.user, dataToSet, function (err, result1) {
                    console.log("................222222222222.................")
                    if (err) {
                        if (err.code == 11000 && err.message.indexOf('email_1') > -1) {
                            callback(ERROR.ALREADY_REGISTER);
                        }
                        else
                            callback(err)
                    }
                    else {
                        callback(null, result1);
                    }
                })
            }
            else {
                var criteria = {
                    _id: previousData.CHECK_FB_ID.result._id
                };
                DAO.findAndUpdate(Models.user, criteria, dataToSet, {lean: true, new: true}, function (err, data) {
                    console.log("................23333333333333333333333333.................")

                    if (err) {
                        if (err.code == 11000 && err.message.indexOf('socialId_1') > -1) callback(ERROR.ALREADY_REGISTER);
                        else if (err.code == 11000 && err.message.indexOf('email_1') > -1) callback(ERROR.USER_ALREADY_REGISTERED);
                        else if (err.code == 11000 && err.message.indexOf('phoneNumber_1') > -1) callback(ERROR.PHONE_NUMBER_ALREADY_EXISTS);
                        else callback(err);
                    } else {
                        userId = data._id;

                        callback(null, data);
                    }
                });
            }
            /*DAO.saveData(Models.user, dataToSet, (err, res) => {
             if (err) {
             if (err.code == 11000 && err.message.indexOf('socialId_1') > -1) callback(ERROR.ALREADY_REGISTER);
             else if (err.code == 11000 && err.message.indexOf('email_1') > -1) callback(ERROR.USER_ALREADY_REGISTERED);
             else if (err.code == 11000 && err.message.indexOf('phoneNumber_1') > -1) callback(ERROR.PHONE_NUMBER_ALREADY_EXISTS);
             else callback(err);
             }
             else {
             userId = res._id;
             dataToUpdate.accessToken = tokenManager.generateToken({
             _id: userId,
             timestamp: dataToSet.registrationDate,
             userType: CONSTANTS.USER_TYPE.USER
             });

             callback();
             }
             })*/
        }],
        UPDATE_DEVICE_ACCESS_TOKEN: ['CREATE_USER', (result, callback) => {
            if (!!payload.socialId) {
                dataToUpdate = {
                    accessToken: tokenManager.generateToken({
                        _id: result.CREATE_USER._id,
                        timestamp: dataToSet.registrationDate,
                        userType: CONSTANTS.USER_TYPE.USER
                    })
                }
                DAO.findAndUpdate(Models.user, {_id: result.CREATE_USER._id}, dataToUpdate, {lean: true}, callback)
            }
            else
                callback(null)
        }],
        SEND_EMAIL: ['CREATE_USER', (previousData, callback) => {
            if (payload.socialId) {
                callback();
            }
            else {
                sendEmail('VERIFICATION_EMAIL', {email: payload.email},
                    payload.email, CONSTANTS.EMAIL_SUBJECTS.EMAIL_VERIFICATION, callback);
            }

        }],

    }, (err, previousResult) => {
        if (err) {
            if (userId) {
                DAO.remove(Models.user, {_id: userId}, (error, result) => {
                    callbackRegister(err);
                });
            }
            else callbackRegister(err);
        }
        else {
            if (!!payload.socialId) {
                callbackRegister(null, {
                    message: "User Registered Successfully",
                    email: payload.email,
                    countryCode: payload.countryCode,
                    phoneNumber: payload.phoneNumber,
                    accessToken: dataToUpdate.accessToken,
                    isVerified: true,
                    firstName: previousResult.CREATE_USER.firstName,
                    lastName: previousResult.CREATE_USER.lastName,
                    profilePic: previousResult.CREATE_USER.profilePic,
                    coins: previousResult.CREATE_USER.coins,
                    height: previousResult.CREATE_USER.height,
                    weight: previousResult.CREATE_USER.weight,
                    registrationDate: previousResult.CREATE_USER.registrationDate,
                    age: previousResult.CREATE_USER.age,
                    allowNotifications: previousResult.CREATE_USER.allowNotifications,
                    accountState: previousResult.CREATE_USER.accountState,
                    deviceDetails: previousResult.CREATE_USER.deviceDetails,
                    registeredBy: previousResult.CREATE_USER.registeredBy,
                    locationLongLat: previousResult.CREATE_USER.locationLongLat,
                    isAnyUpdate: false,
                    isForceUpdate: false,
                    updateMessage: CONSTANTS.UPDATE_MSG.UPDATE_MSG
                });
            }
            else {
                callbackRegister(null, {
                    message: "User Registered Successfully",
                    email: payload.email,
                    countryCode: payload.countryCode,
                    phoneNumber: payload.phoneNumber,
                    isVerified: false
                });
            }
        }
    })
};
exports.add = (payload, callbackRegister) => {
  
        let dataToSet = {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email.toLowerCase(),
 
        };

        DAO.saveData(Models.sample, dataToSet, function (err, result1) {
            console.log("................222222222222.................")
            if (err) {
         
                callbackRegister(err)
            }
            else {
                callbackRegister(null, result1);
            }
        })


};

/*----------------------------------------------------------------------------------------------------\
 * Verify OTP
 * INPUT: email otp deviceType deviceToken appVersion latitude longitude
 * OUTPUT : Verify/ unverify user
 *-------------------------------------------------------------------------------------------------- */
exports.verifyUser = (payload, callbackRoute) => {
    let isAnyUpdate = false,
        isForceUpdate = false,
        dataToUpdate = {
            isVerified: true,
            // locationLongLat : {"type" : "Point", "coordinates" : [payload.longitude, payload.latitude]}
        };

    async.auto({

        CHECK_VALID_USER: [(callback) => {

            DAO.getData(Models.user, {$or: [{email: payload.emailPhoneNumber.toLowerCase()}]}, {
                isVerified: 1
            }, {lean: true}, (err, res) => {
                if (err) callback(err);
                else if (res.length == 0) callback(ERROR.INVALID_CREDENTIALS);
               // else if (res[0].accountState == CONSTANTS.ACCOUNT_STATUS.BLOCKED_BY_ADMIN) callback(ERROR.USER_BLOCKED);
                else if (res[0].isVerified) callback(ERROR.ALREADY_VERIFIED);
                else callback(null, res[0])
            })
        }]
    }, (err, finalResult) => {
        if (err) callbackRoute(err);
        else DAO.findAndUpdate(Models.user, {
                $or: [{email: payload.emailPhoneNumber.toLowerCase()}]
            },
            {$set: dataToUpdate},
            {lean: true, new: true}, (err, res) => {
                if (err) callbackRoute(err);
                else if (res) {
                    let dataToSend = {};

                    callbackRoute(null, {
                        // userDetails : dataToSend,
                        // // adminDefaults: finalResult.GET_ADMIN_DEFAULT[0],
                        // isAnyUpdate : isAnyUpdate,
                        // isForceUpdate: isForceUpdate,
                        // updateMessage : CONSTANTS.UPDATE_MSG.UPDATE_MSG
                    });
                }
                else callbackRoute(ERROR.INVALID_OTP)
            })
    })
};

/*----------------------------------------------------------------------------------------------------\
 * RESEND OTP
 * INPUT: emailPhoneNumber
 * OUTPUT : OTP send to mobile
 // *-------------------------------------------------------------------------------------------------- */
exports.resendOTP = (payload, callbackRoute) => {
    let callbackData = {},
        userId = "";

    async.waterfall([
        (callback) => {                       //check if invalid credentials or blocked

            let condition = {$or: [{email: payload.emailPhoneNumber.toLowerCase()}, {phoneNumber: payload.emailPhoneNumber}]};

            DAO.getData(Models.user, condition, {
                    _id: 1,
                    isVerified: 1,
                    accountState: 1,
                    countryCode: 1,
                    phoneNumber: 1
                },
                {lean: true, limit: 1}, (err, res) => {
                    if (err) callback(err);
                    else if (res.length == 0) callback(ERROR.INVALID_CREDENTIALS);
                    else if (res[0].accountState == CONSTANTS.ACCOUNT_STATUS.BLOCKED_BY_ADMIN) callback(ERROR.USER_BLOCKED);
                    else {
                        callbackData = res[0];
                        userId = res[0]._id;
                        callback(null);
                    }
                })
        },
        (callback) => {
            util.generateUniqueCode(4, CONSTANTS.USER_TYPE.USER, (err, numberObj) => {
                if (err) callback(err);
                else {
                    if (!numberObj || numberObj.number == null) callback();
                    else {
                        callbackData.OTPCode = numberObj.number;
                        callback(null, numberObj.number);
                    }
                }
            })
        },
        //(otp,callback)=>
        //{
        //    util.sendSMSToMobile(callbackData.countryCode,callbackData.phoneNumber,otp,(err,twillioResult)=>
        //    {
        //        if(err) callback(ERROR.ENTER_VALID_NUMBER);
        //        else callback(null,otp)
        //    })
        //},
        (otp, callback) => {
            DAO.update(Models.user, {_id: userId}, {OTPCode: otp}, {lean: true}, callback)
        }
    ], (err) => {
        if (err) callbackRoute(err);
        else callbackRoute(null, {userDetails: callbackData})
    })
};

/*-----------------------------------------------------------------------------------------------------------\
 * LOGIN USER
 * INPUT: loginBy emailPhoneNumber password socialId deviceType deviceToken appVersion latitude longitude
 * OUTPUT : login successfully
 *---------------------------------------------------------------------------------------------------------- */
exports.loginUser = (payload, callbackLogin) => {
    let dataToSend = {},
        isAnyUpdate = false,
        isForceUpdate = false,
        isSocialRegistered = false;
    async.auto({
        CHECK_APP_VERSION: (callback) => {
            util.checkAppVersion(payload.deviceType, "User", payload.appVersion, (err, result) => {
                if (err) callback(err);
                else if (result.length) {
                    isAnyUpdate = true;
                    if (result[0].forceUpdate) isForceUpdate = true;
                    callback(null)
                }
                else callback(null)
            })
        },
        CHECK_INVALID_BLOCK: ['CHECK_APP_VERSION', (result, callback) => {                       //check if invalid credentials or blocked

            let condition = {};

            if (payload.loginBy == "email") condition.$or = [{email: payload.emailPhoneNumber.toLowerCase()}, {phoneNumber: payload.emailPhoneNumber}];
            else condition = (!!payload.emailPhoneNumber) ? {$or: [{socialId: payload.socialId}, {email: payload.emailPhoneNumber.toLowerCase()}, {phoneNumber: payload.emailPhoneNumber}]} : {socialId: payload.socialId};

            DAO.getData(Models.user, condition, {}, {lean: true, limit: 1}, (err, res) => {
                console.log('new print', err, res, condition);
                if (err && payload.loginBy == "email") callback(err);
                else if (res.length == 0 && payload.loginBy == "email") callback(ERROR.INVALID_CREDENTIALS);
                else if (res.length == 0 && payload.loginBy == "social") callback(ERROR.NOT_REGISTERED_WITH_SOCIAL);
                else if (res[0].isBlocked) callbackLogin(ERROR.USER_BLOCKED);
                else if (res[0].isVerified == false) callbackLogin(null, res[0]);
                else {
                    if (payload.loginBy == "social")
                        isSocialRegistered = true

                    dataToSend = {
                        // DOB : res[0].DOB,
                        // withoutVessel : res[0].withoutVessel,
                        // profileMeter : res[0].profileMeter,
                        firstName: res[0].firstName,
                        // userBio : res[0].userBio,
                        lastName: res[0].lastName,
                        email: res[0].email.toLowerCase(),
                        countryCode: res[0].countryCode,
                        phoneNumber: res[0].phoneNumber,
                        profilePic: res[0].profilePic,
                        coins: res[0].coins,
                        height: res[0].height,
                        weight: res[0].weight,
                        registrationDate: res[0].registrationDate,
                        age: res[0].age,
                        allowNotifications: res[0].allowNotifications,
                        isVerified: res[0].isVerified,
                        accountState: res[0].accountState,
                        deviceDetails: res[0].deviceDetails,
                        registeredBy: res[0].registeredBy,
                        locationLongLat: res[0].locationLongLat,
                        // homeLake : res[0].homeLake,
                        // homeMarina : res[0].homeMarina,
                        // allowNotifications : res[0].allowNotifications,
                        // canPostMeetup : res[0].canPostMeetup,
                        // boatDetails : res[0].boatDetails
                        isAnyUpdate: isAnyUpdate,
                        isForceUpdate: isForceUpdate,
                        updateMessage: CONSTANTS.UPDATE_MSG.UPDATE_MSG
                    };
                    callback(null, res[0]);
                }
            })
        }],


        COMPARE_PASSWORD: ['CHECK_INVALID_BLOCK', (result, callback) => {
            if (payload.loginBy == "email") {
                util.compareCryptData(payload.password, result.CHECK_INVALID_BLOCK.password, (err, passwordMatch) => {
                    if (err) callback(err);
                    else {
                        if (passwordMatch == true) callback(null, {});
                        else callback(ERROR.WRONG_PASSWORD);
                    }
                })
            }
            else callback(null, {});
        }],
        UPDATE_DEVICE_ACCESS_TOKEN: ['CHECK_INVALID_BLOCK', 'COMPARE_PASSWORD', (result, callback) => {

            let dataToUpdate = {                        //update device details and access token
                deviceDetails: {
                    deviceToken: payload.deviceToken,
                    deviceType: payload.deviceType
                },
                appVersion: payload.appVersion,
                accessToken: tokenManager.generateToken({
                    _id: result.CHECK_INVALID_BLOCK._id,
                    timestamp: new Date(),
                    userType: CONSTANTS.USER_TYPE.USER
                }),
                locationLongLat: {"type": "Point", "coordinates": [payload.longitude, payload.latitude]}
            };
            dataToSend.accessToken = dataToUpdate.accessToken;

            if (payload.loginBy == "social" && !isSocialRegistered)
                dataToUpdate['socialId'] = payload.socialId

            DAO.update(Models.user, {_id: result.CHECK_INVALID_BLOCK._id}, dataToUpdate, {lean: true}, callback)
        }]
    }, (err, finalResult) => {
        if (err) callbackLogin(err);
        else callbackLogin(null, dataToSend)
    })
};

/*-----------------------------------------------------------------------------------------------------------\
 * refreshDeviceToken
 * INPUT: loginBy emailPhoneNumber password socialId deviceType deviceToken appVersion latitude longitude
 * OUTPUT : login successfully
 *---------------------------------------------------------------------------------------------------------- */
exports.refreshDeviceToken = (payloadData, authData, callbackLogin) => {


    async.auto({

        UPDATE_DEVICE_ACCESS_TOKEN: (callback) => {

            let dataToUpdate = {                        //update device details and access token
                deviceDetails: {
                    deviceToken: payloadData.deviceToken,
                    deviceType: payloadData.deviceType
                },
            };

            DAO.update(Models.user, {_id: authData._id}, dataToUpdate, {lean: true}, callback)
        }
    }, (err, finalResult) => {
        if (err) callbackLogin(err);
        else callbackLogin(null)
    })
};

/*----------------------------------------------------------------------------------------------------\
 * ACCESS TOKEN LOGIN
 * INPUT: deviceType deviceToken appVersion latitude longitude
 *-------------------------------------------------------------------------------------------------- */
exports.accessTokenLogin = (authData, payload, callbackRoute) => {
    let isAnyUpdate = false,
        isForceUpdate = false;

    let dataToSend = {
        DOB: authData.DOB,
        withoutVessel: authData.withoutVessel,
        profileMeter: authData.profileMeter,
        firstName: authData.firstName,
        userBio: authData.userBio,
        lastName: authData.lastName,
        email: authData.email.toLowerCase(),
        countryCode: authData.countryCode,
        phoneNumber: authData.phoneNumber,
        profilePic: authData.profilePic,
        homeLake: authData.homeLake,
        homeMarina: authData.homeMarina,
        allowNotifications: authData.allowNotifications,
        canPostMeetup: authData.canPostMeetup,
        boatDetails: authData.boatDetails,
        isVerified: authData.isVerified,
        accessToken: authData.accessToken
    };

    async.auto({
        CHECK_APP_VERSION: (callback) => {
            util.checkAppVersion(payload.deviceType, "User", payload.appVersion, (err, result) => {
                if (err) callback(err);
                else if (result.length) {
                    isAnyUpdate = true;
                    if (result[0].forceUpdate) isForceUpdate = true;
                    callback(null)
                }
                else callback(null)
            })
        },
        GET_ADMIN_DEFAULT: ['CHECK_APP_VERSION', (result, callback) => {
            DAO.getData(Models.adminDefaults, {}, {_id: 0, __v: 0, forgotPasswordLinkLifetime: 0}, {limit: 1}, callback)
        }],
        UPDATE_DEVICE_TOKEN: ['CHECK_APP_VERSION', (result, callback) => {       //update device details and access token
            let dataToUpdate = {
                deviceDetails: {
                    deviceToken: payload.deviceToken,
                    deviceType: payload.deviceType
                },
                appVersion: payload.appVersion,
                locationLongLat: {"type": "Point", "coordinates": [payload.longitude, payload.latitude]}
            };

            DAO.update(Models.user, {_id: authData._id}, dataToUpdate, {lean: true}, callback)
        }]
    }, (err, finalResult) => {
        if (err) callbackRoute(err);
        else {
            let condition = {
                email: {$ne: authData.email.toLowerCase()},
                'deviceDetails.deviceToken': payload.deviceToken
            };
            DAO.update(Models.user, condition, {$unset: {'deviceDetails.deviceToken': ""}}, {lean: true}, (err, result) => {
                if (err) callbackRoute(err);
                else callbackRoute(null, {
                    userDetails: dataToSend,
                    adminDefaults: finalResult.GET_ADMIN_DEFAULT[0],
                    isAnyUpdate: isAnyUpdate,
                    updateMessage: CONSTANTS.UPDATE_MSG.UPDATE_MSG,
                    isForceUpdate: isForceUpdate
                })
            });
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * LOGOUT PROFILE
 *-------------------------------------------------------------------------------------------------- */
exports.logout = (authData, callbackRoute) => {

    DAO.update(Models.user, {_id: authData._id}, {
            $unset: {
                accessToken: 1,
                'deviceDetails.deviceToken': 1
            }
        },
        {lean: true}, callbackRoute);
};

/*----------------------------------------------------------------------------------------------------\
 * CHANGE PASSWORD
 * INPUT: oldPassword newPassword
 *-------------------------------------------------------------------------------------------------- */
exports.changePassword = (authData, payload, callbackRoute) => {
    async.waterfall([
        (callback) => {
            DAO.getData(Models.user, {_id: authData._id}, {password: 1}, {lean: true}, callback)
        },
        (userData, callback) => {
            util.compareCryptData(payload.oldPassword, userData[0].password, (err, passwordMatchingResult) => {
                if (err) callback(err);
                else {
                    if (passwordMatchingResult) callback(null, userData);
                    else callback(ERROR.INCORRECT_OLD_PASSWORD);
                }
            })
        },
        (userData, callback) => {
            util.compareCryptData(payload.newPassword, userData[0].password, (err, passwordMatchingResult) => {
                if (err) callback(err);
                else {
                    if (passwordMatchingResult) callback(ERROR.SAME_NEW_PASSWORD_NOT_MATCH);
                    else util.cryptData(payload.newPassword, callback)
                }
            })
        },
        (result, callback) => {
            DAO.update(Models.user, {_id: authData._id}, {$set: {password: result}}, {lean: true}, callback)
        }], callbackRoute)
};

/*----------------------------------------------------------------------------------------------------\
 * FORGOT PASSWORD
 * INPUT: email
 * OUTPUT : email verification link send to registered email id
 *-------------------------------------------------------------------------------------------------- */
exports.forgotPassword = (payload, callbackRoute) => {
    let resetPassword = '',
        passwordResetToken = '';

    async.waterfall([
        (callback) => {
            DAO.getData(Models.user, {email: payload.email.toLowerCase()}, {
                _id: 1,
                email: 1,
                firstName: 1,
                lastName: 1,
                accountState: 1,
                isVerified: 1
            }, {lean: true}, (err, res) => {
                if (err) callback(err);
                else if (res.length == 0) callback(ERROR.INVALID_EMAIL);
                else if (res[0].accountState == CONSTANTS.ACCOUNT_STATUS.BLOCKED_BY_ADMIN) callback(ERROR.USER_BLOCKED);
                else callback(null, res[0]);
            })
        },
        (userData, callback) => {
            resetPassword = util.generateRandomString(20);
            passwordResetToken = util.cryptDataMd5(resetPassword);
            let dataToSet = {
                $set: {
                    passwordResetToken: passwordResetToken,
                    resetPasswordRequestedAt: new Date()
                }
            };
            DAO.update(Models.user, {_id: userData._id}, dataToSet, {lean: true}, (err, res) => {
                if (err) callback(err);
                callback(null, userData);
            })
        },
        (userData, callback) => {

            let link = CONSTANTS.FORGOT_PASSWORD_LINK.USER_LINK + passwordResetToken;

            let emailVariables = {
                userName: userData.firstName + " " + userData.lastName,
                link: link
            };
            sendEmail('FORGOT_PASSWORD', emailVariables, userData.email, CONSTANTS.EMAILS_SUBJECTS.FORGOT_PASSWORD, callback);
        }
    ], callbackRoute)
};

/*----------------------------------------------------------------------------------------------------\
 * VERIFY FORGOT PASSWORD LINK
 * INPUT: pwdTkn
 * OUTPUT : Verify token is correct or not
 *-------------------------------------------------------------------------------------------------- */
exports.verifyLink = (query, callbackRoute) => {
    async.waterfall([
        (callback) => {
            DAO.getData(Models.adminDetails, {}, {forgotPasswordLinkLifetime: 1}, {lean: true}, callback)
        },
        (forgotPasswordLinkLifetime, callback) => {
            let condition = {
                passwordResetToken: query.pwdTkn
            };
            DAO.getData(Models.user, condition, {}, {lean: true}, (err, res) => {
                if (err) callback(err);
                else if (res.length) callback(null, forgotPasswordLinkLifetime, res[0]);
                else callback(ERROR.EXPIRE_LINK);
            })
        },
        (forgotPasswordLinkLifetime, result, callback) => {
            let requestTime = result.resetPasswordRequestedAt;
            if (util.getRange(requestTime, new Date()) > forgotPasswordLinkLifetime[0].forgotPasswordLinkLifetime) callback(ERROR.EXPIRE_LINK);
            else callback(null, result)
        }
    ], callbackRoute)
};

/*----------------------------------------------------------------------------------------------------\
 * UPDATE FORGOTTEN PASSWORD
 * INPUT: token password
 * OUTPUT : update password successfully
 *---------------------------------------------------------------------------------------------------- */
exports.updatePassword = (payload, callbackRoute) => {
    async.waterfall([
        (callback) => {
            DAO.getData(Models.user, {passwordResetToken: payload.token}, {password: 1}, {lean: true}, (err, result) => {
                if (err) callback(err);
                else if (result.length) callback(null, result);
                else callback(ERROR.EXPIRE_LINK);
            })
        },
        (userData, callback) => {
            util.compareCryptData(payload.password, userData[0].password, (err, passwordMatchingResult) => {
                if (err) callback(err);
                else if (passwordMatchingResult) callback(ERROR.SAME_NEW_PASSWORD_NOT_MATCH);
                else callback(null, userData);
            })
        },
        (userData, callback) => {
            util.cryptData(payload.password, callback)
        }
    ], (err, password) => {
        if (err) callbackRoute(err);
        else DAO.update(Models.user, {passwordResetToken: payload.token}, {
            password: password, $unset: {
                passwordResetToken: 1
            }
        }, {lean: true}, callbackRoute)
    });
};

/*----------------------------------------------------------------------------------------------------\
 * GET PROFILE OF USER
 * INPUT: access token
 * OUTPUT : get profile                                                                                    |
 *-------------------------------------------------------------------------------------------------- */

exports.getProfile = (authData, callbackRoute) => {
    getProfileData(authData, callbackRoute)
};

function getProfileData(authData, callback) {
    DAO.getData(Models.user, {_id: authData._id}, {
        // withoutVessel : 1,
        firstName: 1,
        // profileMeter : 1,
        // userBio : 1,
        lastName: 1,
        // DOB : 1,
        email: 1,
        countryCode: 1,
        phoneNumber: 1,
        profilePic: 1,
        coins: 1,
        // homeLake : 1,
        // homeMarina : 1,
        // allowNotifications : 1,
        // canPostMeetup : 1,
        accessToken: 1,
        // appVersion : 1,
        // boatDetails : 1
        height: 1,
        weight: 1,
        age: 1,
        gender: 1,
        units: 1,
        registrationDate: 1,
        allowNotifications: 1,
        isVerified: 1,
        accountState: 1,
        deviceDetails: 1,
        registeredBy: 1,
        locationLongLat: 1,
        isAnyUpdate: 1,
        isForceUpdate: 1,
        // updateMessage : CONSTANTS.UPDATE_MSG.UPDATE_MSG
    }, {lean: true}, (err, res) => {
        if (err) callback(err);
        else callback(null, res[0])
    })
}

/*----------------------------------------------------------------------------------------------------\
 * EDIT PROFILE OF USER
 * INPUT: firstName lastName email homeMarina homeLake isFile profilePic boatImage boatName boatRegNum
 *        year size type bio tieUpPreference
 * OUTPUT : Profile Updated Successfully                                                                                        |
 *-------------------------------------------------------------------------------------------------- */

exports.editProfile = (authData, payloadData, callbackRoute) => {
    let dataToSet = {
        firstName: payloadData.firstName.replace(/\b./g, (a) => a.toUpperCase()),
        lastName: payloadData.lastName.replace(/\b./g, (a) => a.toUpperCase()),
        // email: payloadData.email.toLowerCase(),
        countryCode: payloadData.countryCode,
        phoneNumber: payloadData.phoneNumber,
        profilePic: payloadData.profilePic,

    };
    async.auto({
        // UPLOAD_PROFILE_PIC: (callback)=> {
        //     if (payloadData.isFile == true && payloadData.profilePic) {
        //         if (payloadData.profilePic && payloadData.profilePic.hapi.filename) {
        //             if (payloadData.profilePic.hapi.headers['content-type'].split("/")[0] === 'image') {
        //                 util.uploadProfilePicture(payloadData.profilePic, "user_" + payloadData.email, userPicFolder, (error, urls)=> {
        //                     dataToSet.profilePic = urls;
        //                     callback(error, urls)
        //                 });
        //             }
        //             else callback(ERROR.INVALID_IMAGE_FORMAT)
        //         }
        //         else callback(ERROR.NO_FILE);
        //     }
        //     else callback(null, {});
        // },
        UPDATE_USER_PROFILE: (callback) => {

            DAO.findAndUpdate(Models.user, {_id: authData._id}, dataToSet, {lean: true, new: true}, (err, res) => {
                if (err) {
                    if (err.code == 11000 && err.message.indexOf('socialId_1') > -1) callback(ERROR.ALREADY_REGISTER);
                    else if (err.code == 11000 && err.message.indexOf('email_1') > -1) callback(ERROR.USER_ALREADY_REGISTERED);
                    else if (err.code == 11000 && err.message.indexOf('phoneNumber_1') > -1) callback(ERROR.PHONE_NUMBER_ALREADY_EXISTS);
                    else callback(err);
                }
                else if (res) callback(null, res);
                else callback(ERROR.USER_NOT_FOUND)
            })
        }
    }, (err, finalResult) => {
        if (err) callbackRoute(err);
        else {
            let dataToSend = {
                firstName: finalResult.UPDATE_USER_PROFILE.firstName,
                // profileMeter : finalResult.UPDATE_USER_PROFILE.profileMeter,
                lastName: finalResult.UPDATE_USER_PROFILE.lastName,
                email: finalResult.UPDATE_USER_PROFILE.email.toLowerCase(),
                countryCode: finalResult.UPDATE_USER_PROFILE.countryCode,
                phoneNumber: finalResult.UPDATE_USER_PROFILE.phoneNumber,
                profilePic: finalResult.UPDATE_USER_PROFILE.profilePic,
                accessToken: finalResult.UPDATE_USER_PROFILE.accessToken,
                coins: finalResult.UPDATE_USER_PROFILE.coins,
                height: finalResult.UPDATE_USER_PROFILE.height,
                weight: finalResult.UPDATE_USER_PROFILE.weight,
                registrationDate: finalResult.UPDATE_USER_PROFILE.registrationDate,
                age: finalResult.UPDATE_USER_PROFILE.age,
                allowNotifications: finalResult.UPDATE_USER_PROFILE.allowNotifications,
                isVerified: finalResult.UPDATE_USER_PROFILE.isVerified,
                accountState: finalResult.UPDATE_USER_PROFILE.accountState,
                isAnyUpdate: finalResult.UPDATE_USER_PROFILE.isAnyUpdate,
                isForceUpdate: finalResult.UPDATE_USER_PROFILE.isForceUpdate,
                updateMessage: CONSTANTS.UPDATE_MSG.UPDATE_MSG
            };

            callbackRoute(null, dataToSend);
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Allow/Dis-allow notifiation
 *-------------------------------------------------------------------------------------------------- */
exports.allowNotification = (authData, payloadData, callback) => {
    DAO.update(Models.user, {_id: authData._id}, {allowNotifications: true}, {lean: true}, callback)
};

/*----------------------------------------------------------------------------------------------------\
 * ADD Friends
 *-------------------------------------------------------------------------------------------------- */
exports.addFriends = (authData, payloadData, callbackRoute) => {
    let finalRes = [];
    async.auto({
        GET_ALREADY_FRIENDS: (callback) => {
            DAO.distinct(Models.userFriends, 'friendId', {userId: authData._id}, callback)
        },
        GET_USER: ['GET_ALREADY_FRIENDS', (prevResult, callback) => {
            console.log(".......................", prevResult.GET_ALREADY_FRIENDS)
            DAO.getData(Models.user, {
                    socialId: {$in: payloadData.friends},
                    _id: {$nin: prevResult.GET_ALREADY_FRIENDS}
                }, {_id: 1}
                , {lean: true}, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbb', res)
                        if (res.length) {

                            res.map((obj) => {
                                finalRes.push({
                                    friendId: obj._id,
                                    userId: authData._id,
                                    isChallenged: false,
                                    isDeleted: false,
                                    createdOn: Date.now()
                                })
                            })
                            //  finalRes = res.map((item)=>{return {friendId : item._id, userId : authData._id}})
                            //   console.log("userId....8888888989898.......", finalRes);
                            callback(null)
                        } else {

                            callback(null);
                        }
                    }
                })
        }],

        //         let dataToSet = {
        //     userId : authData._id,
        //     friendId : payloadData.friends,
        // };
        GET_COUNT: ['GET_USER', (previousResult, callback) => {
            if (finalRes.length) {
                DAO.insertMany(Models.userFriends, finalRes, {}, (err, result) => {
                    if (err)
                        callback(err)
                    else {
                        console.log('rrrrrrrrr', result)
                        callback(null)
                    }
                })
            } else {
                callback(null)
            }

        }]
    }, (err, result) => {
        if (err)
            callbackRoute(err)
        else callbackRoute(null)
    })


};
/*----------------------------------------------------------------------------------------------------\
 * GET my friends
 * INPUT: limit skip
 *-------------------------------------------------------------------------------------------------- */
exports.getMyFriends = (authData, queryData, callbackRoute) => {
    let finalRes = [];

    async.auto({
        GET_FRIENDS_IDS: (callback) => {
            let populate = [
                {
                    path: 'friendId',
                    match: {},
                    select: "firstName lastName profilePic coins ",
                    options: {}
                },

            ]
            DAO.populateData(Models.userFriends, {userId: authData._id,}, {friendId: 1, isChallenged: 1}
                , {lean: true}, populate, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('assdsada', res)

                        if (res.length) {
                            finalRes = res
                            //   res.map((obj)=>{
                            //             finalRes.push(obj.friendId)
                            //         })
                            console.log("userId....8888888989898.......", res);
                            callback(null)
                        } else {

                            callback();
                        }
                    }
                })
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null, finalRes)

    })
};
/*----------------------------------------------------------------------------------------------------\
 * GET my routes
 *
 * olds response
 * {
 "statusCode": 200,
 "message": "Success",
 "data": {
 "count": 0,
 "routes": [
 {
 "_id": "5a1f9735a54ebc243cf19dfa",
 "route": [],
 "routeName": "",
 "startedAt": "2017-11-29T12:34:52.106Z"
 },
 {
 "_id": "5a1f97b0a54ebc243cf19dfb",
 "route": [],
 "routeName": "",
 "startedAt": "2017-11-29T12:34:52.106Z"
 },
 ]
 }
 }
 *
 *-------------------------------------------------------------------------------------------------- */
exports.getMyRoutes = (authData, queryData, callbackRoute) => {

    async.auto({


        GET_DETAILS: (callback) => {
            let match = {
                routesCaptured: true,
                userID: authData._id,
                routeName: {$ne: ""}
            }
            if (!!queryData.workoutId)
                match["workoutId"] = mongoose.Types.ObjectId(queryData.workoutId)

            let aggregateArray = [
                {$match: match},
                {
                    $group: {
                        _id: {
                            routeName: '$routeName',
                        },
                        date: {$max: "$startedAt"},
                        route: {$max: '$route'}
                    },

                },
                {
                    $facet: {
                        data: [
                            {$sort: {date: -1}},
                            {$skip: queryData.skip},
                            {$limit: queryData.limit},
                            {
                                $project: {
                                    routeName: "$_id.routeName",
                                    startedAt: "$date",
                                    route: 1,
                                    _id: 0
                                }
                            }
                        ],
                        count: [
                            {$count: "count"}
                        ],
                    }
                },


            ];

            DAO.aggregateData(Models.userWorkouts, aggregateArray, callback)
            /*let query = {
             routesCaptured: true,
             userID: authData._id,
             workoutId: queryData.workoutId
             };

             DAO.getData(Models.userWorkouts, query, {routeName: 1, startedAt: 1, route: 1}
             , {lean: true}, (err, res) => {
             if (err) {
             callback(err);
             } else {
             finalRes = res
             console.log(finalRes);
             callback(null)
             }
             })*/
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            let count = res.GET_DETAILS[0].data.length == 0 ? 0 : res.GET_DETAILS[0].count[0].count
            callbackRoute(null,
                {
                    count: count,
                    routes: res.GET_DETAILS[0].data

                })
        }
    })
};


/*----------------------------------------------------------------------------------------------------\
 * GET User Stats
 *
 *
 *-------------------------------------------------------------------------------------------------- */
exports.getUserStats = (authData, queryData, callbackRoute) => {

    async.auto({


        GET_DETAILS: (callback) => {
            let start = queryData.startDate.split("/");
            let end = queryData.endDate.split("/");
            let startDate = new Date(Date.UTC(start[2], start[0] - 1, start[1], 0, 0, 0)),
                endDate = new Date(Date.UTC(end[2], end[0] - 1, end[1], 23, 59, 59))
            let match = {
                userID: authData._id,
                routesCaptured: true,
                $and: [{startedAt: {$gte: startDate}}, {startedAt: {$lte: endDate}}]
            }


            let aggregateArray = [
                {$match: match},
                {
                    $facet: {
                        data: [
                            {
                                $group: {
                                    _id: "$workoutId",
                                    distanceTravelled: {$sum: "$distanceTravelled"},
                                    durationTravelled: {$sum: "$durationTravelled"},
                                }
                            },
                            {
                                $lookup: {
                                    from: 'workouts',
                                    localField: '_id',
                                    foreignField: '_id',
                                    as: 'workoutData'
                                }
                            },
                            {$unwind: "$workoutData"}

                        ],
                        caloriesBurnt: [
                            {
                                $group: {
                                    _id: null,
                                    caloriesBurnt: {$sum: "$caloriesBurnt"}

                                }
                            }
                        ],
                    }
                }


            ];

            DAO.aggregateData(Models.userWorkouts, aggregateArray, function (err, result) {
                if (err)
                    callback(err)
                else {
                    if (result[0].data.length) {
                        async.each(result[0].data, function (obj, cb1) {
                            obj.distanceTravelled = formatDistance(obj.distanceTravelled)
                            obj.durationTravelled = formatTime(obj.durationTravelled)

                            cb1()
                        }, function (err, res) {
                            callback(null, result)
                        })
                    } else {
                        callback(null, result)
                    }
                }
            })
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            let calorieText = res.GET_DETAILS[0].data.length == 0 ? '0 cal' : formatCalories(res.GET_DETAILS[0].caloriesBurnt[0].caloriesBurnt)
            let calorieValue = res.GET_DETAILS[0].data.length == 0 ? 0 : res.GET_DETAILS[0].caloriesBurnt[0].caloriesBurnt

            callbackRoute(null, {
                workouts: res.GET_DETAILS[0].data,
                totalCalories:  calorieText,
                caloriesValue:  calorieValue
            })
        }
    })
};

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

// in hh:mm:ss time
function formatTime(durationTravelled) {
    let hours = Math.floor(durationTravelled / 3600);
    let remainder = durationTravelled - (hours * 3600);
    let mins = Math.floor(remainder / 60);
    remainder = remainder - (mins * 60);
    let secs = remainder;
    return (padDigits(Math.floor(hours), 2) + ":" + padDigits(Math.floor(mins), 2) + ":" + padDigits(Math.floor(secs), 2))
}

// in miles string
function formatDistance(distanceTravelled) {

    return ((distanceTravelled * 0.000621371).toFixed(2) + " miles")
}


// cal or K
function formatCalories(caloriesBurnt) {
    return (caloriesBurnt > 1000) ? (caloriesBurnt / 1000).toFixed(2) + ' K' : (caloriesBurnt / 1).toFixed(2) + ' cal'
}

// cal or K
function formatSpeed(speed) {
    return speed + ' m/s'
}

/*----------------------------------------------------------------------------------------------------\
 * get workout list by route name
 * INPUT: route name limit skip
 *-------------------------------------------------------------------------------------------------- */

exports.getWorkoutsByRouteName = (authData, queryData, callbackRoute) => {
    async.auto({
        GET_WORKOUT_DETAIL: (callback) => {

            !!queryData.id ? DAO.getData(Models.userWorkouts, {_id: queryData.id}, {}, {}, callback) : callback(null)

        },

        GET_COUNT: ["GET_WORKOUT_DETAIL", (prevResult, callback) => {

            let criteria = {
                routeName: queryData.routeName,
                userID: authData._id,
                routesCaptured: true
            }

            if (!!queryData.id) {
                criteria["workoutId"] = prevResult.GET_WORKOUT_DETAIL[0].workoutId

                if (!!queryData.restRate)
                    criteria["restRate"] = prevResult.GET_WORKOUT_DETAIL[0].restRate
                if (!!queryData.eatRate)
                    criteria["eatRate"] = prevResult.GET_WORKOUT_DETAIL[0].eatRate
                if (!!queryData.sleepRate)
                    criteria["sleepRate"] = prevResult.GET_WORKOUT_DETAIL[0].sleepRate
                if (!!queryData.feelRate)
                    criteria["feelRate"] = prevResult.GET_WORKOUT_DETAIL[0].feelRate
            }

            DAO.count(Models.userWorkouts, criteria, callback)

        }],
        GET_DETAILS: ["GET_WORKOUT_DETAIL", (prevResult, callback) => {
            let criteria = {
                routeName: queryData.routeName,
                userID: authData._id,
                routesCaptured: true
            }
            let projection = {
                distanceTravelled: 1,
                heartRate: 1,
                caloriesBurnt: 1,
                startedAt: 1
            }
            let options = {
                lean: true,
                sort: {startedAt: -1},
                skip: queryData.skip,
                limit: queryData.limit
            }

            if (!!queryData.id) {
                criteria["workoutId"] = prevResult.GET_WORKOUT_DETAIL[0].workoutId

                if (!!queryData.restRate)
                    criteria["restRate"] = prevResult.GET_WORKOUT_DETAIL[0].restRate
                if (!!queryData.eatRate)
                    criteria["eatRate"] = prevResult.GET_WORKOUT_DETAIL[0].eatRate
                if (!!queryData.sleepRate)
                    criteria["sleepRate"] = prevResult.GET_WORKOUT_DETAIL[0].sleepRate
                if (!!queryData.feelRate)
                    criteria["feelRate"] = prevResult.GET_WORKOUT_DETAIL[0].feelRate
            }

            let populatearray = [
                {
                    path: 'workoutId',
                    select: 'workoutImage workoutName color',
                    model: 'workouts'
                }
            ]

            DAO.populateData(Models.userWorkouts, criteria, projection, options, populatearray, function (err, res) {
                if (err)
                    callback(err)
                else {
                    if (res.length) {
                        async.each(res, function (obj, cb) {
                            obj.durationTravelled = formatTime(obj.durationTravelled)
                            obj.distanceTravelled = formatDistance(obj.distanceTravelled)
                            obj.caloriesBurnt = formatCalories(obj.caloriesBurnt)
                            cb()
                        }, function (err, result) {
                            callback(null, res)
                        })
                    } else
                        callback(null, res)
                }

            })
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null,
                {
                    count: res.GET_COUNT,
                    workouts: res.GET_DETAILS

                })
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * get workout list history
 * INPUT: date limit skip
 *-------------------------------------------------------------------------------------------------- */

exports.getUserWorkoutHistory = (authData, queryData, callbackRoute) => {
    let y = queryData.date.split('/');
    let start = new Date(Date.UTC(y[2], y[0] - 1, y[1], 0, 0, 0)),
        end = new Date(Date.UTC(y[2], y[0] - 1, y[1], 23, 59, 59))
    async.auto({
        GET_COUNT: (callback) => {

            let criteria = {
                userID: authData._id,
                routesCaptured: true,
                $and: [{startedAt: {$lte: end}}, {startedAt: {$gte: start}}]
            }

            /* if (!!queryData.routeName)
             criteria["workoutId"] = prevResult.GET_WORKOUT_DETAIL[0].workoutId
             */

            DAO.count(Models.userWorkouts, criteria, callback)

        },
        GET_DETAILS: (callback) => {
            let criteria = {
                userID: authData._id,
                routesCaptured: true,
                $and: [{startedAt: {$lte: end}}, {startedAt: {$gte: start}}]

            }
            let projection = {
                distanceTravelled: 1,
                heartRate: 1,
                caloriesBurnt: 1,
                startedAt: 1
            }
            let options = {
                lean: true,
                sort: {startedAt: -1},
                skip: queryData.skip,
                limit: queryData.limit
            }

            /*if (!!queryData.routeName) {
             criteria["routeName"] = prevResult.GET_WORKOUT_DETAIL[0].workoutId
             }*/

            let populatearray = [
                {
                    path: 'workoutId',
                    select: 'workoutImage workoutName color',
                    model: 'workouts'
                }
            ]

            DAO.populateData(Models.userWorkouts, criteria, projection, options, populatearray, function (err, result) {
                if (result.length) {
                    async.each(result, function (obj, cb) {
                        //obj.durationTravelled = formatTime(obj.durationTravelled)
                        obj.distanceTravelled = formatDistance(obj.distanceTravelled)
                        obj.caloriesBurnt = formatCalories(obj.caloriesBurnt)
                        obj.speed = formatSpeed(obj.speed)

                        cb()
                    }, function (err, res) {
                        callback(null, result)
                    })
                } else
                    callback(null, result)
            })
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null,
                {
                    count: res.GET_COUNT,
                    workouts: res.GET_DETAILS

                })
        }
    })
};


/*----------------------------------------------------------------------------------------------------\
 * get leader board users
 * INPUT: date limit skip
 *-------------------------------------------------------------------------------------------------- */

exports.getLeaderBoards = (authData, queryData, callbackRoute) => {

    async.auto({

        GET_DETAILS: (callback) => {
            let aggregateArray = [
                {$match: {routesCaptured: true}},
                {
                    $group: {
                        "_id": "$userID",
                        caloriesBurnt: {$sum: "$caloriesBurnt"},
                    }
                },
                {$sort: {caloriesBurnt: -1}},
                {$limit: 20},
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'userData'
                    }
                },
                {$unwind: "$userData"},
                {
                    $project: {
                        "userData.firstName": 1,
                        "userData.lastName": 1,
                        "userData.profilePic": 1,
                        caloriesBurnt: 1,

                    }
                }
            ]
            DAO.aggregateData(Models.userWorkouts, aggregateArray, function (err, res) {
                res.map((work) => {
                    work.caloriesBurnt = formatCalories(work.caloriesBurnt)
                })
                callback(null, res)
            })
        },
        GET_WORKOUTS: function (cb) {
            Models.workouts.aggregate([
                {
                    $graphLookup: {
                        from: "userworkouts",
                        startWith: "$_id",
                        connectFromField: "_id",
                        connectToField: "workoutId",
                        as: "data",
                        restrictSearchWithMatch: {"userID": mongoose.Types.ObjectId(authData._id)}
                    }
                }
            ], function (err, res) {
                let finalRes = [];
                res.map((work) => {
                    let time = 0

                    work.data.map((obj) => {
                        if (obj.durationTravelled)
                            time = time + obj.durationTravelled

                    })
                    work.durationTravelled = formatTime(time)
                    delete  work.data
                    finalRes.push(work)

                })
                cb(null, finalRes)
            })
        },
        GET_USER_STATS: function (cb) {
            let aggregateArray = [
                {
                    $match: {
                        routesCaptured: true,
                        userID: mongoose.Types.ObjectId(authData._id)
                    }
                },
                {
                    $group: {
                        _id: null,
                        heartRate: {$sum: "$heartRate"},
                        caloriesBurnt: {$sum: "$caloriesBurnt"},
                        stepsTaken: {$sum: "$stepsTaken"}
                    }
                }
            ]
            DAO.aggregateData(Models.userWorkouts, aggregateArray, cb)
        },
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            // console.log("....................",res.GET_USER_STATS[0],res.GET_USER_STATS,!!res.GET_USER_STATS[0])
            if (!!res.GET_USER_STATS[0])
                res.GET_USER_STATS[0].caloriesBurnt = formatCalories(res.GET_USER_STATS[0].caloriesBurnt)
            else {
                res.GET_USER_STATS = {
                    _id: null,
                    heartRate: 0,
                    caloriesBurnt: '0 cal',
                    stepsTaken: 0
                }
            }

            callbackRoute(null,
                {
                    users: res.GET_DETAILS,
                    workouts: res.GET_WORKOUTS,
                    stats: res.GET_USER_STATS[0]
                })
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * get workout list history
 * INPUT: date limit skip
 *-------------------------------------------------------------------------------------------------- */

exports.getUserWorkoutDetails = (authData, queryData, callbackRoute) => {

    async.auto({

        GET_DETAILS: (callback) => {
            let criteria = {
                userID: authData._id,
                _id: queryData.id
            }
            let projection = {
                createdOn: 0,
                routesCaptured: 0,
                isDeleted: 0,
                startedAt: 0
            }
            let options = {
                lean: true,
                sort: {startedAt: -1},
            }

            /*if (!!queryData.routeName) {
             criteria["routeName"] = prevResult.GET_WORKOUT_DETAIL[0].workoutId
             }*/

            let populatearray = [
                {
                    path: 'workoutId',
                    select: 'workoutImage workoutName color',
                    model: 'workouts'
                }
            ]

            DAO.populateData(Models.userWorkouts, criteria, projection, options, populatearray, function (err, res) {
                console.log("...........", res)
                if (err)
                    callback(err)
                else {
                    res[0].distanceTravelled = formatDistance(res[0].distanceTravelled)
                    res[0].durationTravelled = formatTime(res[0].durationTravelled)
                    res[0].caloriesBurnt = formatCalories(res[0].caloriesBurnt)
                    res[0].speed = formatSpeed(res[0].speed)
                    //console.log("...........", res[0].caloriesBurnt, res[0].durationTravelled, res[0].distanceTravelled, formatCalories(res[0].caloriesBurnt), formatTime(res[0].durationTravelled))
                    callback(null, res)
                }
            })
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null, {detail: res.GET_DETAILS[0]})
        }
    })
};


/*----------------------------------------------------------------------------------------------------\
 * Start workouts list
 * INPUT: limit skip
 *-------------------------------------------------------------------------------------------------- */
exports.getWorkoutsToStart = (authData, queryData, callbackRoute) => {
    let finalRes = [];

    async.auto({
        getWorkout: function (cb) {
            Models.workouts.aggregate([
                {$match: {isBlocked: false}},
                {
                    $graphLookup: {
                        from: "userworkouts",
                        startWith: "$_id",
                        connectFromField: "_id",
                        connectToField: "workoutId",
                        as: "data",
                        restrictSearchWithMatch: {"userID": mongoose.Types.ObjectId(authData._id)}
                    }
                }
            ], function (err, res) {
                //console.log("...............", res)
                res.map((work) => {
                    let travel = 0, caloriesBurnt = 0

                    work.data.map((obj) => {
                        if (obj.distanceTravelled)
                            travel = travel + obj.distanceTravelled

                        if (obj.caloriesBurnt)
                            caloriesBurnt = caloriesBurnt + obj.caloriesBurnt
                    })
                    work.caloriesBurnt = formatCalories(caloriesBurnt)
                    work.totalTravel = formatDistance(travel)
                    delete  work.data
                    finalRes.push(work)

                })

                cb()
            })
        },
        // GET_WORKOUTS_IDS : (callback)=>{
        //     let populate = [
        //     {
        //         path: 'userId',
        //         match: {},
        //         select: "caloriesBurnt",
        //         options: {}
        //     },

        // ]
        //     DAO.populateData(Models.userWorkouts, {userId: authData._id},{workoutName:1}
        //     , {lean: true},populate,(err, res)=>{
        //          if (err) {
        //             callback(err);
        //         } else {
        //             console.log('assdsada',res)

        //             if (res.length) {
        //                 finalRes=res
        //         //   res.map((obj)=>{
        //         //             finalRes.push(obj.friendId)
        //         //         })
        //                 console.log("userId....8888888989898.......",res);
        //                 callback(null)
        //             } else {

        //                 callback();
        //             }
        //         }
        //     })
        // }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null, finalRes)

    })
};

/*----------------------------------------------------------------------------------------------------\
 * workout list
 * INPUT:
 *-------------------------------------------------------------------------------------------------- */
exports.workoutsListing = (authData, queryData, callbackRoute) => {
    DAO.getData(Models.workouts, {isBlocked: false}, {_id: 1, workoutName: 1, workoutImage: 1},
        {lean: true}, (err, res) => {
            if (err) callbackRoute(err);
            else if (res.length > 0) callbackRoute(null, res);
            else callbackRoute(ERROR.WORKOUT_NOT_EXIST);
        })
};

/*----------------------------------------------------------------------------------------------------\
 * Goals Listing
 * INPUT:
 *-------------------------------------------------------------------------------------------------- */
exports.getGoalsListing = (authData, queryData, callbackRoute) => {
    let finalRes = [];

    async.auto({
        GET_WORKOUT_IDS: (callback) => {
            let populate = [
                {
                    path: 'workoutId',
                    match: {},
                    select: "workoutName workoutImage",
                    options: {}
                },

            ]
            DAO.populateData(Models.userGoals, {userId: authData._id,}, {
                    workoutId: 1,
                    day: 1,
                    target: 1,
                    isCompleted: 1,
                    typeOfGoal: 1
                }
                , {lean: true, sort: {createdOn: -1}}, populate, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        //   console.log('assdsada', res)

                        if (res.length) {
                            finalRes = res
                            //   res.map((obj)=>{
                            //             finalRes.push(obj.friendId)
                            //         })
                            callback(null)
                        } else {

                            callback();
                        }
                    }
                })
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null, finalRes)

    })
};

/*----------------------------------------------------------------------------------------------------\
 * Feelings List
 * INPUT:
 *-------------------------------------------------------------------------------------------------- */
exports.feelingsListing = (authData, queryData, callbackRoute) => {
    var restfeelings;
    var eatfeelings;
    var feelings;
    var sleepfeelings;
    var postfeelings;

    async.auto({
        GET_REST_FEELINGS: (callback) => {
            DAO.getData(Models.restFeelings, {}, {name: 1, value: 1, createdOn: 1}
                , {lean: true}, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('assdsada', res)

                        if (res.length) {
                            restfeelings = res
                            callback(null)
                        } else {

                            callback();
                        }
                    }
                })
        },
        GET_EAT_FEELINGS: ['GET_REST_FEELINGS', (previousData, callback) => {
            DAO.getData(Models.eatFeeling, {}, {name: 1, value: 1, createdOn: 1}
                , {lean: true}, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('assdsada', res)

                        if (res.length) {
                            eatfeelings = res
                            callback(null)
                        } else {

                            callback();
                        }
                    }
                })
        }],
        GET_FEELINGS: ['GET_REST_FEELINGS', 'GET_EAT_FEELINGS', (previousData, callback) => {
            DAO.getData(Models.feelings, {}, {name: 1, value: 1, createdOn: 1}
                , {lean: true}, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('assdsada', res)

                        if (res.length) {
                            feelings = res
                            callback(null)
                        } else {

                            callback();
                        }
                    }
                })
        }],
        GET_SLEEP_FEELINGS: ['GET_REST_FEELINGS', 'GET_EAT_FEELINGS', 'GET_FEELINGS', (previousData, callback) => {
            DAO.getData(Models.sleepFeelings, {}, {name: 1, value: 1, createdOn: 1}
                , {lean: true}, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('assdsada', res)

                        if (res.length) {
                            sleepfeelings = res
                            callback(null)
                        } else {

                            callback();
                        }
                    }
                })
        }],
        GET_POST_FEELINGS: ['GET_REST_FEELINGS', 'GET_EAT_FEELINGS', 'GET_FEELINGS', 'GET_SLEEP_FEELINGS', (previousData, callback) => {
            DAO.getData(Models.postFeelings, {}, {name: 1, value: 1, createdOn: 1}
                , {lean: true}, (err, res) => {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('assdsada', res)

                        if (res.length) {
                            postfeelings = res
                            callback(null)
                        } else {

                            callback();
                        }
                    }
                })
        }]

    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null, {
            restFeelings: restfeelings,
            eatFeelings: eatfeelings,
            feelings: feelings,
            sleepFeelings: sleepfeelings,
            postFeelings: sleepfeelings

        })

    })
};

/*----------------------------------------------------------------------------------------------------\
 * ADD Workout Details
 *-------------------------------------------------------------------------------------------------- */
exports.addWorkoutDetails = (authData, payloadData, callbackRoute) => {
    async.auto({

        GET_WORKOUT: (callback) => {
            if (payloadData.flag == "START" && payloadData.isGhostRun == true)
                if (!!payloadData.ghostWorkoutId) {
                    DAO.getData(Models.userWorkouts, {_id: payloadData.ghostWorkoutId}, {route: 1}, {}, (err, res) => {
                        if (err)
                            callback(err)
                        else
                            callback(null, res[0])
                    })
                } else {
                    callback(ERROR.WORKOUT_MISSING)

                }
            else if (payloadData.flag == "BEFORE_START" && payloadData.isChallenged == true) {
                if (!!payloadData.challengeId) {
                    let projection = {
                        type: 1,
                        userWorkoutId: 1
                    }
                    let populateArray = [
                        {
                            path: 'userWorkoutId',
                            match: {},
                            model: "userWorkouts",
                            select: "distanceTravelled durationTravelled route",
                            options: {}
                        },
                    ]
                    DAO.populateData(Models.challenges, {_id: payloadData.challengeId}, projection, {}, populateArray, (err, res) => {
                        if (err)
                            callback(err)
                        else
                            callback(null, res[0])
                    })
                } else {
                    callback(ERROR.CHALLENGE_MISSING)

                }
            }
            else
                callback(null)

        },

        ADD_WORKOUT: (callback) => {
            let query = {};

            if (!!payloadData.selectedWorkoutId) {
                query = {
                    _id: payloadData.selectedWorkoutId,
                    isDeleted: false
                }
            }
            ;
            let dataToSet = {};

            switch (payloadData.flag) {
                case "BEFORE_START" :
                    dataToSet = {
                        userID: authData._id,
                        workoutId: payloadData.workoutId,
                        restRate: payloadData.restRate,
                        restText: payloadData.restText,
                        eatRate: payloadData.eatRate,
                        eatText: payloadData.eatText,
                        feelRate: payloadData.feelRate,
                        feelText: payloadData.feelText,
                        sleepRate: payloadData.sleepRate,
                        sleepText: payloadData.sleepText,
                        preNote: payloadData.preNote
                    }
                    if (!!payloadData.isChallenged) {
                        dataToSet["isChallenged"] = true
                        dataToSet["challengeId"] = payloadData.challengeId
                        if (!!payloadData.challengedWorkoutId)
                            dataToSet["challengedWorkoutId"] = payloadData.challengedWorkoutId

                    }
                    break;

                case "START" :
                    dataToSet = {
                        startedAt: new Date(),
                    }
                    if (payloadData.routeName) {
                        dataToSet["routeName"] = payloadData.routeName
                        dataToSet["newRoute"] = false
                    }
                    break;

                case "STOP" :
                    dataToSet = {
                        distanceTravelled: payloadData.distanceTravelled,
                        durationTravelled: payloadData.durationTravelled,
                        stepsTaken: payloadData.stepsTaken,
                        caloriesBurnt: payloadData.caloriesBurnt,
                        heartRate: payloadData.heartRate,
                        speed: payloadData.speed,
                        endAt: payloadData.endAt,
                        route: payloadData.route,
                        routesCaptured: true
                    }
                    break;

                case "AFTER_STOP" :
                    dataToSet = {
                        percievedEffort: payloadData.percievedEffort,
                        percievedEffortText: payloadData.percievedEffortText,
                        postNote: payloadData.postNote,
                    }
                    break;

                case "SAVE_ROUTE" :
                    dataToSet = {
                        routeName: payloadData.routeName,
                        newRoute: true,
                        routesCaptured: true                 // if true can be shown to user else userWorkout will not be shown
                    }
                    break;
            }


            if (util.isEmpty(query)) DAO.saveData(Models.userWorkouts, dataToSet, (err, res) => {
                if (err) callback(err);
                else  callback(null, {
                    _id: res._id,
                    workoutName: payloadData.workoutName,
                    workoutId: payloadData.workoutId,
                });
            });
            else DAO.findAndUpdate(Models.userWorkouts, query, dataToSet, {lean: true, new: true}, (err, res) => {

                if (err) callback(err);
                else if (res) callback(null, res);
                else callback(ERROR.WORKOUT_NOT_EXIST);
            });

        },

        // updates challenges if I challenged my friend without starting workout so routeCaptured is set to true and challenges are made valid
        UPDATE_CHALLENGES: ['ADD_WORKOUT', (prevResult, callback) => {
            if (payloadData.flag == "STOP") {
                let criteria = {
                    userWorkoutId: prevResult.ADD_WORKOUT._id,
                    challengedBy: authData._id,
                    isValid: false
                }
                let dataToUpdate = {
                    isValid: true,
                    targetTime: payloadData.durationTravelled,
                    targetDistance: payloadData.distanceTravelled,
                    challengedByTime: payloadData.durationTravelled,
                    challengedByDistance: payloadData.distanceTravelled,
                    ischallengedByCompleted: true
                }
                let options = {multi: true}
                DAO.update(Models.challenges, criteria, dataToUpdate, options, callback)
            }
            else
                callback(null)
        }],

        GET_CHALLENGES: ['ADD_WORKOUT', (prevResult, callback) => {
            if (payloadData.flag == "STOP") {
                let criteria = {
                    userWorkoutId: prevResult.ADD_WORKOUT._id,
                    challengedBy: authData._id,
                }
                let projection = {
                    challengedTo: 1,
                    coins: 1                                   //if  achallenge is of different coins
                }
                let options = {}
                DAO.getData(Models.challenges, criteria, projection, options, function (err, res) {
                    console.log(".......................", res.length)
                    callback(null, res)
                })
            } else
                callback(null)

        }],

        ADD_NOTIFICATIONS: ['GET_CHALLENGES', (prevResult, callback) => {

            if (payloadData.flag == "STOP" && prevResult.GET_CHALLENGES.length) {

                addNotification(prevResult.GET_CHALLENGES, authData, callback)
            } else
                callback(null)
        }],

        // only for STOP and if workout is a challenge
        CONCLUDE_CHALLENGES: ['ADD_WORKOUT', (prevResult, callback) => {
            if (payloadData.flag == "STOP" && prevResult.ADD_WORKOUT.isChallenged) {

                updateChallengeAfterWorkout(prevResult.ADD_WORKOUT, payloadData, authData._id, callback)

            } else
                callback(null)
        }],
        // only for STOP
        GET_GOALS: ['ADD_WORKOUT', (prevResult, callback) => {
            if (payloadData.flag == "STOP") {
                let criteria = {
                    userId: authData._id,
                    workoutId: prevResult.ADD_WORKOUT.workoutId,
                }
                let projection = {}
                let options = {}
                DAO.getData(Models.userGoals, criteria, projection, options, function (err, res) {
                    if (err)
                        callback(err)
                    else {
                        if (res.length)
                            callback(null, res)
                        else
                            callback(null, res)

                    }
                })
            }
            else
                callback()

        }],
        // only for STOP
        GET_CURRENT_GOALS_COMPLETION: ['GET_GOALS', 'ADD_WORKOUT', (prevResult, callback) => {
            if (payloadData.flag == "STOP") {

                let responseToSend = []

                if (prevResult.GET_GOALS.length) {

                    async.each(prevResult.GET_GOALS, function (obj, cb1) {
                        let currentDate = new Date();
                        let startDate,
                            endDate,
                            firstday,
                            lastday,
                            responseObject = {};
                        switch (obj.day) {
                            case CONSTANTS.GOAL_DURATION.DAILY:
                                startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0))
                                endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59))
                                responseObject.day = CONSTANTS.GOAL_DURATION.DAILY;
                                break;
                            case CONSTANTS.GOAL_DURATION.WEEKLY:
                                firstday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                                lastday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 6));
                                startDate = new Date(Date.UTC(firstday.getFullYear(), firstday.getMonth(), firstday.getDate(), 0, 0, 0))
                                endDate = new Date(Date.UTC(lastday.getFullYear(), lastday.getMonth(), lastday.getDate(), 23, 59, 59))
                                responseObject.day = CONSTANTS.GOAL_DURATION.WEEKLY
                                break;
                            case CONSTANTS.GOAL_DURATION.MONTHLY:
                                firstday = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                lastday = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                                startDate = new Date(Date.UTC(firstday.getFullYear(), firstday.getMonth(), firstday.getDate(), 0, 0, 0))
                                endDate = new Date(Date.UTC(lastday.getFullYear(), lastday.getMonth(), lastday.getDate(), 23, 59, 59))
                                responseObject.day = CONSTANTS.GOAL_DURATION.MONTHLY
                                break;
                        }
                        let match = {
                            // routesCaptured: true,
                            userID: authData._id,
                            routesCaptured: true,
                            workoutId: prevResult.ADD_WORKOUT.workoutId,
                            $and: [{startedAt: {$gte: startDate}}, {startedAt: {$lte: endDate}}]
                        }

                        let aggregateArray = []

                        switch (obj.typeOfGoal) {
                            case CONSTANTS.GOAL_TYPES.CALORIES:
                                aggregateArray = [
                                    {$match: match},
                                    {
                                        $group: {
                                            _id: null,
                                            currentAccomplished: {$sum: "$caloriesBurnt"}
                                        }
                                    }
                                ]
                                responseObject.typeOfGoal = CONSTANTS.GOAL_TYPES.CALORIES
                                break;
                            case CONSTANTS.GOAL_TYPES.DURATION:
                                aggregateArray = [
                                    {$match: match},
                                    {
                                        $group: {
                                            _id: null,
                                            currentAccomplished: {$sum: "$durationTravelled"}
                                        }
                                    }
                                ]
                                responseObject.typeOfGoal = CONSTANTS.GOAL_TYPES.DURATION
                                break;
                            case CONSTANTS.GOAL_TYPES.KILOMETERS:
                                aggregateArray = [
                                    {$match: match},
                                    {
                                        $group: {
                                            _id: null,
                                            currentAccomplished: {$sum: "$distanceTravelled"}
                                        }
                                    }
                                ]
                                responseObject.typeOfGoal = CONSTANTS.GOAL_TYPES.KILOMETERS
                                break;
                        }

                        DAO.aggregateData(Models.userWorkouts, aggregateArray, function (err, res) {
                            if (err)
                                cb1(err)
                            else {
                                console.log("...............................", res)
                                responseObject.target = obj.target
                                responseObject.currentAccomplished = (res.length) ? res[0].currentAccomplished : 0
                                responseToSend.push(responseObject)
                                cb1()
                            }
                        })

                    }, function (err, res) {
                        callback(null, responseToSend)
                    })


                } else {
                    callback(null, responseToSend)
                }

            }
            else
                callback(null)

        }],

    }, (err, result) => {


        if (err)
            callbackRoute(err);
        else
            switch (payloadData.flag) {
                case "BEFORE_START" :
                    callbackRoute(null, {workout: result.ADD_WORKOUT, challenge: result.GET_WORKOUT})
                    break;

                case "START" :
                    (!!payloadData.isGhostRun) ? callbackRoute(null, {ghostRoute: result.GET_WORKOUT}) : callbackRoute(null)
                    break;

                case "STOP" :
                    callbackRoute(null, {goalStats: result.GET_CURRENT_GOALS_COMPLETION})
                    break;

                case "AFTER_STOP" :
                    callbackRoute(null)
                    break;

                case "SAVE_ROUTE" :
                    callbackRoute(null)
                    break;
            }
    })
};

function addNotification(prevFuncResult, authData, callback) {

    async.each(prevFuncResult, function (obj, cb1) {

        async.auto({
            CREATE_NOTIFICATION: (cb) => {
                let dataToSave = {
                    userId: obj.challengedTo,
                    text: authData.firstName + ' ' + authData.lastName + ' challenged you.',
                    title: 'Challenge Recieved',
                    challengeId: obj._id,
                    image: authData.profilePic
                }


                DAO.saveData(Models.notifications, dataToSave, cb)
            },
            UPDATE_USER: (cb) => {
                let criteria = {
                    _id: authData._id
                }
                let dataToUpdate = {
                    $inc: {coins: -obj.coins}
                }
                let options = {
                    new: true
                }
                console.log("......aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.................", dataToUpdate)

                DAO.findAndUpdate(Models.user, criteria, dataToUpdate, {}, cb)
            },
            GET_USER: (cb) => {
                let criteria = {
                    _id: obj.challengedTo
                }
                DAO.getData(Models.user, criteria, {}, {}, cb)
            },
            SEND_PUSH: ['GET_USER', (previousResult, cb) => {
                let dataToSend = {
                    challengeId: obj._id,
                    message: authData.firstName + ' ' + authData.lastName + ' challenged you!'
                }

                if (previousResult.GET_USER[0].deviceDetails.deviceToken)
                    sendPush([previousResult.GET_USER[0].deviceDetails.deviceToken], dataToSend, cb)
                else cb()
            }],
        }, function (err, res) {
            cb1()
        })

    }, function (err, res) {
        callback(null)
    })

}


function updateChallengeAfterWorkout(prevFuncResult, payloadData, userId, callback) {
    async.auto({

        GET_CHALLENGE: (cb) => {
            let criteria = {_id: prevFuncResult.challengeId}
            let projection = {}
            let options = {}
            DAO.getData(Models.challenges, criteria, projection, options, function (err, res) {
                if (err)
                    cb(err)
                else {
                    cb(null, res[0])
                }

            })
        },

        // update single challenge
        UPDATE_CUSTOM_CHALLENGE: ['GET_CHALLENGE', (prevResult, cb) => {
            let criteria = {_id: prevResult.GET_CHALLENGE._id},
                dataToUpdate = {},
                options = {new: true};
            let resultDecided = false;
            let wonBy = null;
            let lostBy = null;
            //completed by either of them already then find who won else update only
            console.log(".........................aaaaaaaaaa..........", prevResult.GET_CHALLENGE.ischallengedByCompleted, prevResult.GET_CHALLENGE.ischallengedToCompleted)

            if (prevResult.GET_CHALLENGE.ischallengedByCompleted || prevResult.GET_CHALLENGE.ischallengedToCompleted) {

                if (prevResult.GET_CHALLENGE.ischallengedByCompleted) {

                    dataToUpdate = (prevResult.GET_CHALLENGE.challengedByTime > payloadData.challengeDuration) ? {
                            wonBy: userId,
                            lostBy: prevResult.GET_CHALLENGE.challengedBy,
                            challengedToTime: payloadData.challengeDuration,
                            challengedToDistance: payloadData.distanceTravelled,
                            ischallengedToCompleted: true,
                            status: CONSTANTS.CHALLENGE_TYPES.COMPLETED
                        } : {
                            wonBy: prevResult.GET_CHALLENGE.challengedBy,
                            lostBy: userId,
                            challengedToTime: payloadData.challengeDuration,
                            challengedToDistance: payloadData.distanceTravelled,
                            ischallengedToCompleted: true,
                            status: CONSTANTS.CHALLENGE_TYPES.COMPLETED
                        }

                } else {
                    dataToUpdate = (prevResult.GET_CHALLENGE.challengedToTime > payloadData.challengeDuration) ? {
                            wonBy: userId,
                            lostBy: prevResult.GET_CHALLENGE.challengedTo,
                            challengedByTime: payloadData.challengeDuration,
                            challengedByDistance: payloadData.distanceTravelled,
                            ischallengedByCompleted: true,
                            status: CONSTANTS.CHALLENGE_TYPES.COMPLETED
                        } : {
                            wonBy: prevResult.GET_CHALLENGE.challengedTo,
                            lostBy: userId,
                            challengedByTime: payloadData.challengeDuration,
                            challengedByDistance: payloadData.distanceTravelled,
                            ischallengedByCompleted: true,
                            status: CONSTANTS.CHALLENGE_TYPES.COMPLETED
                        }
                }
                resultDecided = true
                wonBy = dataToUpdate.wonBy
                lostBy = dataToUpdate.lostBy

            } else {
                dataToUpdate = (userId.toString() === prevResult.GET_CHALLENGE.challengedBy.toString()) ? {
                        challengedByTime: payloadData.challengeDuration,
                        challengedByDistance: payloadData.distanceTravelled,
                        ischallengedByCompleted: true,
                    } : {
                        challengedToTime: payloadData.challengeDuration,
                        challengedToDistance: payloadData.distanceTravelled,
                        ischallengedToCompleted: true,
                    }
            }
            DAO.findAndUpdate(Models.challenges, criteria, dataToUpdate, options, function (err, res) {
                cb(err, {resultDecided: resultDecided, wonBy: wonBy, lostBy: lostBy})
            })
        }],

        // if result is decidded and we've a winner increment the coins
        UPDATE_USER_COINS: ['GET_CHALLENGE', 'UPDATE_CUSTOM_CHALLENGE', (prevResult, cb) => {
            console.log(".........................aaaaaaaaaa..........", prevResult.UPDATE_CUSTOM_CHALLENGE.resultDecided)
            if (prevResult.UPDATE_CUSTOM_CHALLENGE.resultDecided) {
                let criteria = {_id: prevResult.UPDATE_CUSTOM_CHALLENGE.wonBy}
                let dataToUpdate = {
                    $inc: {coins: prevResult.GET_CHALLENGE.coins * 2}
                }
                let options = {new: true}
                console.log(".........................bbbbbbbbbbbb..........", dataToUpdate)

                DAO.findAndUpdate(Models.user, criteria, dataToUpdate, options, cb)
            } else
                cb()
        }],

        CREATE_NOTIFICATION: ['GET_CHALLENGE', 'UPDATE_CUSTOM_CHALLENGE', (prevResult, cb) => {

            if (prevResult.UPDATE_CUSTOM_CHALLENGE.resultDecided) {
                let dataToSave = [];
                dataToSave.push({
                    userId: prevResult.UPDATE_CUSTOM_CHALLENGE.wonBy,
                    text: 'You won a challenge and earned ' + prevResult.GET_CHALLENGE.coins * 2 + ' coins',
                    title: 'Challenge Won!',
                    challengeId: prevFuncResult.challengeId,

                }, {
                    userId: prevResult.UPDATE_CUSTOM_CHALLENGE.lostBy,
                    text: 'You lost a challenge ',
                    title: 'Challenge Lost!',
                    challengeId: prevFuncResult.challengeId,
                })
                DAO.insertMany(Models.notifications, dataToSave, {}, cb)

            } else
                cb(null)
        }],

        GET_WINNER: ['GET_CHALLENGE', 'UPDATE_CUSTOM_CHALLENGE', (prevResult, cb) => {
            if (prevResult.UPDATE_CUSTOM_CHALLENGE.resultDecided) {
                let criteria = {
                    _id: prevResult.UPDATE_CUSTOM_CHALLENGE.wonBy
                }
                DAO.getData(Models.user, criteria, {}, {}, cb)

            }
            else
                cb(null)

        }],

        GET_LOOSER: ['GET_CHALLENGE', 'UPDATE_CUSTOM_CHALLENGE', (prevResult, cb) => {
            if (prevResult.UPDATE_CUSTOM_CHALLENGE.resultDecided) {
                let criteria = {
                    _id: prevResult.UPDATE_CUSTOM_CHALLENGE.lostBy
                }
                DAO.getData(Models.user, criteria, {}, {}, cb)

            }
            else
                cb(null)

        }],
        SEND_WINNER_PUSH: ['GET_WINNER', 'GET_LOOSER', 'UPDATE_CUSTOM_CHALLENGE', (previousResult, cb) => {
            if (previousResult.UPDATE_CUSTOM_CHALLENGE.resultDecided) {
                let dataToSend = {
                    challengeId: prevFuncResult.challengeId,
                    message: ' You Won against ' + previousResult.GET_LOOSER[0].firstName + ' ' + previousResult.GET_LOOSER[0].lastName
                }

                if (previousResult.GET_WINNER[0].deviceDetails.deviceToken)
                    sendPush([previousResult.GET_WINNER[0].deviceDetails.deviceToken], dataToSend, cb)
                else cb()
            } else
                cb()

        }],
        SEND_LOOSER_PUSH: ['GET_LOOSER', 'GET_WINNER', 'UPDATE_CUSTOM_CHALLENGE', (previousResult, cb) => {
            if (previousResult.UPDATE_CUSTOM_CHALLENGE.resultDecided) {
                let dataToSend = {
                    challengeId: prevFuncResult.challengeId,
                    message: 'You lost to ' + previousResult.GET_WINNER[0].firstName + ' ' + previousResult.GET_WINNER[0].lastName
                }

                if (previousResult.GET_LOOSER[0].deviceDetails.deviceToken)
                    sendPush([previousResult.GET_LOOSER[0].deviceDetails.deviceToken], dataToSend, cb)
                else cb()
            } else
                cb()

        }],

    }, (err, result) => {
        callback(null)
    })
}

/*----------------------------------------------------------------------------------------------------\
 * ADD goals
 * INPUT: limit skip
 *-------------------------------------------------------------------------------------------------- */
exports.addGoals = (authData, payloadData, callbackRoute) => {


    async.auto({
        CHECK_GOAL_REDUNDANCY: function (callback) {

            if (!!payloadData.id) {
                callback()
            }
            else {
                let criteria = {
                    userId: authData._id,
                    typeOfGoal: payloadData.typeOfGoal,
                    workoutId: payloadData.workoutId,
                }
                let projection = {}
                let options = {}
                DAO.getData(Models.userGoals, criteria, projection, options, function (err, res) {
                    if (err)
                        callback(err)
                    else {
                        if (res.length)
                            callbackRoute(ERROR.GOAL_ALREADY_EXIST)
                        else
                            callback()

                    }


                })
            }


        },
        CREATE_GOAL: ["CHECK_GOAL_REDUNDANCY", function (prevResult, callback) {

            let dataToSet = {
                userId: authData._id,
                target: payloadData.target,
                typeOfGoal: payloadData.typeOfGoal,
                workoutId: payloadData.workoutId,
                day: payloadData.workoutDay,
                // duration : payloadData.duration
            };

            if (!!payloadData.id) {
                let criteria = {_id: payloadData.id}
                let options = {}
                DAO.findAndUpdate(Models.userGoals, criteria, dataToSet, options, callback)
            }
            else
                DAO.saveData(Models.userGoals, dataToSet, callback)

        }]
    }, function (err, result) {
        if (err)
            callbackRoute(err)
        else callbackRoute(null)
    })
};


/*----------------------------------------------------------------------------------------------------\
 * editMyParameters
 * INPUT: age weight height gender units
 *-------------------------------------------------------------------------------------------------- */
exports.editMyParameters = (authData, queryData, callbackRoute) => {
    async.auto({

        UPDATE_USER: (callback) => {
            console.log(queryData)
            let criteria = {
                _id: authData._id
            }
            let dataToUpdate = {}
            if (!!queryData.age || queryData.age == 0)
                dataToUpdate["age"] = queryData.age
            if (!!queryData.gender)
                dataToUpdate["gender"] = queryData.gender
            if (!!queryData.weight || queryData.age == 0)
                dataToUpdate["weight"] = queryData.weight
            if (!!queryData.height || queryData.age == 0)
                dataToUpdate["height"] = queryData.height
            if (!!queryData.units)
                dataToUpdate["units"] = queryData.units
            let options = {new: true}
            DAO.findAndUpdate(Models.user, criteria, dataToUpdate, options, callback)
        },
    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null)

    })
};

/*----------------------------------------------------------------------------------------------------\
 * postAChallenge
 * INPUT: userWorkoutId coins challengedTo expiryTime
 *-------------------------------------------------------------------------------------------------- */
exports.postAChallenge = (authData, payloadData, callbackRoute) => {
    let isValid = true;
    console.log("...........1........", new Date().getTime())
    async.auto({
        GET_WORKOUT: (callback) => {
            if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.PREVIOUS_WORKOUT) {

                let criteria = {
                    _id: payloadData.userWorkoutId
                }
                let projection = {
                    routesCaptured: 1,
                    distanceTravelled: 1,
                    durationTravelled: 1
                }
                let options = {}

                DAO.getData(Models.userWorkouts, criteria, projection, options, function (err, res) {
                    callback(null, res[0])
                })
            } else
                callback(null, {routesCaptured: true})
        },
        CREATE_CHALLENGE: ['GET_WORKOUT', (prevResult, callback) => {
            if (authData.coins >= (payloadData.coins * payloadData.challengedTo.length)) {


                async.each(payloadData.challengedTo, function (obj, cb1) {
                    createChallengeAndCreateNotification(prevResult, payloadData, authData, obj, cb1)
                }, (err, res) => {
                    callback(null)
                })
            }
            else
                callbackRoute(ERROR.NOT_ENOUGH_COINS)

        }],

        DEDUCT_COINS: ["CREATE_CHALLENGE", "GET_WORKOUT", (previousResult, callback) => {
            if (!!previousResult.GET_WORKOUT.routesCaptured) {
                let criteria = {
                    _id: authData._id
                }
                let dataToUpdate = {$inc: {coins: -(payloadData.coins * payloadData.challengedTo.length)}}
                let options = {new: true}
                DAO.findAndUpdate(Models.user, criteria, dataToUpdate, options, callback)
            } else
                callback(null)
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null)

    })
};


function createChallengeAndCreateNotification(prevFuncResult, payloadData, authData, obj, callback) {
    async.auto({

        CREATE_CHALLENGE: (cb) => {
            let dataToSave = {
                expiryTime: payloadData.expiryTime,
                challengedTo: obj,
                challengedBy: authData._id,
                coins: payloadData.coins,
                type: payloadData.type
            }


            if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.PREVIOUS_WORKOUT) {
                if (!!prevFuncResult.GET_WORKOUT.routesCaptured) {

                    dataToSave['isValid'] = true
                    dataToSave['userWorkoutId'] = prevFuncResult.GET_WORKOUT._id
                    dataToSave['targetTime'] = prevFuncResult.GET_WORKOUT.durationTravelled
                    dataToSave['targetDistance'] = prevFuncResult.GET_WORKOUT.distanceTravelled
                    dataToSave['challengedByTime'] = prevFuncResult.GET_WORKOUT.durationTravelled
                    dataToSave['challengedByDistance'] = prevFuncResult.GET_WORKOUT.distanceTravelled
                    dataToSave['ischallengedByCompleted'] = true

                } else {
                    dataToSave['isValid'] = false
                    dataToSave['userWorkoutId'] = prevFuncResult.GET_WORKOUT._id
                }

            } else {                                         //////////  CUSTOM CHALLENGE
                dataToSave['isValid'] = true
                dataToSave['targetTime'] = payloadData.targetTime
                dataToSave['targetDistance'] = payloadData.targetDistance
                dataToSave['workoutId'] = payloadData.workoutId
            }

            DAO.saveData(Models.challenges, dataToSave, cb)
        },

        CREATE_NOTIFICATION: ["CREATE_CHALLENGE", (previousResult, cb) => {
            if (previousResult.CREATE_CHALLENGE.isValid) {
                let dataToSave = {
                    userId: obj,
                    text: authData.firstName + ' ' + authData.lastName + ' challenged you',
                    title: 'Challenge Recieved',
                    challengeId: previousResult.CREATE_CHALLENGE._id,
                    image: authData.profilePic
                }
                DAO.saveData(Models.notifications, dataToSave, cb)
                console.log("....................", dataToSave)

            } else
                cb(null)
        }],
        GET_USER: ['CREATE_CHALLENGE', (previousResult, cb) => {
            if (previousResult.CREATE_CHALLENGE.isValid) {
                let criteria = {
                    _id: obj
                }
                DAO.getData(Models.user, criteria, {}, {}, cb)
            } else
                cb()
        }],
        SEND_PUSH: ['GET_USER', 'CREATE_CHALLENGE', (previousResult, cb) => {
            if (previousResult.CREATE_CHALLENGE.isValid) {

                let dataToSend = {
                    challengeId: previousResult.CREATE_CHALLENGE._id,
                    message: authData.firstName + ' ' + authData.lastName + ' challenged you!'
                }
                if (previousResult.GET_USER[0].deviceDetails.deviceToken)
                    sendPush([previousResult.GET_USER[0].deviceDetails.deviceToken], dataToSend, cb)
                else cb()
            } else
                cb()
            // (!!previousResult.GET_USER[0].deviceDetails.deviceToken)?
            //     sendPush([previousResult.GET_USER[0].deviceDetails.deviceToken],dataToSend,cb):
            //     cb(null)
        }],

    }, (err, result) => {
        callback(null)
    })
}


/*----------------------------------------------------------------------------------------------------\
 * challengesListing
 * INPUT: type skip limit
 *-------------------------------------------------------------------------------------------------- */
exports.challengesListing = (authData, queryData, callbackRoute) => {
    async.auto({

        GET_CHALLENGES: (callback) => {
            let criteria = {}
            switch (queryData.type) {
                case "MY_CHALLENGE" :
                    criteria = {

                        $or: [
                            {
                                $and: [
                                    {status: CONSTANTS.CHALLENGE_TYPES.ACCEPTED},
                                    {challengedTo: authData._id},
                                ]
                            },
                            {
                                $and: [
                                    {challengedBy: authData._id},
                                    {status: {$in: [CONSTANTS.CHALLENGE_TYPES.PENDING, CONSTANTS.CHALLENGE_TYPES.ACCEPTED]}},
                                ]
                            }
                        ],
                        isValid: true,
                        expiryTime: {$gt: new Date().getTime()}
                    }
                    break;

                case "NEW_CHALLENGES" :
                    criteria = {
                        challengedTo: authData._id,
                        status: CONSTANTS.CHALLENGE_TYPES.PENDING,
                        isValid: true,
                        expiryTime: {$gt: new Date().getTime()}
                    }
                    break;

                case "HISTORY" :
                    criteria = {
                        $or: [
                            {challengedTo: authData._id},
                            {challengedBy: authData._id},
                            {status: {$in: [CONSTANTS.CHALLENGE_TYPES.REJECTED, CONSTANTS.CHALLENGE_TYPES.COMPLETED]}},
                            {expiryTime: {$lte: new Date().getTime()}}
                        ],
                        isValid: true,

                    }
                    break;
            }
            let projection = {
                challengedTo: 1,
                challengedBy: 1,
                userWorkoutId: 1,
                coins: 1,
                expiryTime: 1,
                status: 1,
                isWon: 1,
                createdOn: 1,
                type: 1,
                wonBy: 1,
                targetTime: 1,
                targetDistance: 1,
                ischallengedByCompleted: 1,
                ischallengedToCompleted: 1
            }
            let options = {
                lean: true,
                sort: {createdOn: -1},
                skip: queryData.skip,
                limit: queryData.limit
            }
            let populatedArray = [
                {
                    path: 'challengedBy',
                    match: {},
                    model: "user",
                    select: "firstName lastName profilePic",
                    options: {}
                },
                {
                    path: 'challengedTo',
                    match: {},
                    model: "user",
                    select: "firstName lastName profilePic",
                    options: {}
                },
                {
                    path: 'wonBy',
                    match: {},
                    model: "user",
                    select: "firstName lastName profilePic",
                    options: {}
                },
                {
                    path: 'userWorkoutId',
                    match: {},
                    model: "userWorkouts",
                    select: "distanceTravelled durationTravelled stepsTaken startedAt route weather workoutId",
                    options: {}
                },
                {
                    path: 'workoutId',
                    match: {},
                    model: "workouts",
                    select: "workoutName workoutImage color",
                    options: {}
                }
            ]
            let nestedPopulatedArray = [
                {
                    path: 'userWorkoutId.workoutId',
                    match: {},
                    model: "workouts",
                    select: "workoutName workoutImage color",
                    options: {}
                }
            ]
            DAO.deepPopulate(Models.challenges, criteria, projection, options, populatedArray, nestedPopulatedArray, function (err, result) {
                if (err)
                    callback(err)
                else {
                    if (result.length) {
                        async.each(result, function (obj, cb) {
                            obj.isMyChallenge = (obj.challengedBy._id.toString() == authData._id.toString())
                            if (!!obj.userWorkoutId) {
                                obj.durationTravelled = formatTime(obj.durationTravelled)
                                obj.distanceTravelled = formatDistance(obj.distanceTravelled)
                            }
                            cb()
                        }, function (err, res) {
                            callback(null, result)
                        })
                    } else {
                        callback(null, result)
                    }
                }
            })
        },

    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null, {challenges: res.GET_CHALLENGES})

    })
};


/*----------------------------------------------------------------------------------------------------\
 * getAParticularChallenge
 * INPUT: id
 *-------------------------------------------------------------------------------------------------- */
exports.getAParticularChallenge = (authData, queryData, callbackRoute) => {
    async.auto({

        GET_CHALLENGES: (callback) => {
            let criteria = {_id: queryData.id}

            let projection = {
                challengedTo: 1,
                challengedBy: 1,
                userWorkoutId: 1,
                coins: 1,
                expiryTime: 1,
                status: 1,
                isWon: 1,
                createdOn: 1,
                type: 1,
                wonBy: 1,
                targetTime: 1,
                targetDistance: 1,
                ischallengedByCompleted: 1,
                ischallengedToCompleted: 1
            }
            let options = {
                lean: true,
            }
            let populatedArray = [
                {
                    path: 'challengedBy',
                    match: {},
                    model: "user",
                    select: "firstName lastName profilePic",
                    options: {}
                },
                {
                    path: 'challengedTo',
                    match: {},
                    model: "user",
                    select: "firstName lastName profilePic",
                    options: {}
                },
                {
                    path: 'wonBy',
                    match: {},
                    model: "user",
                    select: "firstName lastName profilePic",
                    options: {}
                },
                {
                    path: 'userWorkoutId',
                    match: {},
                    model: "userWorkouts",
                    select: "distanceTravelled durationTravelled stepsTaken startedAt route weather workoutId",
                    options: {}
                },
                {
                    path: 'workoutId',
                    match: {},
                    model: "workouts",
                    select: "workoutName workoutImage color",
                    options: {}
                }
            ]
            let nestedPopulatedArray = [
                {
                    path: 'userWorkoutId.workoutId',
                    match: {},
                    model: "workouts",
                    select: "workoutName workoutImage color",
                    options: {}
                }
            ]
            DAO.deepPopulate(Models.challenges, criteria, projection, options, populatedArray, nestedPopulatedArray, function (err, result) {
                if (err)
                    callback(err)
                else {
                    if (result.length) {
                        result[0].isMyChallenge = (result[0].challengedBy._id.toString() == authData._id.toString())
                        if (!!result[0].userWorkoutId) {
                            result[0].durationTravelled = formatTime(result[0].durationTravelled)
                            result[0].distanceTravelled = formatDistance(result[0].distanceTravelled)
                        }
                        callback(null, result)
                    } else {
                        callback(null, result)
                    }
                }
            })
        },

    }, (err, res) => {
        if (err) callbackRoute(err);
        else  callbackRoute(null, {challenges: res.GET_CHALLENGES})

    })
};

/*----------------------------------------------------------------------------------------------------\
 * acceptRejectChallenge
 * INPUT: coins type reason
 *-------------------------------------------------------------------------------------------------- */
exports.acceptRejectChallenge = (authData, payloadData, callbackRoute) => {
    async.auto({

        UPDATE_CHALLENGES: (callback) => {
            let date = new Date()
            if (authData.coins >= payloadData.coins && payloadData.type == CONSTANTS.CHALLENGE_TYPES.ACCEPTED) {

                let criteria = {
                    _id: payloadData.id,
                    expiryTime: {$gt: new Date().getTime()}
                }
                let dataToUpdate = {status: payloadData.type}
                let options = {}
                DAO.findAndUpdate(Models.challenges, criteria, dataToUpdate, options, function (err, res) {
                    console.log(".........aaaaaaaaaaaa.......", err, res, new Date().getTime(), payloadData.id, !!res)
                    console.log("................", res.hasOwnProperty("_id"))
                    if (!!res) {
                        callback(null, res)
                    } else
                        callbackRoute(ERROR.CHALLENGE_EXPIRED)
                })
            }
            else if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.REJECTED) {
                let criteria = {_id: payloadData.id}
                let dataToUpdate = {
                    status: payloadData.type,
                    reason: payloadData.reason
                }
                let options = {}
                DAO.findAndUpdate(Models.challenges, criteria, dataToUpdate, options, function (err, res) {
                    console.log(".......bbbbbbbbbbb.........", err, res)
                    if (!!res) {
                        callback(null, res)
                    } else
                        callbackRoute(ERROR.CHALLENGE_EXPIRED)
                })
            }
            else
                callbackRoute(ERROR.NOT_ENOUGH_COINS)

        },
        GET_WORKOUT: ["UPDATE_CHALLENGES", (previousData, callback) => {
            if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.ACCEPTED) {

                if (previousData.UPDATE_CHALLENGES.type === CONSTANTS.CHALLENGE_TYPES.PREVIOUS_WORKOUT) {
                    let criteria = {
                        _id: previousData.UPDATE_CHALLENGES.userWorkoutId
                    }
                    let projection = {
                        workoutId: 1,
                        routeName: 1,
                        routesCaptured: 1
                    }
                    let options = {lean: true}

                    let populatearray = [
                        {
                            path: 'workoutId',
                            select: 'workoutImage workoutName color',
                            model: 'workouts'
                        }
                    ]

                    DAO.populateData(Models.userWorkouts, criteria, projection, options, populatearray, function (err, res) {
                        callback(null, res[0])
                    })

                } else {
                    let criteria = {
                        _id: previousData.UPDATE_CHALLENGES.workoutId
                    }
                    let projection = {
                        workoutImage: 1,
                        workoutName: 1,
                        color: 1
                    }
                    let options = {lean: true}

                    DAO.getData(Models.workouts, criteria, projection, options, function (err, res) {
                        callback(null, {workoutId: res[0], routeName: null, routeCaptured: true, _id: null})
                    })

                }
            }
            else
                callback()

        }],

        UPDATE_USER: ["UPDATE_CHALLENGES", (previousData, callback) => {
            let criteria = {}
            let dataToUpdate = {}
            if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.ACCEPTED) {
                criteria = {_id: previousData.UPDATE_CHALLENGES.challengedTo};
                dataToUpdate = {$inc: {coins: -previousData.UPDATE_CHALLENGES.coins}}
            }
            else {
                criteria = {_id: previousData.UPDATE_CHALLENGES.challengedBy};
                dataToUpdate = {$inc: {coins: previousData.UPDATE_CHALLENGES.coins}}
            }
            let options = {}
            DAO.findAndUpdate(Models.user, criteria, dataToUpdate, options, callback)
        }],

        CREATE_NOTIFICATION: ["UPDATE_CHALLENGES", (previousResult, cb) => {
            let dataToSave = {
                userId: previousResult.UPDATE_CHALLENGES.challengedBy,
                challengeId: payloadData.id,
                image: authData.profilePic
            }

            if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.ACCEPTED) {
                dataToSave['title'] = 'Challenge Accepted';
                dataToSave['text'] = authData.firstName + ' ' + authData.lastName + ' accepted your challenge';
            } else {
                dataToSave['title'] = 'Challenge Rejected';
                dataToSave['text'] = authData.firstName + ' ' + authData.lastName + ' rejected your challenge';
            }

            DAO.saveData(Models.notifications, dataToSave, cb)
        }],

        GET_USER: ['UPDATE_CHALLENGES', (previousResult, cb) => {
            let criteria = {
                _id: previousResult.UPDATE_CHALLENGES.challengedBy
            }
            DAO.getData(Models.user, criteria, {}, {}, cb)
        }],
        SEND_PUSH: ['GET_USER', (previousResult, cb) => {
            let dataToSend = {
                challengeId: payloadData.id
            }
            if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.ACCEPTED) {
                dataToSend['message'] = authData.firstName + ' ' + authData.lastName + ' accepted your challenge';
            } else {
                dataToSend['message'] = authData.firstName + ' ' + authData.lastName + ' rejected your challenge';
            }
            if (previousResult.GET_USER[0].deviceDetails.deviceToken)
                sendPush([previousResult.GET_USER[0].deviceDetails.deviceToken], dataToSend, cb)
            else cb()
        }],
    }, (err, res) => {
        console.log("............................", res.GET_WORKOUT)
        if (payloadData.type == CONSTANTS.CHALLENGE_TYPES.ACCEPTED)
            res.GET_WORKOUT["challengeId"] = payloadData.id
        if (err) callbackRoute(err);
        else  callbackRoute(null, {detail: res.GET_WORKOUT})

    })
};

/*----------------------------------------------------------------------------------------------------\
 * acceptRejectChallengeResponse
 * INPUT: coins type reason
 *-------------------------------------------------------------------------------------------------- */
exports.acceptRejectChallengeResponse = (authData, payloadData, callbackRoute) => {
    async.auto({

        GET_CHALLENGE: (callback) => {

            let criteria = {
                _id: payloadData.id,
            }
            let options = {}
            DAO.getData(Models.challenges, criteria, {}, options, function (err, res) {
                if (res.length) {
                    callback(null, res[0])
                } else
                    callbackRoute(ERROR.CHALLENGE_EXPIRED)
            })
        },
        GET_WORKOUT: ["GET_CHALLENGE", (previousData, callback) => {

            if (previousData.GET_CHALLENGE.type === CONSTANTS.CHALLENGE_TYPES.PREVIOUS_WORKOUT) {
                let criteria = {
                    _id: previousData.GET_CHALLENGE.userWorkoutId
                }
                let projection = {
                    workoutId: 1,
                    routeName: 1,
                    routesCaptured: 1
                }
                let options = {lean: true}

                let populatearray = [
                    {
                        path: 'workoutId',
                        select: 'workoutImage workoutName color',
                        model: 'workouts'
                    }
                ]

                DAO.populateData(Models.userWorkouts, criteria, projection, options, populatearray, function (err, res) {
                    callback(null, res[0])
                })

            } else {
                let criteria = {
                    _id: previousData.GET_CHALLENGE.workoutId
                }
                let projection = {
                    workoutImage: 1,
                    workoutName: 1,
                    color: 1
                }
                let options = {lean: true}

                DAO.getData(Models.workouts, criteria, projection, options, function (err, res) {
                    callback(null, {workoutId: res[0], routeName: null, routeCaptured: true, _id: null})
                })

            }

        }],

    }, (err, res) => {

        res.GET_WORKOUT["challengeId"] = payloadData.id
        if (err) callbackRoute(err);
        else  callbackRoute(null, {detail: res.GET_WORKOUT})

    })
};


/*----------------------------------------------------------------------------------------------------\
 * GET User Stats
 *
 *INPUT: workoutId
 *-------------------------------------------------------------------------------------------------- */
exports.getWorkoutSpecificGraph = (authData, queryData, callbackRoute) => {

    async.auto({


        GET_DETAILS: (callback) => {
            let year = new Date().getFullYear()
            let startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
                endDate = new Date(Date.UTC(year, 1, 31, 23, 59, 59))
            let match = {
                // routesCaptured: true,
                userID: authData._id,
                $and: [{startedAt: {$gte: startDate}}, {startedAt: {$lte: endDate}}]
            }


            let aggregateArray = [
                {
                    $match: {
                        userID: authData._id,
                        $and: [{startedAt: {$gte: startDate}}, {startedAt: {$lte: endDate}}],
                        workoutId: mongoose.Types.ObjectId(queryData.workoutId),
                        routesCaptured: true
                    }
                },
                {
                    $facet: {
                        distanceTravelled: [
                            {
                                $group: {
                                    _id: null,
                                    distanceTravelled: {$sum: "$distanceTravelled"}

                                }
                            }
                        ],
                        graphData: [

                            {
                                $group: {
                                    _id: "$_id",
                                    workoutId: {$min: "$workoutId"},
                                    distanceTravelled: {$min: "$distanceTravelled"},
                                    start: {$min: '$startedAt'}
                                }
                            },
                            {
                                $addFields: {
                                    year: {$year: '$start'},
                                    month: {$month: '$start'}
                                }
                            },

                            {
                                $group: {
                                    _id: "$workoutId",
                                    Jan: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 1]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Feb: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 2]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Mar: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 3]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Apr: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 4]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    May: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 5]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Jun: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 6]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Jul: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 7]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Aug: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 8]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Sep: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 9]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Oct: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 10]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Nov: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 11]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    },
                                    Dec: {
                                        $sum: {
                                            $cond: {
                                                if: {$eq: ["$month", 12]},
                                                then: "$distanceTravelled",
                                                else: 0
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: '$_id',
                                    results: [
                                        {
                                            month: 'Jan',
                                            count: '$Jan'
                                        },
                                        {
                                            month: 'Feb',
                                            count: '$Feb'
                                        },
                                        {
                                            month: 'Mar',
                                            count: '$Mar'
                                        },
                                        {
                                            month: 'Apr',
                                            count: '$Apr'
                                        },
                                        {
                                            month: 'May',
                                            count: '$May'
                                        },
                                        {
                                            month: 'Jun',
                                            count: '$Jun'
                                        },
                                        {
                                            month: 'Jul',
                                            count: '$Jul'
                                        },
                                        {
                                            month: 'Aug',
                                            count: '$Aug'
                                        },
                                        {
                                            month: 'Sep',
                                            count: '$Sep'
                                        },
                                        {
                                            month: 'Oct',
                                            count: '$Oct'
                                        },
                                        {
                                            month: 'Nov',
                                            count: '$Nov'
                                        },
                                        {
                                            month: 'Dec',
                                            count: '$Dec'
                                        }
                                    ]
                                }
                            },
                            {
                                $lookup: {
                                    from: 'workouts',
                                    localField: '_id',
                                    foreignField: '_id',
                                    as: 'workoutData'
                                }
                            },
                            {$unwind: "$workoutData"}

                        ]
                    }
                }
            ];

            DAO.aggregateData(Models.userWorkouts, aggregateArray, callback)
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null, {
                graphData: res.GET_DETAILS[0].graphData[0],
                totalDistance: (res.GET_DETAILS[0].distanceTravelled[0].distanceTravelled * 0.000621371).toFixed(2) + " miles"
            })
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * setMyParameters
 * INPUT: date limit
 *-------------------------------------------------------------------------------------------------- */
exports.getGhostRunAnalysis = (authData, queryData, callbackRoute) => {
    let y = queryData.date.split('/');
    let start = new Date(Date.UTC(y[2], y[0] - 1, y[1], 0, 0, 0)),
        end = new Date(Date.UTC(y[2], y[0] - 1, y[1], 23, 59, 59))
    async.auto({

        GET_DETAILS: (callback) => {
            let criteria = {
                userID: authData._id,
                routesCaptured: true,
                workoutId: queryData.workoutId,
                $and: [{startedAt: {$lte: end}}, {startedAt: {$gte: start}}]

            }
            let projection = {
                route: 1,
                distanceTravelled: 1,
                stepsTaken: 1,
                durationTravelled: 1,
                heartRate: 1,
                caloriesBurnt: 1,
                startedAt: 1,
                speed: 1
            }
            let options = {
                lean: true,
                sort: {startedAt: -1},
            }
            if (!!queryData.limit)
                options["limit"] = queryData.limit
            /* let populatearray = [
             {
             path: 'workoutId',
             select: 'workoutImage workoutName color',
             model: 'workouts'
             }
             ]*/

            DAO.getData(Models.userWorkouts, criteria, projection, options, function (err, result) {
                if (result.length) {
                    async.each(result, function (obj, cb) {
                        obj.durationTravelled = formatTime(obj.durationTravelled)
                        obj.distanceTravelled = formatDistance(obj.distanceTravelled)
                        obj.caloriesBurnt = formatCalories(obj.caloriesBurnt)
                        obj.speed = formatSpeed(obj.speed)
                        cb()
                    }, function (err, res) {
                        callback(null, result)
                    })
                } else
                    callback(null, result)
            })
        },
        GET_GRAPH_DATA: (callback) => {

            let aggregateArray = [
                {
                    $match: {
                        userID: mongoose.Types.ObjectId(authData._id),
                        workoutId: mongoose.Types.ObjectId(queryData.workoutId),
                        routesCaptured: true,
                        $and: [{startedAt: {$lte: end}}, {startedAt: {$gte: start}}]
                    }
                },
                {$unwind: "$route"},
                {
                    $group: {
                        _id: "$route.time",
                        distance: {$sum: "$route.totalDistance"},
                        count: {$sum: 1}

                    }
                },
                {
                    $project: {
                        time: "$_id",
                        distance: {$divide: ["$distance", "$count"]}
                    }
                },
                {$sort: {time: 1}}
            ]


            DAO.aggregateData(Models.userWorkouts, aggregateArray, callback)
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null,
                {
                    workouts: res.GET_DETAILS,
                    graphData: res.GET_GRAPH_DATA

                })
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * recordPurchaseAndAdvertisement
 * INPUT: coinsEarned price type
 *-------------------------------------------------------------------------------------------------- */
exports.recordPurchaseAndAdvertisement = (authData, payloadData, callbackRoute) => {

    async.auto({

        SAVE_PURCHASE: (callback) => {
            let dataToSave = {
                userId: authData._id,
                coinsEarned: payloadData.coinsEarned,
                price: payloadData.price,
                type: payloadData.type
            }

            DAO.saveData(Models.purchases, dataToSave, callback)
        },
        UPDATE_USER: function (callback) {
            let criteria = {_id: authData._id}
            let dataToUpdate = {
                $inc: {coins: payloadData.coinsEarned}
            }
            let options = {new: true}
            DAO.findAndUpdate(Models.user, criteria, dataToUpdate, options, callback)
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null, {userTotalCoins: res.UPDATE_USER.coins})
        }
    })
};


/*----------------------------------------------------------------------------------------------------\
 * getNotifications
 * INPUT: coinsEarned price type
 *-------------------------------------------------------------------------------------------------- */
exports.getNotifications = (authData, payloadData, callbackRoute) => {

    async.auto({

        GET_NOTIFICATIONS: (callback) => {
            let criteria = {userId: authData._id}
            let projection = {}
            let options = {
                sort: {createdAt: -1},
                skip: payloadData.skip,
                limit: payloadData.limit
            }
            DAO.getData(Models.notifications, criteria, projection, options, callback)
        },
        UPDATE_NOTIFICATIONS: function (callback) {
            let criteria = {userId: authData._id, isRead: false}
            let dataToUpdate = {
                isRead: true
            }
            let options = {new: true}
            DAO.findAndUpdate(Models.notifications, criteria, dataToUpdate, options, callback)
        },
        COUNT_NOTIFICATION: (callback) => {
            let criteria = {userId: authData._id}
            DAO.count(Models.notifications, criteria, callback)
        },
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null, {notifications: res.GET_NOTIFICATIONS, count: res.COUNT_NOTIFICATION})
        }
    })
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


exports.getMyDatary = (authData, queryData, callbackRoute) => {
    let query = {};

    let option = {
        lean: true,
        skip: queryData.skip,
        sort: {}
    };

    if (queryData.limit) option.limit = queryData.limit;

    let populate = [{
        path: "userGoing",
        select: "firstName lastName profilePic",
        match: {},
        option: {lean: true}
    }, {
        path: "dockId",
        select: "-__v -__id -isBlocked -isDeleted -createdOn",
        populate: [{path: "userId", select: "firstName lastName"}, {
            path: "aminities",
            select: "aminityName aminityLogo"
        }],
        match: {},
        option: {lean: true}
    }, {
        path: "userId",
        select: "firstName lastName countryCode phoneNumber profilePic",
        match: {},
        option: {lean: true}
    }, {
        path: "aminities",
        select: "aminityName aminityLogo",
        match: {},
        option: {lean: true}
    }];

    let myFavMeetUps = _.map(authData.myFav, (myfav) => {
        return myfav.toString()
    });

    async.auto({
        GET_MODEL: (callback) => {

            switch (queryData.dataType) {
                case 0 : {
                    if (queryData.flag == 0) {
                        query.endDateTime = {$gt: new Date()};
                        query.isDeleted = false;
                        query.isBlocked = false;
                        query.$or = [{userId: authData._id}, {userGoing: authData._id}];
                        option.sort.dateTime = -1;
                        callback(null, Models.meetUps);
                        break;
                    }
                    else {
                        query.endDateTime = {$lte: new Date()};
                        query.$or = [{userId: authData._id}, {userGoing: authData._id}];
                        option.sort.dateTime = -1;
                        callback(null, Models.meetUps);
                        break;
                    }
                }
                case 1 : {
                    if (queryData.flag == 0) {

                        query.$and = [{bookingEndDateTime: {$gt: new Date()}}, {
                            bookingStatus: {
                                $in: [
                                    CONSTANTS.BOOKING_STATUS.CONFIRMED,
                                    CONSTANTS.BOOKING_STATUS.PENDING
                                ]
                            }
                        }];
                        query.userId = authData._id;
                        option.sort.bookingStartDateTime = 1;
                        callback(null, Models.bookings);
                        break;
                    }
                    else {
                        query.$or = [{bookingEndDateTime: {$lte: new Date()}}, {
                            bookingStatus: {
                                $in: [
                                    CONSTANTS.BOOKING_STATUS.COMPLETED,
                                    CONSTANTS.BOOKING_STATUS.USER_CANCELLED,
                                    CONSTANTS.BOOKING_STATUS.DOCK_OWNER_CANCEL,
                                    CONSTANTS.BOOKING_STATUS.ADMIN_CANCELLED
                                ]
                            }
                        }];
                        query.userId = authData._id;
                        option.sort.bookingStartDateTime = 1;
                        callback(null, Models.bookings);
                        break;
                    }
                }
                case 2 : {
                    if (queryData.flag == 0) {
                        query.dateTime = {$gte: new Date()};
                        query.$or = [{userId: authData._id}, {userGoing: authData._id}]
                        option.sort.dateTime = -1;
                        callback(null, Models.tieups);
                        break;
                    }
                    else {
                        query.dateTime = {$lt: new Date()};
                        query.$or = [{userId: authData._id}, {userGoing: authData._id}];
                        option.sort.dateTime = -1;
                        callback(null, Models.tieups);
                        break;
                    }
                }
                case 3 : {
                    query.isBlocked = false;
                    query.isDeleted = false;
                    query.$or = [{userId: authData._id}, {userGoing: authData._id}];
                    option.sort.createdOn = -1;
                    callback(null, Models.dock);
                    break;
                }
                default : {
                    if (queryData.flag == 0) {
                        query.dockId = queryData.dockId;
                        query.$and = [{bookingEndDateTime: {$gt: new Date()}}, {
                            bookingStatus: {
                                $in: [
                                    CONSTANTS.BOOKING_STATUS.CONFIRMED,
                                    CONSTANTS.BOOKING_STATUS.PENDING
                                ]
                            }
                        }];
                        option.sort.bookingStartDateTime = 1;
                        callback(null, Models.bookings);
                        break;
                    }
                    else {
                        query.dockId = queryData.dockId;
                        query.$or = [{bookingEndDateTime: {$lte: new Date()}}, {
                            bookingStatus: {
                                $in: [
                                    CONSTANTS.BOOKING_STATUS.COMPLETED,
                                    CONSTANTS.BOOKING_STATUS.USER_CANCELLED,
                                    CONSTANTS.BOOKING_STATUS.DOCK_OWNER_CANCEL,
                                    CONSTANTS.BOOKING_STATUS.ADMIN_CANCELLED
                                ]
                            }
                        }];
                        option.sort.bookingStartDateTime = 1;
                        callback(null, Models.bookings);
                        break;
                    }
                }
            }
        },
        GET_COUNT: ['GET_MODEL', (previousResult, callback) => {
            DAO.count(previousResult.GET_MODEL, query, callback)
        }],
        GET_DATA: ['GET_MODEL', (previousResult, callback) => {

            DAO.populateData(previousResult.GET_MODEL, query, {
                __v: 0,
                cardId: 0,
                isVerified: 0,
                isBlocked: 0,
                isDeleted: 0,
                createdOn: 0
            }, option, populate, (err, res) => {
                if (err) callback(err);
                else {
                    let i = 0,
                        j = 0;

                    if (queryData.dataType == 0) {
                        res.forEach((item) => {
                            i++;
                            if (_.contains(myFavMeetUps, item._id.toString())) item.isFav = true;
                            else item.isFav = false
                        });

                        if (i == res.length) callback(null, res)
                    }
                    else if (queryData.dataType == 3) {

                        res.forEach((item) => {
                            j++;
                            item.ownDock = true;
                        });

                        if (j == res.length) callback(null, res)
                    }
                    else callback(null, res);
                }
            })
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else callbackRoute(null, {
            count: res.GET_COUNT,
            list: res.GET_DATA
        })
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Get Spots/ tieup/ docks/ meetups
 * INPUT: limit skip dataType
 *-------------------------------------------------------------------------------------------------- */

exports.getData = (authData, queryData, callbackRoute) => {

    let maxDistance = 10;

    let geoNear = {
        $geoNear: {
            near: {type: "Point", coordinates: [queryData.longitude, queryData.latitude]},
            distanceField: "distanceCalculated",
            maxDistance: maxDistance * 1000,                                       //In Meter
            query: {
                isBlocked: false,
                isDeleted: false
            },
            distanceMultiplier: 0.001,
            spherical: true
        }
    };

    let skip = {
        $skip: queryData.skip
    };

    let limit = {
        $limit: queryData.limit
    };

    let sort = {
        $sort: {}
    };

    let projection = {
        $project: {
            isBlocked: 0,
            isDeleted: 0,
            createdOn: 0,
            __v: 0
        }
    };

    let populate = [
        {
            path: "spotType",
            select: "-isDeleted -createdOn -_id",
            match: {},
            option: {lean: true}
        },
        {
            path: "userId",
            select: "firstName lastName countryCode phoneNumber profilePic _id",
            match: {},
            option: {lean: true}
        },
        {
            path: "userGoing",
            select: "firstName lastName profilePic",
            match: {},
            option: {lean: true}
        },
        {
            path: "aminities",
            select: "-isDeleted -createdOn",
            match: {},
            option: {lean: true}
        }
    ];

    if (queryData.dataType == 1 && queryData.tieUpPreference) geoNear.$geoNear.query.tieUpPreference = {$in: queryData.tieUpPreference};

    async.auto({
        GET_ADMIN_DEFAULT: (callback) => {
            DAO.getData(Models.adminDefaults, {}, {
                spotsWithinRadius: 1,
                meetupsWithinRadius: 1,
                tieupWithinRadius: 1,
                dockWithinRadius: 1
            }, {lean: true}, callback)
        },
        CHECK_VALID_TYPE_FOR_FILTER: (callback) => {
            if (queryData.dataType == 0 && queryData.spotType) {
                DAO.getData(Models.spotTypes, {
                    _id: {$in: queryData.spotType},
                    isDeleted: false
                }, {_id: 1}, {lean: true}, (err, res) => {
                    if (err) callback(err);
                    else if (res.length > 0) {
                        geoNear.$geoNear.query.spotType = {
                            $in: _.map(queryData.spotType, (item) => {
                                return mongoose.Types.ObjectId(item)
                            })
                        };
                        callback(null);
                    }
                    else callback(ERROR.FILTER_TYPE_NOT_EXISTS)
                })
            }
            else callback(null)
        },
        GET_NOTCONNECTED_BLOCKED_USER: (callback) => {
            DAO.getData(Models.user, {
                $or: [{accountState: {$ne: CONSTANTS.ACCOUNT_STATUS.ACTIVE}},
                    {
                        $or: [
                            {stripeAccountId: ""},
                            {stripeAccountId: null}
                        ]
                    }]
            }, {_id: 1}, {lean: true}, callback);

        },
        GET_MODEL: ['GET_ADMIN_DEFAULT', 'GET_NOTCONNECTED_BLOCKED_USER', (previousData, callback) => {
            switch (queryData.dataType) {
                case 0 : {
                    maxDistance = previousData.GET_ADMIN_DEFAULT[0].spotsWithinRadius;
                    geoNear.$geoNear.maxDistance = maxDistance * 1000;
                    sort.$sort.distanceCalculated = 1;
                    callback(null, Models.spots);
                    break;
                }
                case 1 : {
                    maxDistance = previousData.GET_ADMIN_DEFAULT[0].tieupWithinRadius;
                    geoNear.$geoNear.maxDistance = maxDistance * 1000;
                    sort.$sort.distanceCalculated = 1;
                    callback(null, Models.tieups);
                    break;
                }
                case 2 : {
                    maxDistance = previousData.GET_ADMIN_DEFAULT[0].dockWithinRadius;
                    geoNear.$geoNear.maxDistance = maxDistance * 1000;
                    sort.$sort.distanceCalculated = 1;
                    let userIds = _.pluck(previousData.GET_NOTCONNECTED_BLOCKED_USER, '_id');

                    //userIds.push(authData._id);
                    geoNear.$geoNear.query.userId = {$nin: userIds};
                    //geoNear.$geoNear.query.userId = {$ne : authData._id};
                    callback(null, Models.dock);
                    break;
                }
                case 3 : {
                    maxDistance = previousData.GET_ADMIN_DEFAULT[0].meetupsWithinRadius;
                    geoNear.$geoNear.maxDistance = maxDistance * 1000;
                    sort.$sort.dateTime = 1;
                    //geoNear.$geoNear.query.userId = {$ne : authData._id};
                    geoNear.$geoNear.query.isVerified = true;
                    geoNear.$geoNear.query.endDateTime = {$gt: new Date()};
                    callback(null, Models.meetUps);
                    break;
                }
            }
        }],
        GET_COUNT: ['GET_MODEL', 'CHECK_VALID_TYPE_FOR_FILTER', (previousResult, callback) => {

            DAO.aggregateData(previousResult.GET_MODEL, [geoNear, projection], (err, res) => {
                if (err) callback(err);
                else callback(null, res.length)
            })
        }],
        GET_AGGREGATE_DATA: ['GET_MODEL', 'CHECK_VALID_TYPE_FOR_FILTER', (previousResult, callback) => {

            let pipeline = [geoNear, sort, skip, projection];

            if (queryData.limit) pipeline = [geoNear, sort, skip, limit, projection];

            DAO.aggregateDataWithPopulate(previousResult.GET_MODEL, pipeline, populate, (err, res) => {
                if (err) callback(err);
                else {
                    if (res.length > 0 && queryData.dataType == 2) {

                        async.forEachSeries(res, (item, innerCallback) => {

                            if (item.userId && item.userId._id.toString() == authData._id.toString()) item.ownDock = true;
                            else item.ownDock = false;

                            innerCallback();

                        }, (err) => {
                            callback(null, res)
                        })
                    }
                    else if (res.length > 0 && res[0].hasOwnProperty("userGoing")) {

                        async.forEachSeries(res, (item, innerCallback) => {

                            item.userGoing = _.map(item.userGoing, (item2) => {
                                return {
                                    _id: item2._id.toString(),
                                    firstName: item2.firstName,
                                    lastName: item2.lastName,
                                    profilePic: item2.profilePic
                                }
                            });

                            if (_.contains(_.pluck(item.userGoing, '_id'), authData._id.toString())) {

                                if (item.userId && item.userId._id.toString() == authData._id.toString()) {
                                    item.ownBeacon = true;
                                }
                                else item.ownBeacon = false;

                                item.flag = 1;
                                innerCallback();
                            }
                            else {

                                if (item.userId && item.userId._id.toString() == authData._id.toString()) {
                                    item.ownBeacon = true;
                                }
                                else item.ownBeacon = false;

                                item.flag = 0;
                                innerCallback();
                            }

                        }, (err) => {
                            callback(null, res)
                        })
                    }
                    else callback(null, res)
                }
            })
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else callbackRoute(null, {
            count: res.GET_COUNT,
            list: res.GET_AGGREGATE_DATA
        })
    })
};

/*----------------------------------------------------------------------------------------------------\
 * get Data
 * INPUT: flag
 * OUTPUT : get data
 *-------------------------------------------------------------------------------------------------- */

exports.getMusicSpotType = (payloadData, callbackRoute) => {

    let option = {
        lean: true
    };

    let query = {};

    let projection = {};

    async.auto({
        CHOOSE_MODEL: (callback) => {
            switch (payloadData.dataType) {
                case 0 : {
                    query.isDeleted = false;
                    callback(null, Models.spotTypes);
                    break;
                }
                case 1 : {
                    query.isDeleted = false;
                    callback(null, Models.musicTypes);
                    break;
                }
                default : {
                    query.isDeleted = false;
                    callback(null, Models.aminities);
                    break;
                }
            }
        },
        GET_DATA: ['CHOOSE_MODEL', (previousResult, callback) => {
            DAO.getData(previousResult.CHOOSE_MODEL, query, projection, option, callback)
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else callbackRoute(null, {
            list: res.GET_DATA
        })
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Create Tieup/ beacon
 * INPUT: title tieUpPreference musicType dateTime size address latitude longitude isFile tieupImage
 *          familyFriendly overnight description
 * OUTPUT : Tieup created successfully or throw error
 *-------------------------------------------------------------------------------------------------- */

exports.createTieup = (authData, payloadData, callbackRoute) => {
    let dataToSet = {
        userId: authData._id,
        title: payloadData.title.replace(/\b./g, (a) => a.toUpperCase()),
        tieUpPreference: payloadData.tieUpPreference,
        musicType: payloadData.musicType,
        dateTime: payloadData.dateTime,
        size: payloadData.size,
        address: payloadData.address,
        locationLongLat: {
            type: "Point",
            coordinates: [payloadData.longitude, payloadData.latitude]
        },
        familyFriendly: payloadData.familyFriendly,
        overnight: payloadData.overnight,
        description: payloadData.description
    };

    async.auto({
        TIEUP_COUNT: (callback) => {
            DAO.count(Models.tieups, {userId: authData._id, isDeleted: false}, (err, res) => {
                if (err) callback(err);
                else if (res) callback(ERROR.CAN_MAKE_ONLY_ONE_BEACON);
                else callback(null, {})
            })
        },
        UPLOAD_IMAGE: ['TIEUP_COUNT', (previousResult, callback) => {
            if (payloadData.isFile == true) {
                if (payloadData.tieupImage && payloadData.tieupImage.hapi.filename) {
                    if (payloadData.tieupImage.hapi.headers['content-type'].split("/")[0] === 'image') {
                        util.uploadProfilePicture(payloadData.tieupImage, "tieup_" + authData._id, tieupPicFolder, (error, urls) => {
                            if (error) callback(error);
                            else {
                                dataToSet.tieupImage = urls;
                                callback(error, urls)
                            }
                        });
                    }
                    else callback(ERROR.INVALID_IMAGE_FORMAT)
                }
                else callback(ERROR.NO_FILE);
            }
            else callback(null, {});
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else DAO.saveData(Models.tieups, dataToSet, callbackRoute)
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Connect with beacon/ do tieup
 * INPUT: tieupId latitude longitude
 * OUTPUT : Tieup successfully or throw error
 *-------------------------------------------------------------------------------------------------- */

exports.doTieup = (authData, payloadData, callbackRoute) => {

    async.auto({
        GET_ADMIN_DEFAULT: (callback) => {
            DAO.getData(Models.adminDefaults, {}, {canTieUpWithinRadius: 1}, {lean: true}, callback)
        },
        CHECK_USER_HAVE_BEACON: (callback) => {
            DAO.getData(Models.tieups, {userId: authData._id, isBlocked: false, isDeleted: false}, {
                    _id: 1,
                    tieUpPreference: 1,
                    userGoing: 1
                },
                {lean: true}, (err, res) => {
                    if (err) callback(err);
                    else if (res.length > 0) callback(null, res);
                    else callback(ERROR.CAN_NOT_DO_TIEUP);
                })
        },
        CHECK_USER_CAN_DO_TIEUP: ['GET_ADMIN_DEFAULT', 'CHECK_USER_HAVE_BEACON', (previousResult, callback) => {

            let geoNear = {
                $geoNear: {
                    near: {type: "Point", coordinates: [payloadData.longitude, payloadData.latitude]},
                    distanceField: "distanceCalculated",
                    query: {
                        _id: mongoose.Types.ObjectId(payloadData.tieupId),
                        isBlocked: false,
                        isDeleted: false
                    },
                    distanceMultiplier: 0.001,
                    spherical: true
                }
            };

            let populate = [{
                path: "userId",
                select: "deviceDetails firstName lastName",
                option: {lean: true},
                match: {}
            }];

            DAO.aggregateDataWithPopulate(Models.tieups, [geoNear], populate, (err, res) => {
                if (err) callback(err);
                else if (res.length == 0) callback(ERROR.TIEUP_NOT_EXISTS);
                else if (res[0].distanceCalculated > previousResult.GET_ADMIN_DEFAULT[0].canTieUpWithinRadius) callback(ERROR.CAN_NOT_TIEUP);
                else if (res[0].tieUpPreference != previousResult.CHECK_USER_HAVE_BEACON[0].tieUpPreference) callback(ERROR.CAN_NOT_TIEUP);
                else callback(null, res)
            })
        }],
        TIEUP_OTHER_USERS_WITH_MY_BEACON: ['CHECK_USER_HAVE_BEACON', 'CHECK_USER_CAN_DO_TIEUP', (previousResult, callback) => {

            previousResult.CHECK_USER_CAN_DO_TIEUP[0].userGoing.push(previousResult.CHECK_USER_CAN_DO_TIEUP[0].userId._id);

            DAO.update(Models.tieups, {userId: authData._id, isBlocked: false, isDeleted: false}, {
                $addToSet: {userGoing: {$each: previousResult.CHECK_USER_CAN_DO_TIEUP[0].userGoing}}
            }, {lean: true, multi: true}, callback)
        }],
        GET_MY_OWN_BEACON_TIEUP_USER: ['TIEUP_OTHER_USERS_WITH_MY_BEACON', (previousResult, callback) => {
            DAO.getData(Models.tieups, {
                userId: authData._id,
                isBlocked: false,
                isDeleted: false
            }, {userGoing: 1}, {lean: true}, callback)
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {

            let dataToPush = _.map(res.GET_MY_OWN_BEACON_TIEUP_USER[0].userGoing, (item) => {
                return item.toString()
            });
            dataToPush.push(authData._id.toString());

            let bulk = Models.tieups.collection.initializeOrderedBulkOp();

            async.forEachSeries(res.GET_MY_OWN_BEACON_TIEUP_USER[0].userGoing, (userId, innerCallback) => {

                let temp = dataToPush;

                let query = {
                    userId: userId,
                    isDeleted: false,
                    isBlocked: false
                };

                let newTemp = temp.filter(function (a) {
                    return a != userId.toString()
                });

                newTemp = _.map(newTemp, (item) => {
                    return mongoose.Types.ObjectId(item)
                });

                DAO.bulkFindAndUpdateOne(bulk, query, {$addToSet: {userGoing: {$each: newTemp}}}, {lean: true});

                innerCallback(null, {})
            }, (err, finalRes) => {
                if (err) {
                    logger.error("err in bulk find and update query---->>>>>>", err);
                    callbackRoute(err);
                }
                else {
                    bulk.execute(function (err) {
                        if (err) {
                            logger.error("err in bulk execute query------->>>>>", err);
                            callbackRoute(err);
                        }
                        else {
                            callbackRoute(null, {});

                            let notificationData = {
                                message: authData.firstName + " " + authData.lastName + PUSH_MSG.DO_TIEUP,
                                flag: PUSH_FLAG.TIEUP_MADE,
                                data: {
                                    tieupId: payloadData.tieupId
                                }
                            };

                            if (res.CHECK_USER_CAN_DO_TIEUP[0].userId.deviceDetails.deviceToken != undefined) {
                                Lib.notificationManager.sendFCMPushNotification([res.CHECK_USER_CAN_DO_TIEUP[0].userId.deviceDetails.deviceToken], notificationData, (err, pushRes) => {
                                    logger.error("do tieup push err---->>>>", err);
                                    logger.info("do tieup push result---->>>>", pushRes);
                                });
                            }
                        }
                    });
                }
            });
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Delete Beacon
 * INPUT: tieupId
 * OUTPUT : Beacon deleted successfully
 *-------------------------------------------------------------------------------------------------- */

exports.deleteBeacon = (authData, payloadData, callbackRoute) => {

    async.auto({
        DELETE_OWN_BEACON: (callback) => {
            DAO.findAndUpdate(Models.tieups, {_id: payloadData.beaconId, userId: authData._id}, {
                $set: {
                    isDeleted: true,
                    userGoing: []
                }
            }, {lean: true, new: true}, (err, res) => {
                if (err) callback(err);
                else if (!res) callback(ERROR.BEACON_NOT_EXISTS);
                else callback(null, res);
            })
        },
        DELETE_MY_TIEUPS: ['DELETE_OWN_BEACON', (previousResult, callback) => {
            DAO.update(Models.tieups, {
                userGoing: {$in: [authData._id]},
                isDeleted: false
            }, {$pull: {userGoing: authData._id}}, {lean: true, multi: true}, callback)
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else callbackRoute(null, res.DELETE_OWN_BEACON)
    });
};

/*----------------------------------------------------------------------------------------------------\
 * Delete Meetup
 * INPUT: meetupId
 * OUTPUT : meetup deleted successfully
 *-------------------------------------------------------------------------------------------------- */

exports.deleteMeetUp = (authData, payloadData, callbackRoute) => {
    DAO.update(Models.meetUps, {
        _id: payloadData.meetupId,
        userId: authData._id
    }, {isDeleted: true}, {lean: true}, (err, res) => {
        if (err) callbackRoute(err);
        else if (res.n == 0) callbackRoute(ERROR.MEETUP_NOT_EXISTS);
        else callbackRoute(null, res)
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Delete Dock
 * INPUT: dockId
 * OUTPUT : dock deleted successfully
 *-------------------------------------------------------------------------------------------------- */

exports.deleteDock = (authData, payloadData, callbackRoute) => {

    async.auto({
        CHECK_DOCK_BOOKING: (callback) => {
            DAO.getData(Models.bookings, {
                dockId: payloadData.dockId, bookingStatus: {
                    $in: [CONSTANTS.BOOKING_STATUS.PENDING,
                        CONSTANTS.BOOKING_STATUS.CONFIRMED]
                }
            }, {_id: 1}, {lean: true}, (err, res) => {
                if (err) callback(err);
                else if (res.length) callback(ERROR.CAN_NOT_DELETE_DOCK);
                else callback(null, {})
            })
        }
    }, (err, finalRes) => {
        if (err) callbackRoute(err);
        else DAO.update(Models.dock, {
            _id: payloadData.dockId,
            userId: authData._id
        }, {isDeleted: true}, {lean: true}, (err, res) => {
            if (err) callbackRoute(err);
            else if (res.n == 0) callbackRoute(ERROR.DOCK_NOT_EXISTS);
            else callbackRoute(null, res)
        })
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Remove with beacon/ remove tieup
 * INPUT: tieupId
 * OUTPUT : Tieup remove successfully or throw error
 *-------------------------------------------------------------------------------------------------- */

exports.removeTieup = (authData, payloadData, callbackRoute) => {

    async.auto({
        REMOVE_MY_TIEUP_FROM_MAIN_BEACON: (callback) => {
            DAO.findAndUpdate(Models.tieups, {_id: payloadData.tieupId},
                {$pull: {userGoing: authData._id}}, {lean: true}, (err, res) => {
                    if (err) callback(err);
                    else if (!res) callback(ERROR.TIEUP_NOT_EXISTS);
                    else callback(null, res)
                })
        },
        REMOVE_MY_ID_FROM_DIFF_BEACON: ['REMOVE_MY_TIEUP', (previousResult, callback) => {
            DAO.findAndUpdate(Models.tieups, {userId: {$in: previousResult.REMOVE_MY_TIEUP_FROM_MAIN_BEACON.userGoing}},
                {$pull: {userGoing: authData._id}}, {lean: true, new: true}, (err, res) => {
                    if (err) callback(err);
                    else if (!res) callback(ERROR.TIEUP_NOT_EXISTS);
                    else callback(null, res)
                })
        }]
    }, callbackRoute)
};

/*----------------------------------------------------------------------------------------------------\
 * Create Meetup
 * INPUT: eventName dateTime address latitude longitude isFile meetupImage description
 * OUTPUT : Meetup created successfully or throw error
 *-------------------------------------------------------------------------------------------------- */

exports.createMeetup = (authData, payloadData, callbackRoute) => {

    let dataToSet = {
        userId: authData._id,
        eventName: payloadData.eventName.replace(/\b./g, (a) => a.toUpperCase()),
        dateTime: payloadData.dateTime,
        endDateTime: payloadData.endDateTime,
        address: payloadData.address,
        locationLongLat: {
            type: "Point",
            coordinates: [payloadData.longitude, payloadData.latitude]
        },
        description: payloadData.description,
        websiteURL: payloadData.websiteURL
    };

    async.auto({
        UPLOAD_IMAGE: (callback) => {
            if (payloadData.isFile == true) {
                if (payloadData.meetupImage && payloadData.meetupImage.hapi.filename) {
                    if (payloadData.meetupImage.hapi.headers['content-type'].split("/")[0] === 'image') {
                        util.uploadProfilePicture(payloadData.meetupImage, "meetup_" + authData._id, meetupPicFolder, (error, urls) => {
                            if (error) callback(error);
                            else {
                                dataToSet.meetupImage = urls;
                                callback(error, urls)
                            }
                        });
                    }
                    else callback(ERROR.INVALID_IMAGE_FORMAT)
                }
                else callback(ERROR.NO_FILE);
            }
            else callback(null, {});
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else DAO.saveData(Models.meetUps, dataToSet, callbackRoute)
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Send/remove RSVP
 * INPUT: meetupId rsvpSend
 * OUTPUT : RSVP send/remove successfully or throw error
 *-------------------------------------------------------------------------------------------------- */

exports.sendRemoveRSVP = (authData, payloadData, callbackRoute) => {
    let dataToUpdate = {};

    if (payloadData.rsvpSend) {
        dataToUpdate.$push = {userGoing: authData._id};
        dataToUpdate.$inc = {totalUserGoingCount: 1}
    }
    else {
        dataToUpdate.$pull = {userGoing: authData._id};
        dataToUpdate.$inc = {totalUserGoingCount: -1}
    }

    DAO.findAndUpdate(Models.meetUps, {_id: payloadData.meetupId}, dataToUpdate, {
        lean: true,
        new: true
    }, (err, res) => {
        if (err) callbackRoute(err);
        else if (!res) callbackRoute(ERROR.MEETUP_NOT_EXISTS);
        else {
            callbackRoute(null, res);

            if (payloadData.rsvpSend) {
                async.auto({
                    FIND_OWNER_DEVICE_DETAILS: (callback) => {
                        if (res.userId) {
                            DAO.getData(Models.user, {_id: res.userId}, {deviceDetails: 1, firstName: 1, lastName: 1},
                                {lean: true}, callback)
                        }
                        else {
                            let dataToSave = {
                                notificationMsg: authData.firstName + " " + authData.lastName + PUSH_MSG.SEND_RSVP
                            };

                            DAO.saveData(Models.adminNotifications, dataToSave, callback)
                        }
                    }
                }, (err, finalRes) => {
                    if (err) logger.error("send RSVP push notification err--->>", err);
                    else if (res.userId) {
                        let notificationData = {
                            message: authData.firstName + " " + authData.lastName + PUSH_MSG.SEND_RSVP,
                            flag: PUSH_FLAG.SEND_RSVP,
                            data: {
                                meetupId: payloadData.meetupId
                            }
                        };

                        Lib.notificationManager.sendFCMPushNotification([finalRes.FIND_OWNER_DEVICE_DETAILS[0].deviceDetails.deviceToken], notificationData, (err, pushRes) => {
                            logger.error("send RSVP push notification err---->>>>", err);
                            logger.info("send RSVP push notification result---->>>>", pushRes);
                        });
                    }
                })
            }
        }
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Create/edit Dock
 * INPUT: dockName capacity rent length width covered address latitude longitude description isFile
 *          dockImage websiteURL minRentHours aminities
 * OUTPUT : Dock created successfully or throw error
 *-------------------------------------------------------------------------------------------------- */

exports.createEditDock = (authData, payloadData, callbackRoute) => {

    let dataToUpdate = {
        availabilityType: payloadData.availabilityType,
        monthAvailability: [
            {month: 0, isAvailable: true},
            {month: 1, isAvailable: true},
            {month: 2, isAvailable: true},
            {month: 3, isAvailable: true},
            {month: 4, isAvailable: true},
            {month: 5, isAvailable: true},
            {month: 6, isAvailable: true},
            {month: 7, isAvailable: true},
            {month: 8, isAvailable: true},
            {month: 9, isAvailable: true},
            {month: 10, isAvailable: true},
            {month: 11, isAvailable: true}
        ]
    };

    if (payloadData.availabilityType == 1) dataToUpdate.hourlyAvailability = payloadData.hourlyAvailability;
    else if (payloadData.availabilityType == 2) dataToUpdate.dailyNotAvailable = payloadData.dailyNotAvailable;
    else if (payloadData.monthAvailability && payloadData.monthAvailability.length > 0 && payloadData.availabilityType == 3) dataToUpdate.monthAvailability = payloadData.monthAvailability;

    let dataToSet = {
        userId: authData._id,
        email: payloadData.email,
        dockName: payloadData.dockName.replace(/\b./g, (a) => a.toUpperCase()),
        ownerName: payloadData.ownerName.replace(/\b./g, (a) => a.toUpperCase()),
        phoneNumber: payloadData.phoneNumber,
        capacity: payloadData.capacity,
        rent: payloadData.rent,
        availabilityType: payloadData.availabilityType,
        size: {
            length: payloadData.length,
            depth: payloadData.depth,
            height: payloadData.height,
            width: payloadData.width
        },
        covered: payloadData.covered,
        address: payloadData.address,
        locationLongLat: {
            type: "Point",
            coordinates: [payloadData.longitude, payloadData.latitude]
        },
        description: payloadData.description,
        websiteURL: payloadData.websiteURL,
        minRentHours: payloadData.minRentHours,
        aminities: payloadData.aminities
    };

    async.auto({
        UPLOAD_IMAGE: (callback) => {
            if (payloadData.isFile == true) {
                if (payloadData.dockImage && payloadData.dockImage.hapi.filename) {
                    if (payloadData.dockImage.hapi.headers['content-type'].split("/")[0] === 'image') {
                        util.uploadProfilePicture(payloadData.dockImage, "dock_" + authData._id, dockPicFolder, (error, urls) => {
                            if (error) callback(error);
                            else {
                                dataToSet.dockImage = urls;
                                callback(error, urls)
                            }
                        });
                    }
                    else callback(ERROR.INVALID_IMAGE_FORMAT)
                }
                else callback(ERROR.NO_FILE);
            }
            else callback(null, {});
        },
        CREATE_DOCK: ['UPLOAD_IMAGE', (previousResult, callback) => {

            if (payloadData.dockId) {
                DAO.findAndUpdate(Models.dock, {_id: payloadData.dockId}, dataToSet, {
                    lean: true,
                    new: true
                }, (err, res) => {
                    if (err) callback(err);
                    else if (res) callback(null, res);
                    else callback(ERROR.DOCK_NOT_EXISTS);
                });
            }
            else DAO.saveData(Models.dock, dataToSet, callback)
        }],
        GET_DATA: ['CREATE_DOCK', (previousData, callback) => {
            let populate = [
                {
                    path: "userId",
                    select: "firstName lastName countryCode phoneNumber profilePic _id",
                    match: {},
                    option: {lean: true}
                },
                {
                    path: "aminities",
                    select: "-isDeleted -createdOn",
                    match: {},
                    option: {lean: true}
                }
            ];

            let query = {};

            if (payloadData.dockId) query._id = payloadData.dockId;
            else query._id = previousData.CREATE_DOCK.id;

            DAO.populateData(Models.dock, query, {}, {lean: true}, populate, callback)
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null, res.GET_DATA[0]);

            async.auto({
                GET_DOCKS: (callback) => {
                    DAO.count(Models.dock, {userId: authData._id}, callback)
                },
                SAVE_AVAILABILITY: (callback) => {
                    if (!payloadData.dockId) {

                        dataToUpdate.dockId = res.CREATE_DOCK._id;

                        DAO.saveData(Models.dockAvailability, dataToUpdate, (err, saveResult) => {
                            logger.error("save availability err---->>>>", err);
                            logger.info("save availability result---->>>>", saveResult);

                            callback(err, saveResult)
                        });
                    }
                    else callback(null, {})
                },
                SEND_PAYMENT_LINK: ['GET_DOCKS', (previousResult, callback) => {

                    logger.debug("no of docks of a particular user--->>>", previousResult.GET_DOCKS);

                    if (previousResult.GET_DOCKS == 1 && !payloadData.dockId) {

                        sendEmail('USER_PAYMENT_ACCOUNT_CREATE', {stripeAccountLink: CONSTANTS.STRIPE_LINK.baseURL + "&state=" + authData._id},
                            authData.email, CONSTANTS.EMAIL_SUBJECTS.STRIPE_PAYMENT_ACCOUNT_CREATE, callback);
                    }
                    else callback(null, {})
                }]
            }, (err, finalRes) => {
                logger.error("final err---->>>>", err);
                logger.info("final result---->>>>", finalRes);
            })

        }
    })
};

/*---------------------------------------------------------------------------------------------------------
 * ADD CARD
 * INPUT: STRIPE TOKEN
 * --------------------------------------------------------------------------------------------------------*/
exports.addCreditCard = (authData, payload, callbackRoute) => {
    async.waterfall([
        (callback) => {
            DAO.getData(Models.userCards, {userId: authData._id, isDeleted: false},
                {_id: 1, stripeUserId: 1}, {lean: true}, (err, cardsIds) => {
                    if (err) {
                        logger.error("err-->>", err)
                        callback(err);
                    }
                    else if (cardsIds.length == 5) callback(ERROR.CAN_NOT_ADD);
                    else {
                        let defaultStatus = 1,
                            flag = 1,
                            stripeUserId = 0;

                        if (cardsIds.length) {
                            stripeUserId = cardsIds[0].stripeUserId;
                            defaultStatus = payload.defaultStatus;
                            flag = 0;
                        }
                        callback(null, defaultStatus, flag, stripeUserId)
                    }
                });
        },
        (defaultStatus, flag, stripeUserId, callback) => {
            stripeManager.addCreditCard(authData, payload, defaultStatus, flag, stripeUserId, callback)
        },
        (userCardId, callback) => {
            DAO.update(Models.user, {_id: authData._id}, {$addToSet: {userCards: userCardId._id}}, {lean: true}, callback)
        }
    ], (err, updateResult) => {
        if (err) callbackRoute(err);
        else DAO.getData(Models.userCards, {
            userId: authData._id,
            isDeleted: false
        }, {__v: 0}, {lean: true}, callbackRoute)
    })

};

/*---------------------------------------------------------------------------------------------------------
 * GET CARD
 * --------------------------------------------------------------------------------------------------------*/
exports.getCreditCards = (authData, callbackRoute) => {
    DAO.getData(Models.userCards, {userId: authData._id, isDeleted: false}, {__v: 0}, {lean: true}, callbackRoute)
};

/*---------------------------------------------------------------------------------------------------------
 * CHANGE DEFAULT CARD
 * INPUT - card id
 * --------------------------------------------------------------------------------------------------------*/
exports.changeDefaultCards = (authData, payloadData, callbackRoute) => {
    async.waterfall([
        (callback) => {
            DAO.update(Models.userCards, {_id: payloadData.cardId}, {$set: {defaultStatus: true}}, {lean: true}, callback)
        },
        (updateResult, callback) => {
            DAO.update(Models.userCards, {
                    _id: {$ne: payloadData.cardId},
                    userId: authData._id
                }, {$set: {defaultStatus: false}},
                {lean: true, multi: true}, callback)
        }
    ], (err, finalResult) => {
        if (err) callbackRoute(err);
        else DAO.getData(Models.userCards, {
            userId: authData._id,
            isDeleted: false
        }, {__v: 0}, {lean: true}, callbackRoute)
    })
};

/*---------------------------------------------------------------------------------------------------------
 * DELETE CARD
 * INPUT - card id
 * --------------------------------------------------------------------------------------------------------*/
exports.deleteCreditCards = (authData, payloadData, callbackRoute) => {
    async.auto({
        CHECK_DEFAULT_STATUS: (callback) => {
            DAO.getData(Models.userCards, {_id: payloadData.cardId}, {defaultStatus: 1}, {lean: true}, (err, result) => {
                if (err) callback(err);
                else if (result.length == 0) callback(ERROR.INVALID_CREDENTIALS);
                else if (result[0].defaultStatus == true) callback(ERROR.CAN_NOT_DELETE_DEFAULT_CARD);
                else callback(null, result)
            })
        },
        REMOVE_CARD_FROM_USER_CARDS_TABLE: ['CHECK_DEFAULT_STATUS', (cardDetails, callback) => {
            DAO.update(Models.userCards, {
                userId: authData._id,
                _id: payloadData.cardId
            }, {isDeleted: true}, {lean: true}, callback)
        }],
        REMOVE_CARD_FROM_USER_TABLE: ['CHECK_DEFAULT_STATUS', (cardDetails, callback) => {
            DAO.update(Models.user, {_id: authData._id}, {$pull: {userCards: payloadData.cardId}}, {lean: true}, callback)
        }]
    }, (err, finalResult) => {
        if (err) callbackRoute(err);
        else DAO.getData(Models.userCards, {
            userId: authData._id,
            isDeleted: false
        }, {__v: 0}, {lean: true}, callbackRoute)
    });
};

/*---------------------------------------------------------------------------------------------------------
 * ADD/REMOVE FAV MEETUP
 * INPUT - meetupId status
 * --------------------------------------------------------------------------------------------------------*/
exports.addRemoveFavMeetup = (authData, payloadData, callbackRoute) => {
    let dataToUpdate = {};

    if (payloadData.status == 1) dataToUpdate.$push = {myFav: payloadData.meetupId};
    else dataToUpdate.$pull = {myFav: payloadData.meetupId};

    DAO.update(Models.user, {_id: authData._id}, dataToUpdate, {lean: true}, callbackRoute)
};

/*---------------------------------------------------------------------------------------------------------
 * Get Dock Availability
 * INPUT - dockId
 * --------------------------------------------------------------------------------------------------------*/
exports.getAvailability = (queryData, callbackRoute) => {

    let projection = {
            $project: {}
        },
        availability = [],
        daysInMonth = 30;

    let match = {
        $match: {
            dockId: mongoose.Types.ObjectId(queryData.dockId)
        }
    };

    if (queryData.availabilityType == 1) {

        projection.$project = {
            "hourlyAvailability": {
                $filter: {
                    input: "$hourlyAvailability",
                    as: "hourlyAvailability",
                    cond: {
                        $and: [{
                            $gte: ["$$hourlyAvailability.dateTime", moment().set({
                                'year': queryData.year,
                                'month': queryData.month
                            }).add(queryData.timeOffSet, 'minutes').startOf('month')._d]
                        },
                            {
                                $lte: ["$$hourlyAvailability.dateTime", moment().set({
                                    'year': queryData.year,
                                    'month': queryData.month
                                }).add(queryData.timeOffSet, 'minutes').endOf('month')._d]
                            }]
                    }
                }
            }
        };

        daysInMonth = moment().set({
            'year': queryData.year,
            'month': queryData.month
        }).add(queryData.timeOffSet, 'minutes').daysInMonth();

        for (var i = 0; i < daysInMonth; i++) {

            availability.push({
                dateTime: moment().set({
                    'year': queryData.year,
                    'month': queryData.month
                }).add(queryData.timeOffSet, 'minutes').add(i, 'days').startOf('day').toISOString(),
                isFullDayAvailable: true,
                availability: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            })
        }
    }
    else if (queryData.availabilityType == 2) {

        projection.$project = {
            "dailyNotAvailable": {
                $filter: {
                    input: "$dailyNotAvailable",
                    as: "dailyNotAvailable",
                    cond: {
                        $and: [{
                            $gte: ["$$dailyNotAvailable.dateTime", moment().add(queryData.timeOffSet, 'minutes').set({
                                'year': queryData.year,
                                'month': queryData.month
                            }).startOf('month')._d]
                        },
                            {
                                $lte: ["$$dailyNotAvailable.dateTime", moment().add(queryData.timeOffSet, 'minutes').set({
                                    'year': queryData.year,
                                    'month': queryData.month
                                }).endOf('month')._d]
                            }]
                    }
                }
            }
        };
        daysInMonth = moment().set({
            'year': queryData.year,
            'month': queryData.month
        }).add(queryData.timeOffSet, 'minutes').daysInMonth();

        for (var i = 0; i < daysInMonth; i++) {
            availability.push({
                dateTime: moment().add(queryData.timeOffSet, 'minutes').set({
                    'year': queryData.year,
                    'month': queryData.month
                }).startOf('month').add(i, 'days').toISOString(),
                isAvailable: true
            })
        }
    }
    else projection.$project.monthAvailability = 1;

    DAO.aggregateData(Models.dockAvailability, [match, projection], (err, res) => {

        if (err) {
            logger.error(err);
            callbackRoute(err);
        }
        else if (res.length && queryData.availabilityType == 1) {

            res[0].hourlyAvailability = _.map(res[0].hourlyAvailability, (item) => {
                return {
                    dateTime: moment(item.dateTime).toISOString(),
                    isFullDayAvailable: item.isFullDayAvailable,
                    availability: item.availability
                }
            });


            callbackRoute(null, lodash.unionBy(res[0].hourlyAvailability, availability, 'dateTime'));
        }
        else if (res.length && queryData.availabilityType == 2) {

            res[0].dailyNotAvailable = _.map(res[0].dailyNotAvailable, (item) => {
                return {
                    dateTime: moment(item.dateTime).toISOString(),
                    isAvailable: item.isAvailable
                }
            });

            callbackRoute(null, lodash.unionBy(res[0].dailyNotAvailable, availability, 'dateTime'));
        }
        else if (res.length && queryData.availabilityType == 3) callbackRoute(null, res[0].monthAvailability);
        else callbackRoute(null, [])
    });
};

/*---------------------------------------------------------------------------------------------------------
 * Update Dock Availability
 * INPUT - dockId availabiltiy
 * --------------------------------------------------------------------------------------------------------*/
exports.updateDockAvailability = (payloadData, callbackRoute) => {

    let dataToIterate;

    if (payloadData.availabilityType == 1) dataToIterate = payloadData.hourlyAvailability;
    else if (payloadData.availabilityType == 2) dataToIterate = payloadData.dailyNotAvailable;
    else dataToIterate = payloadData.monthAvailability;

    let bulk = Models.dockAvailability.collection.initializeOrderedBulkOp();

    async.forEachSeries(dataToIterate, (item, innerCallback) => {

        let query = {
                dockId: mongoose.Types.ObjectId(payloadData.dockId)
            },
            dataToUpdate = {};

        if (payloadData.availabilityType == 1) {

            if (item.isFullDayAvailable) dataToUpdate.$pull = {
                hourlyAvailability: {dateTime: item.dateTime}
            };
            else if (item.currentState) {
                dataToUpdate.$addToSet = {
                    hourlyAvailability: item
                }
            }
            else {
                query.hourlyAvailability = {
                    $elemMatch: {
                        dateTime: item.dateTime
                    }
                };

                dataToUpdate.$set = {
                    "hourlyAvailability.$.availability": item.availability
                }
            }
        }
        else if (payloadData.availabilityType == 2) {

            if (item.isAvailable) dataToUpdate.$pull = {
                dailyNotAvailable: {dateTime: item.dateTime}
            };
            else dataToUpdate.$addToSet = {
                dailyNotAvailable: item
            }
        }
        else {

            query.monthAvailability = {
                $elemMatch: {
                    month: item.month
                }
            };

            dataToUpdate.$set = {
                "monthAvailability.$.isAvailable": item.isAvailable
            }
        }
        ;

        DAO.bulkFindAndUpdateOne(bulk, query, dataToUpdate, {lean: true});

        innerCallback(null, {})
    }, (err, res) => {
        if (err) {
            logger.error("err in bulk find and update query---->>>>>>", err);
            callbackRoute(err);
        }
        else {
            bulk.execute(function (err) {
                if (err) {
                    logger.error("err in bulk execute query------->>>>>", err);
                    callbackRoute(err);
                }
                else callbackRoute(null, {});
            });
        }
    });
};

/*---------------------------------------------------------------------------------------------------------
 * check Dock Availability
 * INPUT - dockId startTime lastTime
 * --------------------------------------------------------------------------------------------------------*/
exports.checkDockAvailability = (queryData, callbackRoute) => {

    let startDateHour = moment(queryData.bookingStartDateTime).add(queryData.timeOffSet, 'minutes').hour(),
        endDateHour = moment(queryData.bookingEndDateTime).add(queryData.timeOffSet, 'minutes').hour();

    let startDate = moment(queryData.bookingStartDateTime).add(queryData.timeOffSet, 'minutes').startOf('day')._d,
        endDate = moment(queryData.bookingEndDateTime).add(queryData.timeOffSet, 'minutes').startOf('day')._d;

    let startDate1 = moment(queryData.bookingStartDateTime).add(queryData.timeOffSet, 'minutes').startOf('day')._d,
        endDate1 = moment(queryData.bookingEndDateTime).add(queryData.timeOffSet, 'minutes').startOf('day')._d;

    let startDateMonth = moment(queryData.bookingStartDateTime).add(queryData.timeOffSet, 'minutes').month(),
        endDateMonth = moment(queryData.bookingEndDateTime).add(queryData.timeOffSet, 'minutes').month();

    let diff = util.getRange(queryData.bookingStartDateTime, queryData.bookingEndDateTime, 'days');

    let availability = [],
        timeValues = [];

    while (endDate1 > startDate1) {
        timeValues.push(moment(startDate1).month());
        startDate1 = moment(startDate1).add(1, 'month');
    }
    ;

    let hourDiff = util.getRange(queryData.bookingStartDateTime, queryData.bookingEndDateTime, 'hours');

    logger.debug("startDateHour--->>>>", startDateHour);
    logger.debug("endDateHour--->>>>", endDateHour);
    logger.debug("startDate--->>>>", startDate);
    logger.debug("endDate--->>>>", endDate);
    logger.debug("startDate Month--->>>>", startDateMonth);
    logger.debug("endDate Month--->>>>", endDateMonth);
    logger.debug("diff in dates--->>>>", diff);
    logger.debug("hourDiff--->>>>", hourDiff);
    logger.debug("timeValues--->>>>", timeValues);

    async.auto({
        GET_DOCK_DETAILS: (callback) => {
            DAO.getData(Models.dock, {_id: queryData.dockId, isBlocked: false, isDeleted: false},
                {minRentHours: 1, availabilityType: 1, capacity: 1}, {lean: true}, (err, res) => {
                    if (err) callback(err);
                    else if (res.length == 0) callback(ERROR.DOCK_NOT_EXISTS);
                    else if (res[0].availabilityType == 1 && hourDiff >= res[0].minRentHours) callback(null, res[0]);
                    else if (res[0].availabilityType == 2 && hourDiff >= (res[0].minRentHours) / 24) callback(null, res[0]);
                    else if (res[0].availabilityType == 3 && hourDiff >= (res[0].minRentHours) / (24 * 30)) callback(null, res[0]);
                    else if (res[0].availabilityType == 1 && hourDiff < res[0].minRentHours) callback(ERROR.CAN_NOT_BOOK_DOCK);
                    else callback(null, res[0])
                })
        },
        CHECK_DOCK_CAPACITY: ['GET_DOCK_DETAILS', (previousDetails, callback) => {
            DAO.count(Models.bookings, {
                dockId: queryData.dockId,
                $or: [
                    {
                        bookingStartDateTime: {$lte: queryData.bookingStartDateTime},
                        bookingEndDateTime: {$gte: queryData.bookingStartDateTime}
                    },
                    {
                        bookingStartDateTime: {$gte: queryData.bookingStartDateTime, $lte: queryData.bookingEndDateTime}
                    }],
                bookingStatus: {
                    $in: [
                        CONSTANTS.BOOKING_STATUS.PENDING,
                        CONSTANTS.BOOKING_STATUS.CONFIRMED
                    ]
                }
            }, (err, res) => {

                logger.debug("dock booking count in a range--->>>>>", res);
                logger.debug("total capacity of dock--->>>>>", previousDetails.GET_DOCK_DETAILS.capacity);

                if (err) callback(err);
                else if (res == previousDetails.GET_DOCK_DETAILS.capacity) callback(ERROR.DOCK_HOUSE_FULL);
                else callback(null, {})
            })
        }],
        CHECK_AVAILABILITY: ['GET_DOCK_DETAILS', 'CHECK_DOCK_CAPACITY', (previousDetails, callback) => {

            let match = {
                $match: {
                    dockId: mongoose.Types.ObjectId(queryData.dockId)
                }
            };

            let project = {
                $project: {
                    hourlyAvailability: {
                        $filter: {
                            input: "$hourlyAvailability",
                            as: "hourlyAvailability",
                            cond: {
                                $and: [
                                    {$gte: ["$$hourlyAvailability.dateTime", startDate]},
                                    {$lte: ["$$hourlyAvailability.dateTime", endDate]}
                                ]
                            }
                        }
                    }
                }
            };

            let pipeline = [match];

            if (previousDetails.GET_DOCK_DETAILS.availabilityType == 2) match.$match.dailyNotAvailable = {
                $elemMatch: {
                    dateTime: {$gte: startDate, $lte: endDate},
                    isAvailable: false
                }
            };
            else if (previousDetails.GET_DOCK_DETAILS.availabilityType == 3) match.$match.monthAvailability = {

                $elemMatch: {
                    month: {$in: timeValues},
                    isAvailable: false
                }
            };
            else pipeline = [match, project];

            DAO.aggregateData(Models.dockAvailability, pipeline, (err, res) => {
                if (err) callback(err);
                else if (res.length && (previousDetails.GET_DOCK_DETAILS.availabilityType == 2 || previousDetails.GET_DOCK_DETAILS.availabilityType == 3))
                    callback(ERROR.DOCK_NOT_AVAILABLE);
                else if (res.length && previousDetails.GET_DOCK_DETAILS.availabilityType == 1) {

                    async.forEach(res[0].hourlyAvailability, (item, innerCallback) => {

                        if (new Date(startDate).getTime() == new Date(endDate).getTime()) {
                            availability = availability.concat(item.availability.slice(startDateHour, endDateHour));
                            innerCallback(null, {});
                        }
                        else if (new Date(item.date).getTime() == new Date(startDate).getTime()) {
                            availability = availability.concat(item.availability.splice(startDateHour));
                            innerCallback(null, {});
                        }
                        else if (new Date(item.date).getTime() == new Date(endDate).getTime()) {
                            if (endDateHour != 0) availability = availability.concat(item.availability.splice(0, endDateHour));
                            else availability = availability.concat(item.availability.splice(0, 1));
                            innerCallback(null, {});
                        }
                        else {
                            availability = availability.concat(item.availability);
                            innerCallback(null, {});
                        }
                    }, (err, finalRes) => {
                        if (err) callback(err);
                        else callback(null, {})
                    })
                }
                else callback(null, {})
            });
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else if (res.GET_DOCK_DETAILS.availabilityType == 1 && availability.includes(0)) callbackRoute(ERROR.DOCK_NOT_AVAILABLE);
        else callbackRoute(null, {});
    })
};

/*---------------------------------------------------------------------------------------------------------
 * BOOK DOCK
 * INPUT - dockId startTime lastTime cardId Notes
 * --------------------------------------------------------------------------------------------------------*/
exports.bookDock = (authData, payloadData, callbackRoute) => {

    let startDateHour = moment(payloadData.bookingStartDateTime).add(payloadData.timeOffSet, 'minutes').hour(),
        endDateHour = moment(payloadData.bookingEndDateTime).add(payloadData.timeOffSet, 'minutes').hour();

    let startDate = moment(payloadData.bookingStartDateTime).add(payloadData.timeOffSet, 'minutes').startOf('day')._d,
        endDate = moment(payloadData.bookingEndDateTime).add(payloadData.timeOffSet, 'minutes').startOf('day')._d;

    let startDate1 = moment(payloadData.bookingStartDateTime).add(payloadData.timeOffSet, 'minutes').startOf('day')._d,
        endDate1 = moment(payloadData.bookingEndDateTime).add(payloadData.timeOffSet, 'minutes').startOf('day')._d;

    let startDateMonth = moment(payloadData.bookingStartDateTime).add(payloadData.timeOffSet, 'minutes').month(),
        endDateMonth = moment(payloadData.bookingEndDateTime).add(payloadData.timeOffSet, 'minutes').month();

    let diff = util.getRange(payloadData.bookingStartDateTime, payloadData.bookingEndDateTime, 'days');
    let diffInMonth = util.getRange(payloadData.bookingStartDateTime, payloadData.bookingEndDateTime, 'month');

    let availability = [],
        transactionId = "",
        paymentStatus = 0,
        paymentHoldStatus = 'PENDING',
        timeValues = [];

    while (endDate1 > startDate1) {
        timeValues.push(moment(startDate1).month());
        startDate1 = moment(startDate1).add(1, 'month');
    }
    ;

    let hourDiff = util.getRange(payloadData.bookingStartDateTime, payloadData.bookingEndDateTime, 'hours');

    logger.debug("startDateHour--->>>>", startDateHour);
    logger.debug("endDateHour--->>>>", endDateHour);
    logger.debug("startDate--->>>>", startDate);
    logger.debug("endDate--->>>>", endDate);
    logger.debug("startDate Month--->>>>", startDateMonth);
    logger.debug("endDate Month--->>>>", endDateMonth);
    logger.debug("diff in dates--->>>>", diff);
    logger.debug("diff in diffInMonth--->>>>", diffInMonth);
    logger.debug("hourDiff--->>>>", hourDiff);

    let dataToSave = {
        userId: authData._id,
        cardId: payloadData.cardId,
        dockId: payloadData.dockId,
        bookingStartDateTime: payloadData.bookingStartDateTime,
        bookingEndDateTime: payloadData.bookingEndDateTime,
        notes: payloadData.notes,
        bookingStatus: CONSTANTS.BOOKING_STATUS.CONFIRMED,
        paymentStatus: CONSTANTS.PAYMENT_STATUS.PENDING
    };

    async.auto({
        GET_ADMIN_DEFAULT: (callback) => {
            DAO.getData(Models.adminDefaults, {}, {
                    percentToAdmin: 1,
                    paymentAmountHoldBefore: 1,
                    paymentAmountCaptureBefore: 1
                },
                {lean: true}, callback)
        },
        GET_DOCK_DETAILS: (callback) => {

            let populate = [{
                path: "userId",
                select: "firstName lastName deviceDetails stripeAccountId",
                match: {},
                option: {lean: true}
            }];

            DAO.populateData(Models.dock, {_id: payloadData.dockId, isBlocked: false, isDeleted: false},
                {
                    minRentHours: 1,
                    rent: 1,
                    userId: 1,
                    availabilityType: 1,
                    capacity: 1
                }, {lean: true}, populate, (err, res) => {
                    if (err) callback(err);
                    else if (res.length == 0) callback(ERROR.DOCK_NOT_EXISTS);
                    else if (res[0].availabilityType == 1 && hourDiff >= res[0].minRentHours) callback(null, res[0]);
                    else if (res[0].availabilityType == 2 && hourDiff >= (res[0].minRentHours) / 24) callback(null, res[0]);
                    else if (res[0].availabilityType == 3 && hourDiff >= (res[0].minRentHours) / (24 * 30)) callback(null, res[0]);
                    else if (res[0].availabilityType == 1 && hourDiff < res[0].minRentHours) callback(ERROR.CAN_NOT_BOOK_DOCK);
                    else callback(null, res[0])
                })
        },
        CHECK_DOCK_CAPACITY: ['GET_DOCK_DETAILS', (previousDetails, callback) => {
            DAO.count(Models.bookings, {
                dockId: payloadData.dockId,
                $or: [
                    {
                        bookingStartDateTime: {$lte: payloadData.bookingStartDateTime},
                        bookingEndDateTime: {$gte: payloadData.bookingStartDateTime}
                    },
                    {
                        bookingStartDateTime: {
                            $gte: payloadData.bookingStartDateTime,
                            $lte: payloadData.bookingEndDateTime
                        }
                    }],
                bookingStatus: {
                    $in: [
                        CONSTANTS.BOOKING_STATUS.PENDING,
                        CONSTANTS.BOOKING_STATUS.CONFIRMED
                    ]
                }
            }, (err, res) => {

                logger.debug("dock booking count in a range--->>>>>", res);
                logger.debug("total capacity of dock--->>>>>", previousDetails.GET_DOCK_DETAILS.capacity);

                if (err) callback(err);
                else if (res == previousDetails.GET_DOCK_DETAILS.capacity) callback(ERROR.DOCK_HOUSE_FULL);
                else callback(null, {})
            })
        }],
        CHECK_CARD_EXIST: (callback) => {
            DAO.getData(Models.userCards, {
                userId: authData._id,
                _id: payloadData.cardId
            }, {}, {lean: true}, (err, res) => {
                if (err) callback(err);
                else if (res.length == 0) callback(ERROR.CARD_NOT_EXIST);
                else callback(null, res[0])
            })
        },
        CHECK_AVAILABILITY: ['GET_DOCK_DETAILS', 'CHECK_DOCK_CAPACITY', (previousDetails, callback) => {

            let match = {
                $match: {
                    dockId: mongoose.Types.ObjectId(payloadData.dockId)
                }
            };

            let project = {
                $project: {
                    hourlyAvailability: {
                        $filter: {
                            input: "$hourlyAvailability",
                            as: "hourlyAvailability",
                            cond: {
                                $and: [
                                    {$gte: ["$$hourlyAvailability.dateTime", startDate]},
                                    {$lte: ["$$hourlyAvailability.dateTime", endDate]}
                                ]
                            }
                        }
                    }
                }
            };

            let pipeline = [match];

            if (previousDetails.GET_DOCK_DETAILS.availabilityType == 2) match.$match.dailyNotAvailable = {
                $elemMatch: {
                    dateTime: {$gte: startDate, $lte: endDate},
                    isAvailable: false
                }
            };
            else if (previousDetails.GET_DOCK_DETAILS.availabilityType == 3) match.$match.monthAvailability = {
                $elemMatch: {
                    month: {$in: timeValues},
                    isAvailable: false
                }
            };
            else pipeline = [match, project];

            DAO.aggregateData(Models.dockAvailability, pipeline, (err, res) => {
                if (err) callback(err);
                else if (res.length && (previousDetails.GET_DOCK_DETAILS.availabilityType == 2 || previousDetails.GET_DOCK_DETAILS.availabilityType == 3))
                    callback(ERROR.DOCK_NOT_AVAILABLE);
                else if (res.length && previousDetails.GET_DOCK_DETAILS.availabilityType == 1) {

                    async.forEach(res[0].hourlyAvailability, (item, innerCallback) => {

                        if (new Date(startDate).getTime() == new Date(endDate).getTime()) {
                            availability = availability.concat(item.availability.slice(startDateHour, endDateHour));
                            innerCallback(null, {});
                        }
                        else if (new Date(item.date).getTime() == new Date(startDate).getTime()) {
                            availability = availability.concat(item.availability.splice(startDateHour));
                            innerCallback(null, {});
                        }
                        else if (new Date(item.date).getTime() == new Date(endDate).getTime()) {
                            if (endDateHour != 0) availability = availability.concat(item.availability.splice(0, endDateHour));
                            else availability = availability.concat(item.availability.splice(0, 1));
                            innerCallback(null, {});
                        }
                        else {
                            availability = availability.concat(item.availability);
                            innerCallback(null, {});
                        }
                    }, (err, finalRes) => {
                        if (err) callback(err);
                        else callback(null, {})
                    })
                }
                else callback(null, {})
            });
        }],
        BOOK_DOCK: ['GET_DOCK_DETAILS', 'CHECK_DOCK_CAPACITY', 'CHECK_CARD_EXIST', 'CHECK_AVAILABILITY', (previousResult, callback) => {

            if (previousResult.GET_DOCK_DETAILS.availabilityType == 1 && availability.includes(0)) callbackRoute(ERROR.DOCK_NOT_AVAILABLE);
            else {

                if (previousResult.GET_DOCK_DETAILS.availabilityType == 1) dataToSave.bookingAmount = previousResult.GET_DOCK_DETAILS.rent * hourDiff;
                else if (previousResult.GET_DOCK_DETAILS.availabilityType == 2) {

                    dataToSave.bookingEndDateTime = moment(payloadData.bookingEndDateTime).add(Number(payloadData.timeOffSet) + 481 - Number(payloadData.timeOffSet), 'minutes')._d;          // handled 8 AM to 8 AM case
                    dataToSave.bookingAmount = previousResult.GET_DOCK_DETAILS.rent * (diff + 1);
                }
                else dataToSave.bookingAmount = previousResult.GET_DOCK_DETAILS.rent * (diffInMonth + 1);

                DAO.saveData(Models.bookings, dataToSave, callback)
            }
        }],
        CAPTURE_AMOUNT: ['CHECK_CARD_EXIST', 'BOOK_DOCK', 'GET_ADMIN_DEFAULT', 'GET_DOCK_DETAILS', (previousResult, callback) => {

            let applicationFee = (dataToSave.bookingAmount * previousResult.GET_ADMIN_DEFAULT[0].percentToAdmin) / 100;

            var dateBeforeTwoHour = moment(payloadData.bookingStartDateTime).add(-previousResult.GET_ADMIN_DEFAULT[0].paymentAmountCaptureBefore, 'minutes')._d;

            if (moment()._d >= dateBeforeTwoHour && dataToSave.bookingAmount > 0)                    // If booking time is less than 2 hours from current time
            {
                stripeManager.createAmount(previousResult.CHECK_CARD_EXIST.stripeUserId, previousResult.CHECK_CARD_EXIST.cardToken, applicationFee, dataToSave.bookingAmount,
                    previousResult.GET_DOCK_DETAILS.userId.stripeAccountId, previousResult.BOOK_DOCK.id, function (err, transId) {
                        logger.error("error in capture amount......", err);
                        logger.info("result of capture amount......", transId);
                        if (err) {
                            paymentStatus = 1;
                            DAO.update(Models.bookings, {
                                    _id: previousResult.BOOK_DOCK.id
                                }, {
                                    $set: {
                                        bookingStatus: CONSTANTS.BOOKING_STATUS.REJECTED,
                                        paymentStatus: CONSTANTS.PAYMENT_STATUS.FAILED
                                    }
                                },
                                {lean: true}, (err, res) => {
                                    callback(ERROR.PAYMENT_FAILURE);
                                });
                        }
                        else {
                            paymentStatus = 2;
                            paymentHoldStatus = CONSTANTS.PAYMENT_STATUS.COMPLETED;
                            transactionId = transId;
                            DAO.update(Models.bookings, {
                                _id: previousResult.BOOK_DOCK.id
                            }, {
                                $set: {
                                    paymentStatus: paymentHoldStatus,
                                    transactionId: transactionId
                                }
                            }, {lean: true}, callback)
                        }
                    })
            }
            else if (moment()._d >= moment(payloadData.bookingStartDateTime).add(-previousResult.GET_ADMIN_DEFAULT[0].paymentAmountHoldBefore, 'minutes')._d && dataToSave.bookingAmount > 0)            // If booking time is greater than 2 hours and less than 24 hours from current time
            {
                stripeManager.holdAmount(previousResult.CHECK_CARD_EXIST.stripeUserId, previousResult.CHECK_CARD_EXIST.cardToken, applicationFee, dataToSave.bookingAmount,
                    previousResult.GET_DOCK_DETAILS.userId.stripeAccountId, previousResult.BOOK_DOCK.id, function (err, transId) {
                        logger.error("error in capture amount......", err);
                        logger.info("result of capture amount......", transId);
                        if (err) {
                            paymentStatus = 1;
                            DAO.update(Models.bookings, {
                                    _id: previousResult.BOOK_DOCK.id
                                }, {
                                    $set: {
                                        bookingStatus: CONSTANTS.BOOKING_STATUS.REJECTED,
                                        paymentStatus: CONSTANTS.PAYMENT_STATUS.FAILED
                                    }
                                },
                                {lean: true}, (err, res) => {
                                    callback(ERROR.PAYMENT_FAILURE);
                                });
                        }
                        else {
                            paymentStatus = 2;
                            paymentHoldStatus = CONSTANTS.PAYMENT_STATUS.HOLD;
                            transactionId = transId;
                            DAO.update(Models.bookings, {
                                _id: previousResult.BOOK_DOCK.id
                            }, {
                                $set: {
                                    paymentStatus: paymentHoldStatus,
                                    transactionId: transactionId
                                }
                            }, {lean: true}, callback)
                        }
                    })
            }
            else callback(null, {});

            //callback(null,{})
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            callbackRoute(null, {});

            if (paymentStatus != 1) {
                let notificationData = {
                    message: authData.firstName + " " + authData.lastName + PUSH_MSG.DOCK_BOOKED + moment(payloadData.bookingStartDateTime).add(payloadData.timeOffSet, 'minutes')._d,
                    flag: PUSH_FLAG.DOCK_BOOKING,
                    data: {
                        dockId: payloadData.dockId
                    }
                };

                Lib.notificationManager.sendFCMPushNotification([res.GET_DOCK_DETAILS.userId.deviceDetails.deviceToken], notificationData, (err, pushRes) => {
                    logger.error("dock book push err---->>>>", err);
                    logger.info("dock book push result---->>>>", pushRes);
                });
            }
        }
    })
};

/*---------------------------------------------------------------------------------------------------------
 * Cancel Booking
 * INPUT - bookingId
 * --------------------------------------------------------------------------------------------------------*/
exports.cancelBooking = (authData, payloadData, callbackRoute) => {

    let dataToUpdate = {
        bookingStatus: CONSTANTS.BOOKING_STATUS.USER_CANCELLED,
        cancelDateTime: new Date(),
        cancelReason: payloadData.cancelReason
    };

    async.auto({
        GET_BOOKING_DETAILS: (callback) => {

            let query = {
                _id: payloadData.bookingId,
                bookingStatus: {
                    $in: [
                        CONSTANTS.BOOKING_STATUS.PENDING,
                        CONSTANTS.BOOKING_STATUS.CONFIRMED
                    ]
                }
            };

            if (payloadData.flag == 1) query.userId = authData._id;
            else query.dockId = payloadData.dockId;

            DAO.getData(Models.bookings, query, {}, {lean: true}, (err, res) => {
                if (err) callback(err);
                else if (res.length) callback(null, res[0]);
                else callback(ERROR.BOOKING_NOT_FOUND)
            })
        },
        REFUND_AMOUNT: ['GET_BOOKING_DETAILS', (previousResult, callback) => {
            if (payloadData.flag == 2 && previousResult.GET_BOOKING_DETAILS.transactionId != "") {
                stripeManager.refundAmount(previousResult.GET_BOOKING_DETAILS.transactionId, (err, res) => {
                    if (err) callback(err);
                    else {
                        dataToUpdate.refundAmount = previousResult.GET_BOOKING_DETAILS.bookingAmount;
                        dataToUpdate.bookingStatus = CONSTANTS.BOOKING_STATUS.DOCK_OWNER_CANCEL;
                        callback(null, {});
                    }
                });
            }
            else
                callback(null, {})
        }],
        CANCEL_BOOKING: ['GET_BOOKING_DETAILS', 'REFUND_AMOUNT', (previousResult, callback) => {

            DAO.update(Models.bookings, {_id: payloadData.bookingId},
                {$set: dataToUpdate}, {lean: true}, callback)
        }],
        GET_COUNT: ['GET_BOOKING_DETAILS', 'CANCEL_BOOKING', 'REFUND_AMOUNT', (previousResult, callback) => {

            let query = {
                bookingStartDateTime: {$gte: new Date()},
                $or: [
                    {bookingEndDateTime: {$lt: new Date()}},
                    {
                        bookingStatus: {
                            $in: [
                                CONSTANTS.BOOKING_STATUS.CONFIRMED,
                                CONSTANTS.BOOKING_STATUS.PENDING
                            ]
                        }
                    }],
                userId: authData._id
            };

            DAO.count(Models.bookings, query, callback)
        }]
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            let populate = [{
                path: "dockId",
                select: "-__v -__id -isBlocked -isDeleted -createdOn",
                populate: [{path: "userId", select: "firstName lastName"}, {
                    path: "aminities",
                    select: "aminityName aminityLogo"
                }],
                match: {},
                option: {lean: true}
            }, {
                path: "userId",
                select: "firstName lastName countryCode phoneNumber profilePic",
                match: {},
                option: {lean: true}
            }];

            let projection = {
                cardId: 0,
                __v: 0,
                createdOn: 0
            };

            let query = {
                $and: [
                    {bookingEndDateTime: {$gt: new Date()}},
                    {
                        bookingStatus: {
                            $in: [
                                CONSTANTS.BOOKING_STATUS.CONFIRMED,
                                CONSTANTS.BOOKING_STATUS.PENDING
                            ]
                        }
                    }]
            };

            if (payloadData.flag == 1) query.userId = authData._id;
            else query.dockId = payloadData.dockId;

            let option = {
                lean: true,
                skip: 0,
                limit: 50,
                sort: {
                    bookingStartDateTime: 1
                }
            };

            DAO.populateData(Models.bookings, query, projection, option, populate, (err, finalRes) => {
                if (err) callbackRoute(err);
                else callbackRoute(null, {
                    count: res.GET_COUNT,
                    list: finalRes
                })
            });
        }
    })
};

/*---------------------------------------------------------------------------------------------------------
 * request for post meetup
 * INPUT - accessToken
 * --------------------------------------------------------------------------------------------------------*/
exports.postMeetupRequest = (authData, callbackRoute) => {

    DAO.findAndUpdate(Models.user, {_id: authData._id, canPostMeetup: 0}, {canPostMeetup: 1}, {
        lean: true,
        new: true
    }, (err, res) => {
        if (err) callbackRoute(err);
        else if (res) {
            let dataToSend = {
                firstName: res.firstName,
                userBio: res.userBio,
                lastName: res.lastName,
                email: res.email,
                countryCode: res.countryCode,
                phoneNumber: res.phoneNumber,
                profilePic: res.profilePic,
                homeLake: res.homeLake,
                homeMarina: res.homeMarina,
                allowNotifications: res.allowNotifications,
                canPostMeetup: res.canPostMeetup,
                accessToken: res.accessToken,
                appVersion: res.appVersion,
                boatDetails: res.boatDetails
            };

            callbackRoute(null, {userDetails: dataToSend})
        }
        else callbackRoute(ERROR.USER_NOT_FOUND)
    })
};

/*---------------------------------------------------------------------------------------------------------
 * get details
 * INPUT - flag _id
 * --------------------------------------------------------------------------------------------------------*/
exports.getDetails = (queryData, callbackRoute) => {
    let query = {
        _id: queryData._id
    };

    let populate = [{
        path: "userId",
        select: "firstName lastName profilePic",
        option: {lean: true},
        match: {}
    }, {
        path: "userGoing",
        select: "firstName lastName profilePic",
        option: {lean: true},
        match: {}
    }, {
        path: "aminities",
        select: "aminityName aminityLogo",
        option: {lean: true},
        match: {}
    }];

    let projection = {
        isBlocked: 0,
        isDeleted: 0,
        createdOn: 0
    };

    async.auto({
        CHOOSE_MODEL: (callback) => {
            switch (queryData.flag) {
                case 1 : {
                    callback(null, Models.tieups);
                    break;
                }
                case 2 : {
                    callback(null, Models.meetUps);
                    break;
                }
                default : {
                    callback(null, Models.dock);
                    break;
                }
            }
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else DAO.populateData(res.CHOOSE_MODEL, query, projection, {lean: true}, populate, callbackRoute)
    })
};

/*----------------------------------------------------------------------------------------------------\
 * Get Top Meetups
 * INPUT: limit skip
 *-------------------------------------------------------------------------------------------------- */

exports.getTopMeetup = (authData, queryData, callbackRoute) => {

    let criteria = {
        endDateTime: {$gt: new Date()},
        isBlocked: false,
        isDeleted: false,
        isVerified: true
    };

    let projection = {
        isBlocked: 0,
        isDeleted: 0,
        isVerified: 0,
        createdOn: 0,
        __v: 0
    };

    let option = {
        lean: true,
        sort: {
            totalUserGoingCount: -1
        },
        skip: queryData.skip
    };

    if (queryData.limit) option.limit = queryData.limit;

    let populate = [
        {
            path: "userId",
            select: "firstName lastName countryCode phoneNumber profilePic _id",
            match: {},
            option: {lean: true}
        },
        {
            path: "userGoing",
            select: "firstName lastName profilePic",
            match: {},
            option: {lean: true}
        }
    ];

    DAO.populateData(Models.meetUps, criteria, projection, option, populate, (err, res) => {
        if (err) callbackRoute(err);
        else if (res.length > 0 && res[0].hasOwnProperty("userGoing")) {

            async.forEachSeries(res, (item, innerCallback) => {

                item.userGoing = _.map(item.userGoing, (item) => {
                    return {
                        _id: item._id.toString()
                    }
                });

                if (_.contains(_.pluck(item.userGoing, '_id'), authData._id.toString())) {

                    if (item.userId && item.userId._id.toString() == authData._id.toString()) {
                        item.ownBeacon = true;
                    }
                    else item.ownBeacon = false;

                    item.flag = 1;
                    innerCallback();
                }
                else {

                    if (item.userId && item.userId._id.toString() == authData._id.toString()) {
                        item.ownBeacon = true;
                    }
                    else item.ownBeacon = false;

                    item.flag = 0;
                    innerCallback();
                }

            }, (err) => {
                callbackRoute(null, res)
            })
        }
        else callbackRoute(null, res)
    });
};

/*----------------------------------------------------------------------------------------------------\
 * updateBeaconStatus
 * INPUT: latitude longitude
 *-------------------------------------------------------------------------------------------------- */

exports.updateBeaconStatus = (authData, payloadData, callbackRoute) => {

    async.auto({
        GET_ADMIN_DEFAULT: (callback) => {
            DAO.getData(Models.adminDefaults, {}, {deleteTieupAfter: 1}, {lean: true}, callback)
        },
        GET_DISTANCE_OF_BEACON: (callback) => {

            let geoNear = {
                $geoNear: {
                    near: {type: "Point", coordinates: [payloadData.longitude, payloadData.latitude]},
                    distanceField: "distance",
                    query: {
                        userId: authData._id,
                        isDeleted: false
                    },
                    distanceMultiplier: 0.001,
                    spherical: true
                }
            };

            DAO.aggregateData(Models.tieups, [geoNear], callback)
        },
        DELETE_OWN_TIEUP: ['GET_ADMIN_DEFAULT', 'GET_DISTANCE_OF_BEACON', (previousResult, callback) => {
            if (previousResult.GET_DISTANCE_OF_BEACON.length &&
                previousResult.GET_DISTANCE_OF_BEACON[0].distance >= previousResult.GET_ADMIN_DEFAULT[0].deleteTieupAfter) {

                DAO.findAndUpdate(Models.tieups, {
                    userId: authData._id,
                    isDeleted: false
                }, {isDeleted: true}, {lean: true, new: true}, callbackRoute)
            }
            else callback(null, {})
        }]
    }, (err, finalRes) => {
        if (err) callbackRoute(err);
        else if (finalRes.GET_DISTANCE_OF_BEACON.length &&
            finalRes.GET_DISTANCE_OF_BEACON[0].distance >= finalRes.GET_ADMIN_DEFAULT[0].deleteTieupAfter) {

            DAO.update(Models.tieups, {
                userGoing: {$in: [authData._id]},
                isDeleted: false
            }, {$pull: {userGoing: authData._id}}, {lean: true}, callbackRoute)
        }
        else callbackRoute(null, {})
    })
};

/*----------------------------------------------------------------------------------------------------\
 * setAccountId
 * INPUT: email stripeAccountId
 *-------------------------------------------------------------------------------------------------- */

exports.setAccountId = (payloadData, callbackRoute) => {

    async.auto({
        CONNECT_USER: (callback) => {

            let formData = {
                client_secret: CONFIG.stripeCredentials.stripeToken,
                code: payloadData.stripeAccountId,
                grant_type: 'authorization_code'
            };

            let options = {
                url: 'https://connect.stripe.com/oauth/token',
                form: formData
            };

            request.post(options, (error, response, body) => {
                if (error) callback(error);
                else {
                    body = JSON.parse(body);
                    logger.debug("body data--->>", body);
                    callback(null, body.stripe_user_id)
                }
            });
        }
    }, (err, res) => {
        if (err) callbackRoute(err);
        else {
            DAO.update(Models.user, {_id: payloadData.userId}, {$set: {stripeAccountId: res.CONNECT_USER}},
                {lean: true}, (err, res) => {
                    if (err) callbackRoute(err);
                    else if (res.n == 0) callbackRoute(ERROR.USER_NOT_FOUND);
                    else callbackRoute(null, {})
                })
        }
    })
};

