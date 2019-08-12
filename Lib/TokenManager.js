'use strict';

let ERROR = require('../Config').responseMessages.ERROR,
    SERVER = require('../Config').constants.SERVER,
    Jwt = require('jsonwebtoken'),
    Models = require('../Models'),
    DAO = require('../DAOManager').queries,
    CONSTANTS = require('../Config').constants;

let generateToken = (tokenData)=> {
    return Jwt.sign(tokenData, SERVER.JWT_SECRET_KEY);
};

let decipherToken = (token, callback)=> {
    Jwt.verify(token,SERVER.JWT_SECRET_KEY, function (err, decodedData) {
        if (err) return callback(ERROR.INVALID_TOKEN);
        return callback(null, decodedData);
    })
};

let verifyUserToken = (token, callback)=> {
    let response = {
        valid : false
    };
    Jwt.verify(token, SERVER.JWT_SECRET_KEY, (err, decodedData)=> {

        if (err) {
            response.name = err.name;
            callback(response)
        } else {
                DAO.getData(Models.user,{_id: decodedData._id}, {}, {limit: 1,lean: true}, function (err, data) {
                    if(!err && data && data[0] && data[0].accessToken == token && data[0].accountState == CONSTANTS.ACCOUNT_STATUS.ACTIVE){
                        response.valid = true;
                        response.userData = decodedData;
                        response.authData = data[0];
                    } else if(data[0] && data[0].accountState == CONSTANTS.ACCOUNT_STATUS.BLOCKED_BY_ADMIN){
                        response.valid = false;
                        response.name = 'blocked';
                    }
                    else {
                        response.valid = false;
                        response.name = 'TokenExpiredError';
                    }
                    callback(response);
                });
        }
    });
};

let verifyAdminToken = (token, callback)=> {
    let response = {
        valid : false
    };
    Jwt.verify(token, SERVER.JWT_SECRET_KEY, (err, decodedData)=> {
        if (err) {
            response.name = err.name;
            callback(response)
        } else {
            DAO.getData(Models.adminDetails,{_id: decodedData._id}, {}, {limit: 1,lean: true}, function (err, data) {
                if (!err && data && data[0] && data[0].accessToken == token) {
                    response.valid = true;
                    response.userData = decodedData;
                    response.authData = data[0];
                } else if(data[0] && data[0].isBlocked==true){
                    response.valid = false;
                    response.name = 'blocked';
                }
                callback(response);
            });
        }
    });
};

module.exports = {
    generateToken: generateToken,
    decipherToken: decipherToken,
    verifyUserToken : verifyUserToken,
    verifyAdminToken : verifyAdminToken
};