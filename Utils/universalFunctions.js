
'use strict';

let Boom = require('boom'),
    CONFIG = require('../Config'),
    Models = require('../Models'),
    md5 = require('md5'),
    Joi = require('joi'),
    Lib = require('../Lib'),
    absorb = require('absorb'),
    async = require('async'),
    random = require('random-int'),
    moment = require('moment'),
    Path = require('path'),
    logger = require('log4js').getLogger('[UNIVERSAL FUNCTIONS]'),
    ERROR = require('../Config').responseMessages.ERROR,
    SUCCESS = require('../Config').responseMessages.SUCCESS,
    bcrypt = require('bcryptjs'),
    DAO = require('../DAOManager').queries,
    _ = require('underscore'),
    fs = require('node-fs');
require('moment-range');

let authorizationHeaderObj = Joi.object({
    authorization: Joi.string().required()
}).unknown();

/*-------------------------------------------------------------------------------
 * send error
 * -----------------------------------------------------------------------------*/

let sendError = (data)=> {
    let error;
    if (typeof data == 'object' && data.hasOwnProperty('statusCode') && data.hasOwnProperty('customMessage')) {
        error =  Boom.create(data.statusCode, data.customMessage);
        if(data.hasOwnProperty('type')) {
            error.output.payload.type = data.type;
            logger.error(error);
            return error;
        }
    }else {
        let errorToSend = '',
            type = '';

        if (typeof data == 'object') {
            if (data.name == 'MongoError') {
                errorToSend += ERROR.DB_ERROR.customMessage;
                type = ERROR.DB_ERROR.type;
                if (data.code = 11000) {
                    errorToSend += ERROR.DUPLICATE.customMessage;
                    type = ERROR.DUPLICATE.type;
                }
            } else if (data.name == 'ApplicationError') {
                errorToSend += ERROR.APP_ERROR.customMessage;
                type = ERROR.APP_ERROR.type;
            } else if (data.name == 'ValidationError') {
                errorToSend += ERROR.APP_ERROR.customMessage + data.message;
                type = ERROR.APP_ERROR.type;
            } else if (data.name == 'CastError') {
                errorToSend += ERROR.DB_ERROR.customMessage + ERROR.INVALID_OBJECT_ID.customMessage;
                type = ERROR.INVALID_OBJECT_ID.type;
            } else if(data.response) {
                errorToSend = data.response.message;
            }
        } else {
            errorToSend = data;
            type = ERROR.DEFAULT.type;
        }
        let customErrorMessage = errorToSend;
        if (typeof errorToSend == 'string'){
            if (errorToSend.indexOf("[") > -1) {
                customErrorMessage = errorToSend.substr(errorToSend.indexOf("["));
            } else {
                customErrorMessage = errorToSend;
            }
            customErrorMessage = customErrorMessage.replace(/"/g, '');
            customErrorMessage = customErrorMessage.replace('[', '');
            customErrorMessage = customErrorMessage.replace(']', '');
        }
        logger.error("custom error message------>>>>>>", customErrorMessage);
        error =  Boom.create(400,customErrorMessage);
        error.output.payload.type = type;
        return error;
    }
};

/*-------------------------------------------------------------------------------
 * send success
 * -----------------------------------------------------------------------------*/

let sendSuccess = (successMsg, data)=> {
    successMsg = successMsg || SUCCESS.DEFAULT.customMessage;
    if (typeof successMsg == 'object' && successMsg.hasOwnProperty('statusCode') && successMsg.hasOwnProperty('customMessage'))
        return {statusCode:successMsg.statusCode, message: successMsg.customMessage, data: data || {}};
    else return {statusCode:200, message: successMsg, data: data || {}};
};

/*-------------------------------------------------------------------------------
 * Joi error handle
 * -----------------------------------------------------------------------------*/

let failActionFunction = (request, reply, source, error)=> {
    error.output.payload.type = "Joi Error";

    if (error.isBoom) {
        delete error.output.payload.validation;
        if (error.output.payload.message.indexOf("authorization") !== -1) {
            error.output.statusCode = ERROR.UNAUTHORIZED.statusCode;
            return reply(error);
        }
        let details = error.data.details[0];
        if (details.message.indexOf("pattern") > -1 && details.message.indexOf("required") > -1 && details.message.indexOf("fails") > -1) {
            error.output.payload.message = "Invalid " + details.path;
            return reply(error);
        }
    }
    let customErrorMessage = '';
    if (error.output.payload.message.indexOf("[") > -1) {
        customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
    } else {
        customErrorMessage = error.output.payload.message;
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    error.output.payload.message = customErrorMessage.replace(/\b./g, (a) => a.toUpperCase());
    delete error.output.payload.validation;
    return reply(error);
};

/*-------------------------------------------------------------------------------
 * Capital First Letter
 * -----------------------------------------------------------------------------*/

String.prototype.capitalize = ()=> {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/*-------------------------------------------------------------------------------
 * encyption/decryption functions
 * -----------------------------------------------------------------------------*/

function cryptDataMd5(data) {                       // MD5 encryption
    return md5(md5(data))
}

function cryptData(data, callback) {                // bcryptjs encryption
    bcrypt.hash(data, 8, (err, hash) => {
        if (err) callback(err);
        else callback(null,hash);
    });
}
function compareCryptData(data, hash, callback) {       // bcryptjs matching
    bcrypt.compare(data, hash, (error, result)=> {
        if (error)
        {
            logger.error("error in compare bcrypt password-->>>>",error);
            callback(error);
        }
        else
        {
            logger.info("result of compare bcrypt password---->>>>",result);
            callback(null, result);
        }
    })
}

function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length && obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
};

/*-------------------------------------------------------------------------------
 * generate random number/string/ unique code
 * -----------------------------------------------------------------------------*/

let generateUniqueCode = (noOfDigits,userRole, callback)=> {
    noOfDigits = noOfDigits || 6;
    let excludeArray = [];
    let generatedRandomCode = null;
    async.series([
        (cb)=> {
            if (userRole == CONFIG.constants.USER_TYPE.USER)
            {
                let query = {
                    OTPCode : {$ne : null}
                };

                DAO.getData(Models.user, query, {OTPCode : 1}, {lean: true}, function (err, dataAry) {
                    if (err) cb(err);
                    else if(dataAry && dataAry.length > 0) {
                        excludeArray = _.pluck(dataAry,'OTPCode');
                        cb();
                    }
                    else cb();
                });
            }
        }, (cb)=> {
            generatedRandomCode = generateRandomNumbers(noOfDigits,excludeArray);
            cb();
        }], (err, data)=> {
        callback(err,{number : generatedRandomCode})
    });
};


let generateRandomNumbers = (numberLength, excludeList)=> {
    let arrayList = [];
    excludeList = excludeList || [];

    let minString = "0";
    let maxString = "9";

    for (var i=1; i < numberLength; i++){
        minString = minString + "0";
        maxString = maxString +  "9";
    }
    let minNumber = parseInt(minString);
    let maxNumber = parseInt(maxString);
    for (i = minNumber; i < maxNumber; i ++){
        let digitToCheck = i.toString();
        if (digitToCheck.length < numberLength){
            let diff = numberLength - digitToCheck.length;
            let zeros = '';
            for (var j = 0; j<diff; j++){
                zeros+='0';
            }
            digitToCheck = zeros + digitToCheck
        }
        if (digitToCheck <1000)
            if (excludeList.indexOf(digitToCheck) == -1) arrayList.push(digitToCheck)
    }
    if (arrayList.length > 0){
        arrayList = _.shuffle(arrayList);
        return arrayList[0];
    }
    else return false;
};

function generateRandomString(length, isNumbersOnly) {
    let charsNumbers = '0123456789';
    let charsLower = 'abcdefghijklmnopqrstuvwxyz';
    let charsUpper = charsLower.toUpperCase();
    let chars;

    if (isNumbersOnly) chars = charsNumbers;
    else chars = charsNumbers + charsLower + charsUpper;

    if (!length) length = 32;

    let string = '';
    for (var i = 0; i < length; i++) {
        let randomNumber = random(0,chars.length);
        randomNumber= randomNumber||1;
        string += chars.substring(randomNumber-1, randomNumber);
    }
    return string;
}

function getRange(startDate, endDate, diffIn) {

    let dr = moment.range(startDate, endDate);
    if (!diffIn)
        diffIn = 'minutes';
    if (diffIn == "milli")
        return dr.diff();

    return dr.diff(diffIn);

}

let validateLatLongValues = (lat, long)=> {
    let valid = true;
    if (lat < -90 || lat>90) valid = false;
    if (long <-180 || long > 180) valid = false;
    return valid;
};

let getUnique = (string)=> {
    let num = 0;
    if(string.length){
        for(var i =0 ; i<string.length;i++){
            if(string.lastIndexOf(string[i]) == string.length - 1 - string.lastIndexOf(string[i])) num++;
        }
    }
    else num = 0;
    return num;
};

function checkAppVersion(type, appType, version, callbackRoute) {
    let query = {
        type : type,
        appType : appType,
        currentCriticalVersion : {$gt : version}
    };

    DAO.getData(Models.appVersion,query,{},{lean : true},callbackRoute)
}

function uploadDocs( docArray, filename, callbackParent) {
    let baseFolder = CONFIG.s3BucketCredentials.folder.serviceProvider + '/',
        baseURL = CONFIG.s3BucketCredentials.s3URL + '/' + baseFolder,
        docUrls = [],
        agentId = filename;

    async.forEach(docArray, (item,  callback)=> {

        let filename = "Document_" + docArray.indexOf(item) + agentId;

        if(item.hapi.filename) {
            uploadDocument(item, filename, (error, result)=> {
                if(error) callback(error);
                else {
                    docUrls.push(result);
                    callback();
                }
            });
        } else callback();

    }, (err)=> {
        if(err) callbackParent(err);
        else callbackParent(null, docUrls);
    });
}

function uploadDocument( document, filename, callbackParent) {

    filename = filename + generateRandomString(6).replace(/\s/g,'');

    let baseFolder = CONFIG.s3BucketCredentials.folder.serviceProvider + '/',
        baseURL = CONFIG.s3BucketCredentials.s3URL + '/' + baseFolder,
        urls = {};

    async.series([
            (callback)=> {
                let profileFolder = CONFIG.s3BucketCredentials.folder.agentDocuments,
                    profilePictureName = Lib.uploadManager.generateFilenameWithExtension(document.hapi.filename,  filename),
                    s3Folder = baseFolder + profileFolder,
                    s3FolderThumb = baseFolder + profileFolder + '/' + CONFIG.s3BucketCredentials.folder.thumb,
                    profileFolderUploadPath = "winery/agentDocuments",
                    path = Path.resolve("") + "/uploads/" + profileFolderUploadPath + "/";

                let fileDetails = {
                    file: document,
                    name: profilePictureName
                };

                let otherConstants = {
                    TEMP_FOLDER: path,
                    s3Folder: s3Folder,
                    s3FolderThumb: s3FolderThumb
                };

                urls.original = baseURL + profileFolder + '/' + profilePictureName;
                urls.thumbnail = baseURL + profileFolder + '/thumb/Thumb_' + profilePictureName;

                Lib.uploadManager.uploadFile(otherConstants, fileDetails, true, callback);

            }
        ], (error)=> {
            if (error) return callbackParent(error);
            return callbackParent(null, urls);
        })
}

function uploadProfilePicture(profilePicture, filename, folder, callbackParent) {
    logger.info("filename in the function--",filename);

    filename = filename + generateRandomString(6).replace(/\s/g,'');

    let baseFolder = folder + '/',
        baseURL = CONFIG.s3BucketCredentials.s3URL + '/' + baseFolder,
        urls = {};

    async.waterfall([
            (callback)=> {
                let profileFolder = CONFIG.s3BucketCredentials.folder.profilePicture,
                    profilePictureName = Lib.uploadManager.generateFilenameWithExtension(profilePicture.hapi.filename, "Profile_" + filename),
                    s3Folder = baseFolder + profileFolder,
                    s3FolderThumb = baseFolder + profileFolder + '/' + CONFIG.s3BucketCredentials.folder.thumb,
                    profileFolderUploadPath = folder + "/profilePicture",
                    path = Path.resolve("") + "/uploads/" + profileFolderUploadPath + "/";

                let fileDetails = {
                    file: profilePicture,
                    name: profilePictureName
                };

                let otherConstants = {
                    TEMP_FOLDER: path,
                    s3Folder: s3Folder,
                    s3FolderThumb: s3FolderThumb
                };


                urls.original = baseURL + profileFolder + '/' + profilePictureName;
                urls.thumbnail = baseURL + profileFolder + '/thumb/Thumb_' + profilePictureName;

                Lib.uploadManager.uploadFile(otherConstants, fileDetails, true, callback);

            }
        ], (error)=> {
            if (error) return callbackParent(error);
            return callbackParent(null, urls);
        })
}

function capitalizeFirstLetterstr(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

module.exports = {
    getRange : getRange,
    generateRandomString : generateRandomString,
    isEmpty : isEmpty,
    cryptData : cryptData,
    failActionFunction : failActionFunction,
    sendSuccess : sendSuccess,
    authorizationHeaderObj : authorizationHeaderObj,
    sendError :sendError,
    validateLatLongValues : validateLatLongValues,
    getUnique : getUnique,
    compareCryptData : compareCryptData,
    generateUniqueCode : generateUniqueCode,
    cryptDataMd5 : cryptDataMd5,
    checkAppVersion : checkAppVersion,
    uploadDocs : uploadDocs,
    uploadDocument : uploadDocument,
    uploadProfilePicture : uploadProfilePicture,
    capitalizeFirstLetterstr : capitalizeFirstLetterstr
};