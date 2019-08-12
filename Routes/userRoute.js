/**
 * Created by CBL40 on 7/22/17.
 */
'use strict';
let UniversalFunc = require('../Utils/universalFunctions'),
    CONSTANTS = require('../Config').constants,
    Joi = require('joi'),
    Controller = require('../Controller').userController,
    adminController = require('../Controller').adminController,
    swaggerResponse = require('../Config').responseMessages.swaggerDefaultResponseMessages,
    SUCCESS = require('../Config').responseMessages.SUCCESS,
    ERROR = require('../Config').responseMessages.ERROR,
    routes = [],
    DOA = require('../DAOManager').queries,
    Models = require('../Models').dbkey;

    exports.register = {
        method: 'POST',
        path: '/api/user/register',
        config: {
            description: 'Register a new user',
            tags: ['api', 'user'],
            // payload: {
            //     maxBytes: 5000000,                                                              // max 5MB
            //     output: 'stream',
            //     parse: true,
            //     allow: 'multipart/form-data'
            // },
            handler: (request, reply) => {
                if (!request.payload.password && !request.payload.socialId) reply(UniversalFunc.sendError(ERROR.ENTER_EITHER_SOCIALID_OR_PWD));
                else Controller.registerUser(request.payload, (error, success) => {
                    if (error) reply(UniversalFunc.sendError(error));
                    else if (request.payload.registeredBy == 1 && request.payload.password) reply(UniversalFunc.sendSuccess(SUCCESS.USER_REGISTERED, success));
                    else reply(UniversalFunc.sendSuccess(SUCCESS.REGISTERED, success));
                });
            },
            validate: {
                payload: {
                    firstName: Joi.string().trim().required().min(2).description("First Letter must be capital"),
                    lastName: Joi.string().trim().required().allow("").description("First Letter must be capital"),
                    email: Joi.string().trim().email({minDomainAtoms: 2}).required().description("all letter must be small"),
                    countryCode: Joi.string().trim().required().description("send it with + sign. e.g.-> For India it's +91"),
                    phoneNumber: Joi.string().required().min(5).max(15).trim(),
                    password: Joi.string().trim().min(6).optional(),
                    socialId: Joi.string().optional(),
                    registeredBy: Joi.number().required().default(CONSTANTS.REGISTERED_VIA.EMAIL).valid([
                        CONSTANTS.REGISTERED_VIA.ADMIN,
                        CONSTANTS.REGISTERED_VIA.EMAIL,
                        CONSTANTS.REGISTERED_VIA.FACEBOOK,
                        CONSTANTS.REGISTERED_VIA.GOOGLE,
                        CONSTANTS.REGISTERED_VIA.TWITTER]).description("0 for admin, 1 for email, 2 for facebook, 3 for google, 4 for twitter"),
                    deviceType: Joi.number().required().valid([
                        CONSTANTS.DEVICE_TYPE.IOS,
                        CONSTANTS.DEVICE_TYPE.ANDROID]).description("2 for ios, 1 for android"),
                    deviceToken: Joi.string().trim().required(),
                    appVersion: Joi.number().required(),
                    socialImageURL: Joi.string().optional(),
                    latitude: Joi.number().required().min(-90).max(90),
                    longitude: Joi.number().required().min(-180).max(180)
                },
                failAction: UniversalFunc.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: swaggerResponse
                }
            }
        }
    };
    exports.base = {
        method: 'POST',
        path: '/api/mem/base',
        config: {
            description: 'Regissster a new user',
            tags: ['api'],
            // payload: {
            //     maxBytes: 5000000,                                                              // max 5MB
            //     output: 'stream',
            //     parse: true,
            //     allow: 'multipart/form-data'
            // },
            handler: (request, reply) => {
                Controller.add(request.payload, (error, success) => {
                    if (error) reply(UniversalFunc.sendError(error));
                     else reply(UniversalFunc.sendSuccess(SUCCESS.REGISTERED, success));
                });
            },
            validate: {
                payload: {
                    firstName: Joi.string().trim().required().min(2).description("First Letter must be capital"),
                    lastName: Joi.string().trim().required().allow("").description("First Letter must be capital"),
                    email: Joi.string().trim().email({minDomainAtoms: 2}).required().description("all letter must be small"),
                    appVersion: Joi.number().required(),
                    countryCode: Joi.string().trim().required().description("send it with + sign. e.g.-> For India it's +91"),
                    phoneNumber: Joi.string().required().min(5).max(15).trim()
                   
                    
                   
                },
                failAction: UniversalFunc.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: swaggerResponse
                }
            }
        }
    };
    exports.sample = {
        method: 'GET',
        path: '/api/listing',
        config: {
            description: 'Regissster a new user',
            tags: ['api'],
            // payload: {
            //     maxBytes: 5000000,                                                              // max 5MB
            //     output: 'stream',
            //     parse: true,
            //     allow: 'multipart/form-data'
            // },
            handler: (request, reply) => {
                console.log(request.orig.query);

                let data = [
                    {limo:3},{sam:11},{harsh:34}
                ];
                DOA.saveData(Models, {dbkey:request.orig.query.dbkey}, function (err, result1) {
                    console.log("................222222222222.................")
                    if (err) {
                        reply(UniversalFunc.sendSuccess(SUCCESS.REGISTERED, data));
                    }
                    else {
                        reply(UniversalFunc.sendSuccess(SUCCESS.REGISTERED, data));
                    }
                })
        
                
                
               
             
            },
            validate: {
                query: {
                  
                    dbkey: Joi.string().trim().required()
                    
                   
                },
                failAction: UniversalFunc.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: swaggerResponse
                }
            }
        }
    };
