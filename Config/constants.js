/**
 * Created by cl-desktop31 on 20/5/16.
 */
'use strict';

exports.SERVER = {
    APP_NAME: 'FITGHOST',
    JWT_SECRET_KEY: 'RYLCL1W8OIO0FB3HRF2UHE86OF'
};

exports.DEVICE_TYPE = {
    ANDROID : 1,
    IOS : 2,
    WEB : 3
};

exports.REGISTERED_VIA = {
    ADMIN : 0,
    EMAIL : 1,
    FACEBOOK : 2,
    GOOGLE : 3,
    TWITTER : 4
};

exports.ACCOUNT_STATUS = {
    ACTIVE : "ACTIVE",
    DISABLED_BY_ADMIN : "DISABLED_BY_ADMIN",
    BLOCKED_BY_ADMIN : 'BLOCKED_BY_ADMIN',
    DISABLED_AUTHENTICATION_ATTEMPTS_EXCEEDED : "DISABLED_AUTHENTICATION_ATTEMPTS_EXCEEDED",
    DISABLED_ACCOUNT_LIFETIME_EXPIRED : "DISABLED_ACCOUNT_LIFETIME_EXPIRED"
};

exports.GENDER = {
    MALE : "MALE",
    FEMALE : "FEMALE",
    OTHERS : "OTHERS"
};

exports.GOAL_DURATION = {
    WEEKLY : "Weekly",
    DAILY : "Daily",
    MONTHLY : "Monthly"
};

exports.GOAL_TYPES= {
    KILOMETERS : "Kilometers",
    DURATION : "Duration",
    CALORIES : "Calories"
};



exports.UNITS={
    KGCM:"KGCM",
    LBSFT:"LBSFT"
}

exports.CHALLENGE_TYPES={
    ACCEPTED:"ACCEPTED",
    REJECTED:"REJECTED",
    COMPLETED:"COMPLETED",
    PENDING:"PENDING",
    PREVIOUS_WORKOUT : "PREVIOUS_WORKOUT",
    CUSTOM : "CUSTOM",
    EXPIRED:"EXPIRED"
};
exports.ADMIN_SETTINGS={
    ADMIN_SHARE:"ADMIN_SHARE",
    ADVERTISEMENT_COIN:"ADVERTISEMENT_COIN",
};
exports.USER_TYPE = {
    USER: 'User',
    ADMIN: 'Admin'
};

exports.PURCHASE_TYPE = {
    IN_APP: 'IN_APP',
    ADVERTISEMENT: 'ADVERTISEMENT'
};

exports.TIE_UP_PREFERENCE = {
    UNWINDING: 'Unwinding',
    CHILLIN_OUT: 'Chillin Out',
    GOOD_VIBRATIONS: 'Good Vibrations',
    CAME_TO_PARTY: 'Came To Party',
    THROWIN_DOWN: 'Throwin Down'
};

exports.APP_VERSION_UPDATE = {
    OPTIONAL: 0,
    FORCE: 1
};

exports.BOOKING_STATUS = {
    PENDING: 0,
    CONFIRMED: 1,
    COMPLETED : 2,
    USER_CANCELLED : 3,
    ADMIN_CANCELLED : 4,
    REJECTED : 5,
    DOCK_OWNER_CANCEL : 6
};

exports.PAYMENT_STATUS = {
    PENDING: "PENDING",
    COMPLETED: 'COMPLETED',
    REFUND: 'REFUND',
    HOLD: 'HOLD',
    FAILED: 'FAILED'
};

exports.PUSH_FLAG = {
    TIEUP_MADE: 0,
    DOCK_BOOKING: 1,
    SEND_RSVP: 2,
    CAN_POST_MEETUP: 3,
    MEETUP_VERIFIED: 4
};

exports.EMAIL_SUBJECTS = {
    STRIPE_PAYMENT_ACCOUNT_CREATE : "Register yourself on stripe",
    EMAIL_VERIFICATION:"Verify Your Fitghost Email"
};

exports.UPDATE_MSG = {
    UPDATE_MSG: "Update the app with new version."
};

exports.FORGOT_PASSWORD_LINK = {
    USER_LINK : "http://52.38.210.131:8000/api/user/forgotPassword/verifyLink?pwdTkn=",
    ADMIN_LINK : "www.google.com"
};

exports.EMAILS_SUBJECTS = {
    FORGOT_PASSWORD : "User Forgot Password"
};

exports.STRIPE_LINK = {
    baseURL : "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_BKxZai7BIgLZjIjdf1oFbD85ZzBPZdw7&scope=read_write"
}