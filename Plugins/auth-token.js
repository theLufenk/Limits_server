'use strict';

let TokenManager = require('../Lib/TokenManager'),
    UniversalFunc = require('../Utils/universalFunctions'),
    ERROR = require('../Config').responseMessages.ERROR;

const AuthBearer = require('hapi-auth-bearer-token');

exports.register = (server, options, next)=> {

//Register Authorization Plugin

    server.register(AuthBearer, (err)=> {
        server.auth.strategy('UserAuth', 'bearer-access-token', {
            allowQueryToken: true,
            allowMultipleHeaders: true,
            accessTokenName: 'accessToken',
            validateFunc: (token, callback)=> {
                TokenManager.verifyUserToken(token, (response)=> {
                    if (response.valid) callback(null, true, {token: token, userData: response.userData, authData : response.authData});
                    else if (response.name == 'blocked') callback(UniversalFunc.sendError(ERROR.USER_BLOCKED));
                    else callback(UniversalFunc.sendError(ERROR.SESSION_EXPIRED));
                });
            }
        });
        server.auth.strategy('AdminAuth', 'bearer-access-token', {
            allowQueryToken: true,
            allowMultipleHeaders: true,
            accessTokenName: 'accessToken',
            validateFunc: (token, callback)=> {
                TokenManager.verifyAdminToken(token, (response)=> {
                    if (response.valid)callback(null, true, {token: token, userData: response.userData, authData : response.authData});
                    else {
                        let errResponse;

                        if (response.name == 'TokenExpiredError'){
                            errResponse = {
                                errorMessage : ERROR.TOKEN_ALREADY_EXPIRED
                            };
                            callback(errResponse, false, {token: token, userData: null})
                        }  else if (response.name == 'blocked'){
                            errResponse = {
                                errorMessage : ERROR.USER_BLOCKED
                            };
                            callback(errResponse, false, {token: token, userData: null})
                        }
                        else {
                            errResponse = null;
                            callback(UniversalFunc.sendError(ERROR.SESSION_EXPIRED))
                        }
                    }
                });

            }
        });
    });

    next();
};

exports.register.attributes = {
    name: 'auth-token-plugin'
};