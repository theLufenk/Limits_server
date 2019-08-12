'use strict';

let mongoose = require('mongoose'),
    CONFIG = require('../Config'),
    Schema = mongoose.Schema;

let appVersion = new Schema({
    currentVersion: {type: Number, index:true, default : 0},
    forceUpdate : {
        type: Number,
        enum: [CONFIG.constants.APP_VERSION_UPDATE.FORCE,CONFIG.constants.APP_VERSION_UPDATE.OPTIONAL],
        default : CONFIG.constants.APP_VERSION_UPDATE.OPTIONAL
    },
    currentCriticalVersion: {type: Number, default: 0},
    type : {
        type: Number,
        enum: [CONFIG.constants.DEVICE_TYPE.ANDROID,CONFIG.constants.DEVICE_TYPE.IOS],
        default : CONFIG.constants.DEVICE_TYPE.ANDROID
    },
    appType : {
        type: String,
        enum: [CONFIG.constants.USER_TYPE.USER],
        default : CONFIG.constants.USER_TYPE.USER
    }
});

module.exports = mongoose.model('appVersion', appVersion);