// exports.verifyLink = {
//     method: 'GET',
//     path: '/api/user/forgotPassword/verifyLink',
//     config: {
//         description: 'verify Link of user',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             Controller.verifyLink(request.query,(error, success)=> {
//                 if (error) return reply(UniversalFunc.sendError(error));
//                 else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//             });
//         },
//         validate: {
//             query : {
//                 pwdTkn: Joi.string().required()
//             },
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };
exports.verifyUser = {
    method: 'GET',
    path: '/api/user/verifyUser',
    config: {
        description: 'Verify User',
        tags: ['api', 'User'],
        handler: (request, reply) => {
            Controller.verifyUser(request.query, (error, success) => {
                if (error) {
                    if(error.type==ERROR.ALREADY_VERIFIED.type)
                    reply('<html><body><h1><marquee  behavior="alternate">Already Verified enjoy!:)</marquee></h1></body></html>');
                    else
                        reply('<html><body background=""><h1><marquee  behavior="alternate">User does not exist:(</marquee></h1></body></html>');

                }
              //  else reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                else reply('<html><body><h1><marquee  behavior="alternate">Congrats! You are a verified user now. Go Login:)</marquee></h1></body></html>');
            });
        },
        validate: {
            query: {
                emailPhoneNumber: Joi.string().required(),
            },
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.resendOTP = {
    method: 'PUT',
    path: '/api/user/resendOTP',
    config: {
        description: 'Resend OTP to user',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            Controller.resendOTP(request.payload, (error, success) => {
                if (error) reply(UniversalFunc.sendError(error));
                else reply(UniversalFunc.sendSuccess(SUCCESS.RESEND_OTP, success));
            });
        },
        validate: {
            payload: {
                emailPhoneNumber: Joi.string().required()
            },
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.loginUser = {
    method: 'PUT',
    path: '/api/user/login',
    config: {
        description: 'Login user',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if ((request.payload.loginBy == "email" && request.payload.emailPhoneNumber && request.payload.password) ||
                (request.payload.loginBy == "social" && request.payload.socialId)) {
                Controller.loginUser(request.payload, (error, success) => {
                    if (error) reply(UniversalFunc.sendError(error));
                    else if (success.isVerified == false) reply(UniversalFunc.sendSuccess(ERROR.USER_NOT_VERIFIED,
                        {userDetails: {phoneNumber: success.phoneNumber, countryCode: success.countryCode}}));
                    else reply(UniversalFunc.sendSuccess(SUCCESS.LOGGED_IN, success));
                });
            }
            else if (request.payload.loginBy == "email" && request.payload.emailPhoneNumber) reply(UniversalFunc.sendError(ERROR.PASSWORD_REQUIRED));
            else if (request.payload.loginBy == "email" && request.payload.password) reply(UniversalFunc.sendError(ERROR.EMAIL_PHONE_REQUIRED));
            else if (request.payload.loginBy == "email") reply(UniversalFunc.sendError(ERROR.EMAIL_PHONE_PASSWORD_REQUIRED));
            else reply(UniversalFunc.sendError(ERROR.SOCIAL_ID_REQUIRED));
        },
        validate: {
            payload: {
                loginBy: Joi.string().required().valid(["email", "social"]).default("email"),
                emailPhoneNumber: Joi.string().optional().allow(""),
                password: Joi.string().optional(),
                socialId: Joi.string().trim().optional(),
                deviceType: Joi.number().required().valid([
                    CONSTANTS.DEVICE_TYPE.IOS,
                    CONSTANTS.DEVICE_TYPE.ANDROID]).description("2 for ios, 1 for android"),
                deviceToken: Joi.string().required(),
                appVersion: Joi.number().required(),
                latitude: Joi.number().required().min(-90).max(90),
                longitude: Joi.number().required().min(-180).max(180),
            },
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.refreshDeviceToken = {
    method: 'PUT',
    path: '/api/user/refreshDeviceToken',
    config: {
        description: 'refreshDeviceToken user',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {

            Controller.refreshDeviceToken(request.payload,request.auth.credentials.authData ,(error, success) => {
                if (error) reply(UniversalFunc.sendError(error));
                else if (success.isVerified == false) reply(UniversalFunc.sendSuccess(ERROR.USER_NOT_VERIFIED,
                    {userDetails: {phoneNumber: success.phoneNumber, countryCode: success.countryCode}}));
                else reply(UniversalFunc.sendSuccess(SUCCESS.LOGGED_IN, success));
            });
        },
        validate: {
            payload: {

                deviceType: Joi.number().required().valid([
                    CONSTANTS.DEVICE_TYPE.IOS,
                    CONSTANTS.DEVICE_TYPE.ANDROID]).description("2 for ios, 1 for android"),
                deviceToken: Joi.string().required(),
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.accessTokenLogin = {
    method: 'PUT',
    path: '/api/user/accessTokenLogin',
    config: {
        description: 'Login user through access token',
        auth: 'UserAuth',
        tags: ['api', 'User'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.accessTokenLogin(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                deviceType: Joi.number().required().valid([
                    CONSTANTS.DEVICE_TYPE.IOS,
                    CONSTANTS.DEVICE_TYPE.ANDROID]).description("0 for ios, 1 for android"),
                deviceToken: Joi.string().trim().required(),
                appVersion: Joi.number().required(),
                latitude: Joi.number().required().min(-90).max(90),
                longitude: Joi.number().required().min(-180).max(180)
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.logout = {
    method: 'PUT',
    path: '/api/user/logout',
    config: {
        description: 'logout user',
        auth: 'UserAuth',
        tags: ['api', 'User'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth')) {
                Controller.logout(request.auth.credentials.authData, (error, success) => {
                    if (error) reply(UniversalFunc.sendError(error));
                    else reply(UniversalFunc.sendSuccess(SUCCESS.LOGOUT, null));
                });
            } else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.changePassword = {
    method: 'PUT',
    path: '/api/user/changePassword',
    config: {
        description: 'change password of user',
        auth: 'UserAuth',
        tags: ['api', 'User'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.changePassword(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.PASSWORD_CHANGED, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                oldPassword: Joi.string().required(),
                newPassword: Joi.string().required().min(6)
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.forgotPassword = {
    method: 'PUT',
    path: '/api/user/forgotPassword',
    config: {
        description: 'forgot password of user',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            Controller.forgotPassword(request.payload, (error, success) => {
                if (error) return reply(UniversalFunc.sendError(error));
                else return reply(UniversalFunc.sendSuccess(SUCCESS.NEW_PASSWORD_LINK_SENT, success));
            });
        },
        validate: {
            payload: {
                email: Joi.string().email({minDomainAtoms: 2}).required()
            },
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.verifyLink = {
    method: 'GET',
    path: '/api/user/forgotPassword/verifyLink',
    config: {
        description: 'verify Link of user',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            Controller.verifyLink(request.query, (error, success) => {
                if (error) return reply(UniversalFunc.sendError(error));
                else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
            });
        },
        validate: {
            query: {
                pwdTkn: Joi.string().required()
            },
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.updatePassword = {
    method: 'PUT',
    path: '/api/user/forgotPassword/updatePassword',
    config: {
        description: 'update forgotten password of user',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            Controller.updatePassword(request.payload, (error, success) => {
                if (error) return reply(UniversalFunc.sendError(error));
                else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
            });
        },
        validate: {
            payload: {
                token: Joi.string().required(),
                password: Joi.string().required()
            },
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.editProfile = {
    method: 'PUT',
    path: '/api/user/editProfile',
    config: {
        description: 'Edit User Profile',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        // payload: {
        //     maxBytes: 5000000,                                                              // max 5MB
        //     output: 'stream',
        //     parse: true,
        //     allow: 'multipart/form-data'
        // },
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.editProfile(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                firstName: Joi.string().trim().required().min(2).description("First Letter must be capital"),
                lastName: Joi.string().trim().required().allow("").description("First Letter must be capital"),
                // email: Joi.string().trim().email({minDomainAtoms: 2}).required().description("all letter must be small"),

                isFile: Joi.boolean().default(false).required(),
                profilePic: Joi.object().keys({
                    original: Joi.string().default(""),
                    thumbnail: Joi.string().default("")
                }).optional(),
                phoneNumber: Joi.number().min(10).required(),
                countryCode: Joi.string().trim().required().description("send it with + sign. e.g.-> For India it's +91"),

            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.addFriends = {
    method: 'PUT',
    path: '/api/user/addFriends',
    config: {
        description: 'add friend',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.addFriends(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                friends: Joi.array().items(Joi.string().required()),
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.getMyFriends = {
    method: 'GET',
    path: '/api/user/friendsList',
    config: {
        description: 'Get My Friends',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getMyFriends(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getWorkoutsToStart = {
    method: 'GET',
    path: '/api/user/getWorkoutsToStart',
    config: {
        description: 'Get Workouts listing to start',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getWorkoutsToStart(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getAdminSettingsValues = {
    method: 'GET',
    path: '/api/user/getAdminSettingsValues',
    handler: (request, reply)=> {
        if (request.hasOwnProperty('auth')) {
            adminController.getAdminSettingsValues(request.query, (error, success)=> {
                if (error) return reply(UniversalFunc.sendError(error));
                else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
            });
        } else reply(ERROR.INVALID_TOKEN);
    },
    config: {
        description: 'getAdminSettingsValues',
        tags: ['api', 'admin'],
        auth: 'UserAuth',
        validate: {
            query : {
                type:Joi.string().required().valid([
                    CONSTANTS.ADMIN_SETTINGS.ADMIN_SHARE,
                    CONSTANTS.ADMIN_SETTINGS.ADVERTISEMENT_COIN
                ])
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType : 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.workoutsListing = {
    method: 'GET',
    path: '/api/user/workoutsListing',
    config: {
        description: 'Get Workouts listing for goals',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.workoutsListing(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            // query : {
            //     limit : Joi.number().default(10).required(),
            //     skip : Joi.number().default(0).required()
            // },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.addGoals = {
    method: 'PUT',
    path: '/api/user/addGoals',
    config: {
        description: 'add goals',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.addGoals(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                id:Joi.string().optional().description(" in case of edit "),
                workoutId: Joi.string().required(),
                workoutDay: Joi.string().required().valid([
                    CONSTANTS.GOAL_DURATION.DAILY,
                    CONSTANTS.GOAL_DURATION.MONTHLY,
                    CONSTANTS.GOAL_DURATION.WEEKLY
                ]),
                target: Joi.number().default(0).required(),
                //    duration : Joi.number().default(0).required(),
                typeOfGoal: Joi.string().valid([
                    CONSTANTS.GOAL_TYPES.CALORIES,
                    CONSTANTS.GOAL_TYPES.DURATION,
                    CONSTANTS.GOAL_TYPES.KILOMETERS
                ]).required(),
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.getGoalsListing = {
    method: 'GET',
    path: '/api/user/getGoalsListing',
    config: {
        description: 'Get Goals listing',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getGoalsListing(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            // query : {
            //     limit : Joi.number().default(10).required(),
            //     skip : Joi.number().default(0).required()
            // },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.feelingsListing = {
    method: 'GET',
    path: '/api/user/feelingsListing',
    config: {
        description: 'Feelings Listing',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.feelingsListing(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            // query : {
            //     limit : Joi.number().default(10).required(),
            //     skip : Joi.number().default(0).required()
            // },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.addWorkoutDetails = {
    method: 'PUT',
    path: '/api/user/addWorkoutDetails',
    config: {
        description: 'add workout details',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.addWorkoutDetails(request.auth.credentials.authData, request.payload, (error, success) => {

                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                flag: Joi.string().required().valid(["BEFORE_START", "START", "STOP", "AFTER_STOP", "SAVE_ROUTE"]),
                selectedWorkoutId: Joi.string().optional().description('except BEFORE_START'),
                workoutId: Joi.string().optional().description("BEFORE_START"),
                isChallenged: Joi.boolean().optional().description("BEFORE_START").default(false),
                challengedWorkoutId: Joi.string().optional().description("BEFORE_START"),
                challengeId:Joi.string().optional().description("BEFORE_START"),
                workoutName: Joi.string().optional().description("BEFORE_START"),
                restRate: Joi.number().optional().default(0).valid([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).description("BEFORE_START"),
                restText: Joi.string().optional(),
                eatRate: Joi.number().optional().default(0).valid([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).description("BEFORE_START"),
                eatText: Joi.string().optional(),
                feelRate: Joi.number().optional().default(0).valid([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).description("BEFORE_START"),
                feelText: Joi.string().optional(),
                sleepRate: Joi.number().optional().default(0).valid([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).description("BEFORE_START"),
                sleepText: Joi.string().optional(),
                preNote: Joi.string().optional().description("BEFORE_START"),

                distanceTravelled: Joi.number().optional().description("STOP"),
                durationTravelled: Joi.number().optional().description("STOP"),
                challengeDuration:Joi.number().optional().description("STOP"),
                stepsTaken: Joi.number().optional().description("STOP"),
                caloriesBurnt: Joi.number().optional().description("STOP"),
                heartRate: Joi.number().optional().description("STOP"),

                route: Joi.array().items(Joi.object().keys({
                    time: Joi.number().required(),
                    distance: Joi.number().required(),
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                })).optional().description("{latitude:,longitude:,time:,distance:}"),

                speed: Joi.number().optional().description("STOP"),
                //startedAt: Joi.string().optional().description("START"),
                endAt: Joi.string().optional().description("STOP"),
                //weather:Joi.string().optional().description("1"),
                isGhostRun: Joi.boolean().optional().description("START"),
                ghostWorkoutId: Joi.string().optional().description("START"),
                routeName: Joi.string().optional().description("START SAVE_ROUTE"),

                percievedEffort: Joi.number().optional().default(0).valid([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).description("AFTER_STOP"),
                percievedEffortText: Joi.string().optional(),

                postNote: Joi.string().optional().description("AFTER_STOP"),
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.getUserWorkoutHistory = {
    method: 'GET',
    path: '/api/user/getUserWorkoutHistory',
    config: {
        description: 'history for user workout',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getUserWorkoutHistory(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                date: Joi.string().required().description("MM/DD/YYYY"),
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getLeaderBoards = {
    method: 'GET',
    path: '/api/user/getLeaderBoards',
    config: {
        description: 'leaderboards according to calories',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getLeaderBoards(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {

            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getUserWorkoutDetails = {
    method: 'GET',
    path: '/api/user/getUserWorkoutDetails',
    config: {
        description: 'history for user workout',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getUserWorkoutDetails(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                id: Joi.string().required(),
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

// exports.allowNotification = {
//     method: 'PUT',
//     path: '/api/user/allowNotification',
//     config: {
//         description: 'Allow/ Dis-allow Notification',
//         auth: 'UserAuth',
//         tags: ['api', 'User'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.allowNotification(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) reply(UniversalFunc.sendError(error));
//                     else reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 notificationFlag : Joi.boolean().required().default(false)
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

exports.getProfile = {
    method: 'GET',
    path: '/api/user/getProfile',
    config: {
        description: 'Get User Profile',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getProfile(request.auth.credentials.authData, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getMyCoins = {
    method: 'GET',
    path: '/api/user/getMyCoins',
    config: {
        description: 'Get My coins',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, {coins:request.auth.credentials.authData.coins}));

            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getMyRoutes = {
    method: 'GET',
    path: '/api/user/getMyRoutes',
    config: {
        description: 'Get My Routes',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getMyRoutes(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                workoutId: Joi.string().optional(),
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getWorkoutsByRouteName = {
    method: 'GET',
    path: '/api/user/getWorkoutsByRouteName',
    config: {
        description: 'gwt workout and its filters',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

                Controller.getWorkoutsByRouteName(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                routeName: Joi.string().required(),
                id: Joi.string().optional(),
                restRate: Joi.boolean().optional(),
                eatRate: Joi.boolean().optional(),
                sleepRate: Joi.boolean().optional(),
                feelRate: Joi.boolean().optional(),
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

/*exports.getWorkoutsByRouteName = {
    method: 'GET',
    path: '/api/user/getWorkoutsByRouteName',
    config: {
        description: 'gwt workout and its filters',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

                Controller.getWorkoutsByRouteName(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                routeName: Joi.string().required(),
                id: Joi.string().optional(),
                restRate: Joi.boolean().optional(),
                eatRate: Joi.boolean().optional(),
                sleepRate: Joi.boolean().optional(),
                feelRate: Joi.boolean().optional(),
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};*/


exports.getUserStats = {
    method: 'GET',
    path: '/api/user/getUserStats',
    config: {
        description: 'get user stats',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

                Controller.getUserStats(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                startDate: Joi.string().required().description("MM/DD/YYYY"),
                endDate: Joi.string().required().description("MM/DD/YYYY"),
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.getWorkoutSpecificGraph = {
    method: 'GET',
    path: '/api/user/getWorkoutSpecificGraph',
    config: {
        description: 'yearly graph for',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

                Controller.getWorkoutSpecificGraph(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                workoutId: Joi.string().required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};


exports.editMyParameters = {
    method: 'PUT',
    path: '/api/user/editMyParameters',
    config: {
        description: 'edit my parameters',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.editMyParameters(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                age: Joi.number().optional(),
                gender: Joi.string().valid([CONSTANTS.GENDER.MALE, CONSTANTS.GENDER.FEMALE]).optional(),
                weight: Joi.number().optional(),
                height: Joi.number().optional(),
                units: Joi.string().valid([CONSTANTS.UNITS.KGCM, CONSTANTS.UNITS.LBSFT])
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.getNotifications = {
    method: 'GET',
    path: '/api/user/getNotifications',
    config: {
        description: 'get users notification',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

                Controller.getNotifications(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};

exports.postAChallenge = {
    method: 'PUT',
    path: '/api/user/postAChallenge',
    config: {
        description: 'postAChallenge',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.postAChallenge(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                type:Joi.string().valid([
                    CONSTANTS.CHALLENGE_TYPES.PREVIOUS_WORKOUT,
                    CONSTANTS.CHALLENGE_TYPES.CUSTOM
                ]).required(),
                targetTime:Joi.number().optional(),
                targetDistance:Joi.number().optional(),
                workoutId:Joi.string().optional(),
                expiryTime: Joi.number().required(),
                challengedTo: Joi.array().required(),
                userWorkoutId: Joi.string().optional(),
                coins: Joi.number().required(),
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.challengesListing = {
    method: 'GET',
    path: '/api/user/getChallengesListing',
    config: {
        description: 'challengesListing',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.challengesListing(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                type: Joi.string().required().valid(["MY_CHALLENGE", "NEW_CHALLENGES", "HISTORY"]),
                limit: Joi.number().default(10).required(),
                skip: Joi.number().default(0).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.getAParticularChallenge = {
    method: 'GET',
    path: '/api/user/getAParticularChallenge',
    config: {
        description: 'getAParticularChallenge',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getAParticularChallenge(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                  id:Joi.string().required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.acceptRejectChallenge = {
    method: 'PUT',
    path: '/api/user/acceptRejectChallenge',
    config: {
        description: 'acceptRejectChallenge',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.acceptRejectChallenge(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                type: Joi.string().required().valid([
                    CONSTANTS.CHALLENGE_TYPES.ACCEPTED,
                    CONSTANTS.CHALLENGE_TYPES.REJECTED
                ]),
                reason:Joi.string().optional(),
                coins: Joi.number().required(),
                id: Joi.string().required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}

exports.acceptRejectChallengeResponse = {
    method: 'PUT',
    path: '/api/user/acceptRejectChallengeResponse',
    config: {
        description: 'acceptRejectChallengeResponse',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.acceptRejectChallengeResponse(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {

                id: Joi.string().required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
}


exports.getGhostRunAnalysis = {
    method: 'GET',
    path: '/api/user/getGhostRunAnalysis',
    config: {
        description: 'ghost run screen data',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.getGhostRunAnalysis(request.auth.credentials.authData, request.query, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            query: {
                workoutId:Joi.string().required(),
                date: Joi.string().required().description("MM/DD/YYYY"),
                limit: Joi.number().default(10).optional().description("if all is not selected")
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};


exports.recordPurchaseAndAdvertisement = {
    method: 'POST',
    path: '/api/user/recordPurchaseAndAdvertisement',
    config: {
        description: 'ghost run screen data',
        auth: 'UserAuth',
        tags: ['api', 'user'],
        handler: (request, reply) => {
            if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
                Controller.recordPurchaseAndAdvertisement(request.auth.credentials.authData, request.payload, (error, success) => {
                    if (error) return reply(UniversalFunc.sendError(error));
                    else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
                });
            }
            else if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
            else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
        },
        validate: {
            payload: {
                coinsEarned: Joi.number().required(),
                price: Joi.number().optional().default(0),
                type: Joi.string().valid([
                        CONSTANTS.PURCHASE_TYPE.IN_APP,
                        CONSTANTS.PURCHASE_TYPE.ADVERTISEMENT,
                    ]).required()
            },
            headers: UniversalFunc.authorizationHeaderObj,
            failAction: UniversalFunc.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: swaggerResponse
            }
        }
    }
};


// exports.getMyDataHistory = {
//     method: 'GET',
//     path: '/api/user/getMyDataHistory',
//     config: {
//         description: 'Get My booking and meetups',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

//                 if(request.query.dataType == 4 && !request.query.dockId) return reply(UniversalFunc.sendError(ERROR.DOCK_ID_REQUIRED));
//                 else {
//                     Controller.getMyDataHistory(request.auth.credentials.authData, request.query, (error, success)=> {
//                         if (error) return reply(UniversalFunc.sendError(error));
//                         else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                     });
//                 }
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 dataType : Joi.number().required().description("0 for meetup, 1 for bookings, 2 for tieup, 3 for dock,4 for dock owner bookings").valid([0,1,2,3,4]).default(0),
//                 dockId : Joi.string().length(24).optional(),
//                 flag : Joi.number().required().default(0).valid([0,1]).description("0 for upcoming, 1 for past"),
//                 limit : Joi.number().default(10).required(),
//                 skip : Joi.number().default(0).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.getData = {
//     method: 'GET',
//     path: '/api/user/getData',
//     config: {
//         description: 'Get Spots/ tieup/ docks/ meetups with filter and search',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.getData(request.auth.credentials.authData, request.query, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 dataType : Joi.number().required().description("0 for spots, 1 for tieup, 2 for docks, 3 for meetups").valid([0,1,2,3]).default(0),
//                 latitude : Joi.number().required().min(-90).max(90),
//                 longitude : Joi.number().required().min(-180).max(180),
//                 limit : Joi.number().required(),
//                 skip : Joi.number().required(),
//                 spotType : Joi.array().items(Joi.string().length(24)).optional(),
//                 tieUpPreference : Joi.array().items(Joi.string().valid([
//                     CONSTANTS.TIE_UP_PREFERENCE.CHILLIN_OUT,
//                     CONSTANTS.TIE_UP_PREFERENCE.GOOD_VIBRATIONS,
//                     CONSTANTS.TIE_UP_PREFERENCE.THROWIN_DOWN
//                 ])).optional()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.getMusicSpotType = {
//     method: 'GET',
//     path: '/api/user/getMusicSpotType',
//     config: {
//         description: 'Get music/spot type',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.getMusicSpotType(request.query, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 dataType : Joi.number().required().description("0 for spots type, 1 for music type, 2 for amenities").valid([0,1,2]).default(0)
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.createTieup = {
//     method: 'POST',
//     path: '/api/user/tieup/createTieup',
//     config: {
//         description: 'Create Tieup/ Beacon',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         payload: {
//             maxBytes: 5000000,                                                              // max 5MB
//             output: 'stream',
//             parse: true,
//             allow: 'multipart/form-data'
//         },
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.createTieup(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.TIE_UP_CREATED_SUCCESSFULLY, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 title : Joi.string().required(),
//                 tieUpPreference : Joi.string().required().valid([
//                     CONSTANTS.TIE_UP_PREFERENCE.CHILLIN_OUT,
//                     CONSTANTS.TIE_UP_PREFERENCE.GOOD_VIBRATIONS,
//                     CONSTANTS.TIE_UP_PREFERENCE.THROWIN_DOWN
//                 ]).default(CONSTANTS.TIE_UP_PREFERENCE.GOOD_VIBRATIONS),
//                 musicType : Joi.string().required(),
//                 dateTime : Joi.date().required().description("UTC date time"),
//                 size : Joi.number().min(1).required().default(1),
//                 address : Joi.string().required().allow(""),
//                 latitude : Joi.number().required().min(-90).max(90),
//                 longitude : Joi.number().required().min(-180).max(180),
//                 isFile : Joi.boolean().default(false).required(),
//                 tieupImage : Joi.any().meta({swaggerType: 'file'}).optional().description("max 5 MB is allowed"),
//                 familyFriendly : Joi.boolean().required().default(true),
//                 overnight : Joi.boolean().required().default(false),
//                 description : Joi.string().allow("").required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.doTieup = {
//     method: 'PUT',
//     path: '/api/user/tieup/doTieup',
//     config: {
//         description: 'connect with Beacon i.e. do tieup',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.doTieup(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.CONNECT_BEACON, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 tieupId : Joi.string().length(24).required(),
//                 latitude : Joi.number().required().min(-90).max(90),
//                 longitude : Joi.number().required().min(-180).max(180)
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.deleteBeacon = {
//     method: 'PUT',
//     path: '/api/user/tieup/deleteBeacon',
//     config: {
//         description: 'Delete Beacon',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.deleteBeacon(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DISCONNECT_BEACON, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 beaconId : Joi.string().length(24).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.deleteMeetUp = {
//     method: 'PUT',
//     path: '/api/user/meetup/deleteMeetUp',
//     config: {
//         description: 'Delete Meet Up',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.deleteMeetUp(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.MEETUP_DELTED_SUCCESSFULLY, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 meetupId : Joi.string().length(24).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.deleteDock = {
//     method: 'PUT',
//     path: '/api/user/dock/deleteDock',
//     config: {
//         description: 'Delete Dock',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.deleteDock(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DOCK_DELETED_SUCCESSFULLY, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 dockId : Joi.string().length(24).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.removeTieup = {
//     method: 'PUT',
//     path: '/api/user/tieup/removeTieup',
//     config: {
//         description: 'Remove with Beacon i.e. remove tieup',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.removeTieup(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DISCONNECT_BEACON, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 tieupId : Joi.string().length(24).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.createMeetup = {
//     method: 'POST',
//     path: '/api/user/meetup/createMeetup',
//     config: {
//         description: 'Create Meetup',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         payload: {
//             maxBytes: 5000000,                                                              // max 5MB
//             output: 'stream',
//             parse: true,
//             allow: 'multipart/form-data'
//         },
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE && request.auth.credentials.authData.canPostMeetup == 2) {
//                 Controller.createMeetup(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.MEETUP_CREATED_SUCCESSFULLY, success));
//                 });
//             }
//             else if (request.hasOwnProperty('auth') &&
//                 request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE &&
//                 (request.auth.credentials.authData.canPostMeetup == 0 || request.auth.credentials.authData.canPostMeetup == 1))
//                 reply(UniversalFunc.sendError(ERROR.CAN_NOT_POST_MEETUP));
//             else if(request.hasOwnProperty('auth') &&
//                 request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE)
//                 reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 eventName : Joi.string().required(),
//                 dateTime : Joi.date().min('now').required().description("UTC date time"),
//                 endDateTime : Joi.date().required().description("UTC date time"),
//                 address : Joi.string().required().allow(""),
//                 websiteURL : Joi.string().required().allow(""),
//                 latitude : Joi.number().required().min(-90).max(90),
//                 longitude : Joi.number().required().min(-180).max(180),
//                 isFile : Joi.boolean().default(false).required(),
//                 meetupImage : Joi.any().meta({swaggerType: 'file'}).optional().description("max 5 MB is allowed"),
//                 description : Joi.string().allow("").required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.sendRemoveRSVP = {
//     method: 'PUT',
//     path: '/api/user/meetup/sendRemoveRSVP',
//     config: {
//         description: 'Send/Remove RSVP to meetup owner',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.sendRemoveRSVP(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 meetupId : Joi.string().length(24).required(),
//                 rsvpSend : Joi.boolean().required().default(true)
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.createEditDock = {
//     method: 'POST',
//     path: '/api/user/dock/createEditDock',
//     config: {
//         description: 'Create/Edit Dock',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         payload: {
//             maxBytes: 5000000,                                                              // max 5MB
//             output: 'stream',
//             parse: true,
//             allow: 'multipart/form-data'
//         },
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE ) {
//                 Controller.createEditDock(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DOCK_CREATED_SUCCESSFULLY, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 dockId : Joi.string().length(24).optional(),
//                 dockName : Joi.string().required(),
//                 ownerName : Joi.string().required(),
//                 phoneNumber : Joi.string().required(),
//                 email : Joi.string().required(),
//                 capacity : Joi.number().min(1).required(),
//                 rent : Joi.number().required().description("in dollar"),
//                 availabilityType : Joi.number().valid([1,2,3]).required().description("1 for hourly, 2 for daily, 3 for monthly"),
//                 depth : Joi.number().required().description("In Feet"),
//                 length : Joi.number().required().description("In Feet"),
//                 height : Joi.number().required().description("In Feet"),
//                 width : Joi.number().required().description("In Feet"),
//                 covered : Joi.boolean().default(false).required(),
//                 address : Joi.string().required().allow(""),
//                 latitude : Joi.number().required().min(-90).max(90),
//                 longitude : Joi.number().required().min(-180).max(180),
//                 isFile : Joi.boolean().default(false).required(),
//                 dockImage : Joi.any().meta({swaggerType: 'file'}).optional().description("max 5 MB is allowed"),
//                 description : Joi.string().allow("").required(),
//                 websiteURL : Joi.string().allow("").required(),
//                 minRentHours : Joi.number().required().min(1),
//                 aminities : Joi.array().items(Joi.string().length(24).required()).required(),

//                 monthAvailability : Joi.array().items(Joi.object().keys({
//                     month : Joi.number().valid([0,1,2,3,4,5,6,7,8,9,10,11]).min(0).max(11).description("0 for january, 11 for december"),
//                     isAvailable : Joi.boolean().default(true)
//                 })).optional(),
//                 dailyNotAvailable : Joi.array().items(Joi.object().keys({
//                     dateTime : Joi.date().description("send local date time and day starting date time"),
//                     isAvailable : Joi.boolean().default(false)
//                 })).optional(),
//                 hourlyAvailability : Joi.array().items(Joi.object().keys({
//                     dateTime : Joi.date().description("send local date time and day starting date time"),
//                     isFullDayAvailable : Joi.boolean().default(false),
//                     availability : Joi.array().items(Joi.number().valid([0,1])).required()
//                 })).optional()

//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.addCreditCard = {
//     method: 'POST',
//     path: '/api/user/card/addCreditCard',
//     config: {
//         description: 'add credit card',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.addCreditCard(request.auth.credentials.authData,request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.CARD_ADDED, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload: {
//                 stripeToken : Joi.string().required(),
//                 defaultStatus : Joi.number().required().description("0 for not, 1 for default").default(0)
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.getCreditCards = {
//     method: 'GET',
//     path: '/api/user/card/getCreditCards',
//     config: {
//         description: 'GET credit cardS',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.getCreditCards(request.auth.credentials.authData, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.changeDefaultCards = {
//     method: 'PUT',
//     path: '/api/user/card/changeDefaultCards',
//     config: {
//         description: 'change default card',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.changeDefaultCards(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 cardId : Joi.string().length(24).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.deleteCreditCards = {
//     method: 'DELETE',
//     path: '/api/user/card/deleteCreditCards',
//     config: {
//         description: 'delete card',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.deleteCreditCards(request.auth.credentials.authData, request.query, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 cardId : Joi.string().length(24).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.addRemoveFavMeetup = {
//     method: 'PUT',
//     path: '/api/user/meetup/addRemoveFavMeetup',
//     config: {
//         description: 'add/remove fav meetup',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.addRemoveFavMeetup(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.UPDATED_SUCCESSFULLY, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 meetupId : Joi.string().length(24).required(),
//                 status : Joi.number().valid([1,2]).required().description("1 for add, 2 for remove")
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.getAvailability = {
//     method: 'GET',
//     path: '/api/user/getAvailability',
//     config: {
//         description: 'get Dock Availability',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

//                 if((request.query.availabilityType == 1 || request.query.availabilityType == 2) && !request.query.month && !request.query.year) return reply(UniversalFunc.sendError(ERROR.MONTH_YEAR_REQUIRED));
//                 else {
//                     Controller.getAvailability(request.query, (error, success)=> {
//                         if (error) return reply(UniversalFunc.sendError(error));
//                         else return reply(UniversalFunc.sendSuccess(SUCCESS.SUCCESS, success));
//                     });
//                 }
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 dockId : Joi.string().length(24).required(),
//                 timeOffSet : Joi.number().required().description("+330 for india"),
//                 availabilityType : Joi.number().valid([1,2,3]).required().description("1 for hourly, 2 for daily, 3 for monthly"),
//                 month : Joi.number().optional().description("0 for january, 11 for december"),
//                 year : Joi.number().optional()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.updateDockAvailability = {
//     method: 'PUT',
//     path: '/api/user/updateDockAvailability',
//     config: {
//         description: 'Update Dock Availability',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.updateDockAvailability(request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.SUCCESS, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 dockId : Joi.string().length(24).required(),
//                 availabilityType : Joi.number().valid([1,2,3]).required().description("1 for hourly, 2 for daily, 3 for monthly"),

//                 monthAvailability : Joi.array().items(Joi.object().keys({
//                     month : Joi.number().valid([0,1,2,3,4,5,6,7,8,9,10,11]).min(0).max(11).description("0 for january, 11 for december"),
//                     isAvailable : Joi.boolean().default(true)
//                 })).optional(),
//                 dailyNotAvailable : Joi.array().items(Joi.object().keys({
//                     dateTime : Joi.date().description("send local date time and day starting date time"),
//                     isAvailable : Joi.boolean().default(false)
//                 })).optional(),
//                 hourlyAvailability : Joi.array().items(Joi.object().keys({
//                     dateTime : Joi.date().description("send local date time and day starting date time"),
//                     isFullDayAvailable : Joi.boolean().default(false),
//                     currentState : Joi.boolean().default(false),
//                     availability : Joi.array().items(Joi.number().valid([0,1])).required()
//                 })).optional()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.checkDockAvailability = {
//     method: 'GET',
//     path: '/api/user/checkDockAvailability',
//     config: {
//         description: 'Check Dock Availability',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.checkDockAvailability(request.query, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.SUCCESS, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 dockId : Joi.string().length(24).required(),
//                 bookingStartDateTime : Joi.date().required().description("UTC Date Time"),
//                 bookingEndDateTime : Joi.date().required().description("UTC Date Time"),
//                 timeOffSet : Joi.string().required().description("in Minutes")
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.bookDock = {
//     method: 'POST',
//     path: '/api/user/bookDock',
//     config: {
//         description: 'Book Dock',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.bookDock(request.auth.credentials.authData,request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.SUCCESS, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 dockId : Joi.string().length(24).required(),
//                 cardId : Joi.string().length(24).required(),
//                 bookingStartDateTime : Joi.date().required().description("UTC Date Time"),
//                 bookingEndDateTime : Joi.date().required().description("UTC Date Time"),
//                 timeOffSet : Joi.string().required().description("in Minutes"),
//                 notes : Joi.string().allow("").required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.cancelBooking = {
//     method: 'PUT',
//     path: '/api/user/cancelBooking',
//     config: {
//         description: 'Cancel Booking',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {

//                 if(request.payload.flag == 2 && !request.payload.dockId) return reply(UniversalFunc.sendError(ERROR.DOCK_ID_REQUIRED));
//                 else {
//                     Controller.cancelBooking(request.auth.credentials.authData,request.payload, (error, success)=> {
//                         if (error) return reply(UniversalFunc.sendError(error));
//                         else return reply(UniversalFunc.sendSuccess(SUCCESS.SUCCESS, success));
//                     });
//                 }
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 flag : Joi.number().required().valid([1,2]).description("1 for cancel by user, 2 for cancel by dock Owner"),
//                 bookingId : Joi.string().length(24).required(),
//                 dockId : Joi.string().length(24).optional(),
//                 cancelReason : Joi.string().allow("").required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.postMeetupRequest = {
//     method: 'PUT',
//     path: '/api/user/postMeetupRequest',
//     config: {
//         description: 'Request for post meetup',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.postMeetupRequest(request.auth.credentials.authData, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.SUCCESS, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.getDetails = {
//     method: 'GET',
//     path: '/api/user/getDetails',
//     config: {
//         description: 'Get Details',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.getDetails(request.query , (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.SUCCESS, success[0]));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 flag : Joi.number().valid([1,2,3]).description("1 for tieup, 2 for meetup, 3 for dock"),
//                 _id : Joi.string().length(24).required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.getTopMeetup = {
//     method: 'GET',
//     path: '/api/user/getTopMeetup',
//     config: {
//         description: 'Get Top Meetup',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.getTopMeetup(request.auth.credentials.authData, request.query, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             query : {
//                 limit : Joi.number().required(),
//                 skip : Joi.number().required()
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.updateBeaconStatus = {
//     method: 'PUT',
//     path: '/api/user/updateBeaconStatus',
//     config: {
//         description: 'Update Beacon status i.e. delete beacon',
//         auth: 'UserAuth',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             if (request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE) {
//                 Controller.updateBeaconStatus(request.auth.credentials.authData, request.payload, (error, success)=> {
//                     if (error) return reply(UniversalFunc.sendError(error));
//                     else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//                 });
//             }
//             else if(request.hasOwnProperty('auth') && request.auth.credentials.authData.accountState != CONSTANTS.ACCOUNT_STATUS.ACTIVE) reply(UniversalFunc.sendError(ERROR.USER_BLOCKED));
//             else reply(UniversalFunc.sendError(ERROR.INVALID_TOKEN));
//         },
//         validate: {
//             payload : {
//                 latitude : Joi.number().required().min(-90).max(90),
//                 longitude : Joi.number().required().min(-180).max(180)
//             },
//             headers: UniversalFunc.authorizationHeaderObj,
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

// exports.setAccountId = {
//     method: 'PUT',
//     path: '/api/user/setAccountId',
//     config: {
//         description: 'Set stripe connect account id',
//         tags: ['api', 'user'],
//         handler: (request, reply)=> {
//             Controller.setAccountId(request.payload, (error, success)=> {
//                 if (error) return reply(UniversalFunc.sendError(error));
//                 else return reply(UniversalFunc.sendSuccess(SUCCESS.DEFAULT, success));
//             });
//         },
//         validate: {
//             payload : {
//                 userId : Joi.string().length(24).required(),
//                 stripeAccountId : Joi.string().required()
//             },
//             failAction: UniversalFunc.failActionFunction
//         },
//         plugins: {
//             'hapi-swagger': {
//                 payloadType: 'form',
//                 responseMessages: swaggerResponse
//             }
//         }
//     }
// };

for (let key in exports) {
    routes.push(exports[key])
}
module.exports = routes;