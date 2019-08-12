'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    CONSTANTS = require('../Config').constants;

let user = new Schema({
    firstName: {type: String, trim: true, required: true},
    lastName: {type: String, trim: true, required : true},
    email: {type: String, trim: true, unique: true, index: true, required: true},
    countryCode: { type: String, required: true},
    phoneNumber: {type: String, trim: true,unique: true, min: 6, max: 16, index: true, required: true},
    password: {type: String, default: "", sparse: true},
    // OTPCode : {type : String, required : true},
    socialId : {type : String, trim : true, unique : true, sparse : true},
    // DOB : {type : String, required : true},
    profilePic : {
        original: {type: String, default: ""},
        thumbnail: {type: String, default: ""}
    },
    // stripeAccountId : {type : String, default : ""},
    // profileMeter : {type : Number, default : 100},
    // homeLake : {type : String, default : ""},
    // homeMarina : {type : String, default : ""},
    locationLongLat: {
        'type': {type: String, enum: "Point", default: "Point"},
        coordinates: {type: [Number], default: [0, 0]}                                              //[longitude, latitude]
    },
    // userCards : [{type : Schema.ObjectId , ref:'userCards'}],
    deviceDetails : {
        deviceToken: {type: String, sparse : true},
        deviceType: {type: Number, default : CONSTANTS.DEVICE_TYPE.ANDROID,enum: [CONSTANTS.DEVICE_TYPE.ANDROID, CONSTANTS.DEVICE_TYPE.IOS], required: true}
    },
    registeredBy: {type: Number, enum : [
        CONSTANTS.REGISTERED_VIA.ADMIN,
        CONSTANTS.REGISTERED_VIA.EMAIL,
        CONSTANTS.REGISTERED_VIA.FACEBOOK,
        CONSTANTS.REGISTERED_VIA.GOOGLE,
        CONSTANTS.REGISTERED_VIA.TWITTER
    ], default : CONSTANTS.REGISTERED_VIA.EMAIL},
    accountState: {type: String, trim: true, uppercase: true, enum: [
        CONSTANTS.ACCOUNT_STATUS.ACTIVE,
        CONSTANTS.ACCOUNT_STATUS.DISABLED_BY_ADMIN,
        CONSTANTS.ACCOUNT_STATUS.BLOCKED_BY_ADMIN,
        CONSTANTS.ACCOUNT_STATUS.DISABLED_AUTHENTICATION_ATTEMPTS_EXCEEDED,
        CONSTANTS.ACCOUNT_STATUS.DISABLED_ACCOUNT_LIFETIME_EXPIRED
    ], default : CONSTANTS.ACCOUNT_STATUS.ACTIVE,required: true},

    isVerified: {type: Boolean, default: false},
    allowNotifications: {type: Boolean, default: true},
    // canPostMeetup: {type: Number, default: 0, enum : [0,1,2]},          // 0 for not requested, 1 for requested, 2 for verified
    accessToken: {type: String, index: true, sparse: true},

    passwordResetToken: {type: String, trim: true, unique: true, index: true, sparse: true},
    resetPasswordRequestedAt: {type: Date, sparse : true},
    appVersion: {type: String, required: true},

    coins : {type : Number, default : 0},
    // earnedMoney : {type : Number, default : 0},
    // userBio : {type : String, default : ""},

    // withoutVessel : {type : Boolean, default : false},

    // boatDetails : {
    //     boatImage: {
    //         original: {type: String, default: ""},
    //         thumbnail: {type: String, default: ""}
    //     },
    //     boatName: {type: String, default: ""},
    //     boatRegNum: {type: String, default: ""},
    //     year: {type: String, default: ""},
    //     size: {type: Number, min: 0, default : 0},
    //     type: {type: String, default: ""},
    //     bio: {type: String, default: ""},
    //     tieUpPreference : {type : String, default: "", enum : [
    //         "",
    //         CONSTANTS.TIE_UP_PREFERENCE.CAME_TO_PARTY,
    //         CONSTANTS.TIE_UP_PREFERENCE.CHILLIN_OUT,
    //         CONSTANTS.TIE_UP_PREFERENCE.GOOD_VIBRATIONS,
    //         CONSTANTS.TIE_UP_PREFERENCE.THROWIN_DOWN,
    //         CONSTANTS.TIE_UP_PREFERENCE.UNWINDING
    //     ]}
    // },

    // myFav : [{type : Schema.ObjectId , ref:'meetUps'}],                            //Meetups fav
    weight:{type: Number,default:0},
    height:{type: Number,default:0},
    gender:{type: String,enum:[
        CONSTANTS.GENDER.MALE,
        CONSTANTS.GENDER.FEMALE]},
    age:{type: Number,default:0},
    units:{type:String,enum:[
        CONSTANTS.UNITS.KGCM,
        CONSTANTS.UNITS.LBSFT]},
    registrationDate: {type: Date, default: Date.now, required: true},            //In UTC
    deletionDate: {type: Date, sparse: true},//In UTC
    isBlocked:{type: Boolean,default:false}
});

user.index({'locationLongLat': "2dsphere"});
module.exports = mongoose.model('user', user);

