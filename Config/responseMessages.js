/**
 * Created by cl-desktop31 on 19/5/16.
 */
'use strict';

exports.ERROR = {
    WORKOUT_MISSING:{
        statusCode: 400,
        customMessage: 'Ghost Workout missing',
        type: 'WORKOUT_MISSING'
    },
    CHALLENGE_MISSING:{
        statusCode: 400,
        customMessage: 'Challenge missing',
        type: 'CHALLENGE_MISSING'
    },
    ENTER_EITHER_SOCIALID_OR_PWD:{
        statusCode: 400,
        customMessage: 'Enter either social Id or password',
        type: 'ENTER_EITHER_SOCIALID_OR_PWD'
    },
    ALREADY_REGISTER:{
        statusCode: 400,
        customMessage: 'You are already register with us.',
        type: "ALREADY_REGISTER"
    },
    UNAUTHORIZED: {
        statusCode:401,
        customMessage : 'You are not authorized to perform this action',
        type : 'UNAUTHORIZED'
    },
    USER_ALREADY_REGISTERED : {
        statusCode:400,
        customMessage : 'Email address you have entered is already registered with us.',
        type : 'USER_ALREADY_REGISTERED'
    },
    PHONE_NUMBER_ALREADY_EXISTS : {
        statusCode:400,
        customMessage : 'Phone no. you have entered is already registered with us.',
        type : 'PHONE_NUMBER_ALREADY_EXISTS'
    },
    BOAT_REG_NUM_ALREADY_EXISTS : {
        statusCode:400,
        customMessage : 'Boat Reg. No. Already Exist.',
        type : 'BOAT_REG_NUM_ALREADY_EXISTS'
    },
    INVALID_CREDENTIALS : {
        statusCode: 400,
        customMessage: 'Oops! Email or password is incorrect.',
        type: 'INVALID_CREDENTIALS'
    },
    USER_BLOCKED: {
        statusCode:400,
        customMessage : 'Sorry there seems to be a problem with your account, please contact our user service team',
        type : 'USER_BLOCKED'
    },
    ALREADY_VERIFIED:{
        statusCode: 400,
        customMessage: 'User already verified.',
        type: "ALREADY_VERIFIED"
    },
    INVALID_OTP : {
        statusCode: 400,
        customMessage: 'Please enter valid OTP.',
        type: 'INVALID_OTP'
    },
    PASSWORD_REQUIRED : {
        statusCode: 400,
        customMessage: 'Password is Required.',
        type: 'PASSWORD_REQUIRED'
    },
    EMAIL_PHONE_REQUIRED : {
        statusCode: 400,
        customMessage: 'Email/Phone Number is Required.',
        type: 'EMAIL_PHONE_REQUIRED'
    },
    EMAIL_PHONE_PASSWORD_REQUIRED : {
        statusCode: 400,
        customMessage: 'Email/Phone Number and password is Required.',
        type: 'EMAIL_PHONE_PASSWORD_REQUIRED'
    },
    SOCIAL_ID_REQUIRED : {
        statusCode: 400,
        customMessage: 'Social Id is Required.',
        type: 'SOCIAL_ID_REQUIRED'
    },
    USER_ALREADY_VERIFIED: {
        statusCode:400,
        customMessage : 'User account is already verified.',
        type : 'USER_ALREADY_VERIFIED'
    },
    USER_NOT_VERIFIED: {
        statusCode:406,
        customMessage : 'Please verify the email first through the link sent on your registered email id.',
        type : 'USER_NOT_VERIFIED'
    },
    NOT_REGISTERED_WITH_SOCIAL : {
        statusCode: 404,
        customMessage: 'You are not registered. Please register yourself first.',
        type: 'NOT_REGISTERED_WITH_SOCIAL'
    },
    WRONG_PASSWORD: {
        statusCode: 400,
        customMessage: 'Oops! The email or password is incorrect.',
        type: 'WRONG_PASSWORD'
    },
    INVALID_TOKEN: {
        statusCode:400,
        customMessage : 'Please login again, invalid access',
        type : 'INVALID_TOKEN'
    },
    INCORRECT_OLD_PASSWORD:{
        statusCode: 400,
        customMessage: 'Incorrect old password',
        type: 'INCORRECT_OLD_PASSWORD'
    },
    SAME_NEW_PASSWORD_NOT_MATCH:{
        statusCode: 400,
        customMessage: 'Old and new passwords can\'t be same',
        type: 'SAME_NEW_PASSWORD_NOT_MATCH'
    },
    INVALID_EMAIL : {
        statusCode: 400,
        customMessage: 'The email address you have entered does not match.',
        type: 'INVALID_EMAIL'
    },
    EXPIRE_LINK:{
        statusCode: 400,
        customMessage: 'The link has expired.',
        type: 'EXPIRE_LINK'
    },
    INVALID_IMAGE_FORMAT : {
        statusCode:400,
        customMessage : 'Invalid image format.',
        type : 'INVALID_IMAGE_FORMAT'
    },
    NO_FILE : {
        statusCode:400,
        customMessage : 'No file uploaded.',
        type : 'NO_FILE'
    },
    USER_NOT_FOUND : {
        statusCode:400,
        customMessage : 'User Not Exists.',
        type : 'USER_NOT_FOUND'
    },
    BOOKING_NOT_FOUND : {
        statusCode:400,
        customMessage : 'Booking Not Exists.',
        type : 'BOOKING_NOT_FOUND'
    },
    SPOT_NOT_FOUND : {
        statusCode:400,
        customMessage : 'Spot Not Exists.',
        type : 'SPOT_NOT_FOUND'
    },
    SPOT_TYPE_NOT_FOUND : {
        statusCode:400,
        customMessage : 'Spot Type Not Exists.',
        type : 'SPOT_TYPE_NOT_FOUND'
    },
    WATER_WAY_NOT_FOUND : {
        statusCode:400,
        customMessage : 'Water Way Not Exists.',
        type : 'WATER_WAY_NOT_FOUND'
    },
    TIEUP_NOT_EXISTS : {
        statusCode:400,
        customMessage : 'Tie-up Not Exists.',
        type : 'TIEUP_NOT_EXISTS'
    },
    BEACON_NOT_EXISTS : {
        statusCode:400,
        customMessage : 'Beacon Not Exists.',
        type : 'BEACON_NOT_EXISTS'
    },
    DOCK_NOT_EXISTS : {
        statusCode:400,
        customMessage : 'Dock Not Exists.',
        type : 'DOCK_NOT_EXISTS'
    },
    MUSIC_TYPE_NOT_EXIST : {
        statusCode:400,
        customMessage : 'Music Type Not Exists.',
        type : 'MUSIC_TYPE_NOT_EXIST'
    },
    SPOT_TYPE_NOT_EXIST : {
        statusCode:400,
        customMessage : 'Spot Type Not Exists.',
        type : 'SPOT_TYPE_NOT_EXIST'
    },
    WORKOUT_NOT_EXIST : {
        statusCode:400,
        customMessage : 'Workouts Not Exists.',
        type : 'WORKOUT_NOT_EXIST'
    },
    NO_FEELINGS_FIND : {
        statusCode:400,
        customMessage : 'Feelings donot exist.',
        type : 'NO_FEELING_EXIST'
    },
    AMINITY_NOT_EXIST : {
        statusCode:400,
        customMessage : 'Aminity Not Exists.',
        type : 'AMINITY_NOT_EXIST'
    },
    MEETUP_NOT_EXISTS : {
        statusCode:400,
        customMessage : 'Meetup Not Exists.',
        type : 'MEETUP_NOT_EXISTS'
    },
    FILTER_TYPE_NOT_EXISTS : {
        statusCode:400,
        customMessage : 'Filter Type Not Exists.',
        type : 'FILTER_TYPE_NOT_EXISTS'
    },
    CAN_NOT_TIEUP : {
        statusCode:400,
        customMessage : 'You can not tie-up now.',
        type : 'CAN_NOT_TIEUP'
    },
    CAN_NOT_POST_MEETUP : {
        statusCode:400,
        customMessage : 'Currently, you donot have an access for posting a meetup. Please contact admin.',
        type : 'CAN_NOT_POST_MEETUP'
    },
    INVALID_STRIPE_TOKEN : {
        statusCode:400,
        customMessage : 'Stripe Token is invalid!.',
        type : 'INVALID_STRIPE_TOKEN'
    },
    STRIPE_ERROR: {
        statusCode: 400,
        customMessage: 'Error in Stripe',
        type: 'STRIPE_ERROR'
    },
    GOAL_ALREADY_EXIST: {
        statusCode: 400,
        customMessage: 'Similar Goal with this Workout already exist!',
        type: 'GOAL_ALREADY_EXIST'
    },
    CAN_NOT_ADD : {
        statusCode: 400,
        customMessage: 'You have reached your maximum card limit!',
        type: 'CAN_NOT_ADD'
    },
    CAN_NOT_DELETE_DEFAULT_CARD: {
        statusCode: 400,
        customMessage: 'Card cannot be deleted as it is default card.',
        type: 'CAN_NOT_DELETE_DEFAULT_CARD'
    },
    CARD_CANNOT_BE_DELETED: {
        statusCode: 400,
        customMessage: 'Card cannot be deleted as it is in active use.',
        type: 'CARD_CANNOT_BE_DELETED'
    },
    NOTHING_TO_UPDATE : {
        statusCode:400,
        customMessage : 'Nothing to update.',
        type : 'NOTHING_TO_UPDATE'
    },
    ALREADY_BLOCKED: {
        statusCode: 400,
        customMessage: "User is already blocked.",
        type: 'ALREADY_BLOCKED'
    },
    NOT_ENOUGH_COINS: {
        statusCode: 400,
        customMessage: "Looks like you don't have that many coins to challenge.",
        type: 'NOT_ENOUGH_COINS'
    },
    CHALLENGE_EXPIRED: {
        statusCode: 400,
        customMessage: "Challenge Expired.",
        type: 'CHALLENGE_EXPIRED'
    },
    MONTH_YEAR_REQUIRED: {
        statusCode: 400,
        customMessage: "Month/Year is required.",
        type: 'MONTH_YEAR_REQUIRED'
    },
    CAN_MAKE_ONLY_ONE_BEACON: {
        statusCode: 400,
        customMessage: "You already have one beacon. You can not make more than one beacon.",
        type: 'CAN_MAKE_ONLY_ONE_BEACON'
    },
    PAYMENT_FAILURE: {
        statusCode: 400,
        customMessage: 'Booking could not be created due to payment failure',
        type: 'PAYMENT_FAILURE'
    },
    DOCK_NOT_AVAILABLE: {
        statusCode: 400,
        customMessage: "Dock is Not available.",
        type: 'DOCK_NOT_AVAILABLE'
    },
    DOCK_ID_REQUIRED: {
        statusCode: 400,
        customMessage: "Dock Id is required.",
        type: 'DOCK_ID_REQUIRED'
    },
    CAN_NOT_DO_TIEUP: {
        statusCode: 405,
        customMessage: "You can not do tieup. Please try again once you have dropped your own beacon",
        type: 'CAN_NOT_DO_TIEUP'
    },
    CAN_NOT_BOOK_DOCK: {
        statusCode: 400,
        customMessage: "You can not Book this Dock in this time period.",
        type: 'CAN_NOT_BOOK_DOCK'
    },
    CAN_NOT_DELETE_DOCK: {
        statusCode: 400,
        customMessage: "You can not delete this Dock.",
        type: 'CAN_NOT_DELETE_DOCK'
    },
    DOCK_HOUSE_FULL : {
        statusCode: 400,
        customMessage: "Dock is full.",
        type: 'DOCK_HOUSE_FULL'
    },
    FLAG_OR_USERID_REQUIRED: {
        statusCode: 400,
        customMessage: "Flag or UserId is required.",
        type: 'FLAG_OR_USERID_REQUIRED'
    },
    ALREADY_UNBLOCKED: {
        statusCode: 400,
        customMessage: "User is already unblocked.",
        type: 'ALREADY_UNBLOCKED'
    },
    ENTER_VALID_NUMBER:{
        statusCode: 400,
        customMessage: 'Please enter a valid phone number.',
        type: "ENTER_VALID_NUMBER"
    },
    TOKEN_ALREADY_EXPIRED: {
        statusCode:401,
        customMessage : 'Token Already Expired',
        type : 'TOKEN_ALREADY_EXPIRED'
    },
    SESSION_EXPIRED : {
        statusCode:401,
        customMessage : 'Your session expired',
        type : 'SESSION_EXPIRED'
    },
    INVALID_OBJECT_ID : {
        statusCode:400,
        customMessage : 'Invalid Id provided.',
        type : 'INVALID_OBJECT_ID'
    },
    DB_ERROR: {
        statusCode: 400,
        customMessage: 'DB Error : ',
        type: 'DB_ERROR'
    },
    APP_ERROR: {
        statusCode: 400,
        customMessage: 'Application Error ',
        type: 'APP_ERROR'
    },
    DUPLICATE: {
        statusCode: 400,
        customMessage: 'Duplicate Entry',
        type: 'DUPLICATE'
    },
    CARD_NOT_EXIST: {
        statusCode: 400,
        customMessage: "Card Not Exist.",
        type: 'CARD_NOT_EXIST'
    },
    DEFAULT: {
        statusCode: 400,
        customMessage: 'Something went wrong.',
        type: 'DEFAULT'
    }
};
exports.SUCCESS = {
    REGISTERED: {
        statusCode: 200,
        customMessage: 'Registered Successfully',
        type: 'REGISTERED'
    },
    BOOKING_CREATED: {
        statusCode: 200,
        customMessage: 'Booking Created Successfully',
        type: 'BOOKING_CREATED'
    },
    USER_REGISTERED: {
        statusCode: 200,
        customMessage: 'Mail has been sent on your registered Email! Please Verify.',
        type: 'USER_REGISTERED'
    },
    UPDATED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Updated Successfully.',
        type: 'UPDATED_SUCCESSFULLY'
    },
    DELETED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Deleted Successfully.',
        type: 'DELETED_SUCCESSFULLY'
    },
    RESEND_OTP: {
        statusCode: 200,
        customMessage: 'OTP has been sent successfully.',
        type: 'RESEND_OTP'
    },
    NOTES_ADDED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Notes Added Successfully',
        type: 'NOTES_ADDED_SUCCESSFULLY'
    },
    CARD_ADDED: {
        statusCode: 200,
        customMessage: "Card added successfully",
        type: 'CARD_ADDED'
    },
    BANK_ACCOUNT_ADDED: {
        statusCode: 200,
        customMessage: "Bank account added successfully",
        type: 'BANK_ACCOUNT_ADDED'
    },
    DEFAULT_CARD: {
        statusCode: 200,
        customMessage: "Default card changed successfully.",
        type: 'DEFAULT_CARD'
    },
    RATING_DONE: {
        statusCode: 200,
        customMessage: 'Rating done successfully.',
        type: 'RATING_DONE'
    },
    PROFILE_UPDATED : {
        statusCode: 200,
        customMessage: 'Your profile has been updated successfully.',
        type: 'PROFILE_UPDATED'
    },
    TIE_UP_CREATED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Tie Up Created Successfully',
        type: 'TIE_UP_CREATED_SUCCESSFULLY'
    },
    MEETUP_CREATED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Meetup Created Successfully. Please contact admin for verify.',
        type: 'MEETUP_CREATED_SUCCESSFULLY'
    },
    DOCK_CREATED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Dock Created Successfully.',
        type: 'DOCK_CREATED_SUCCESSFULLY'
    },
    DEFAULT: {
        statusCode: 200,
        customMessage: 'Success',
        type: 'DEFAULT'
    },
    CONNECT_BEACON: {
        statusCode: 200,
        customMessage: 'Connection With Beacon Successfully.',
        type: 'CONNECT_BEACON'
    },
    DISCONNECT_BEACON: {
        statusCode: 200,
        customMessage: 'Disconnect With Beacon Successfully.',
        type: 'DISCONNECT_BEACON'
    },
    MEETUP_DELTED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Meetup deleted Successfully.',
        type: 'MEETUP_DELTED_SUCCESSFULLY'
    },
    DOCK_DELETED_SUCCESSFULLY: {
        statusCode: 200,
        customMessage: 'Dock deleted Successfully.',
        type: 'DOCK_DELETED_SUCCESSFULLY'
    },
    SET_AVAILABILITY: {
        statusCode: 200,
        customMessage: 'Thanks, your availability has now been updated.',
        type: 'SET_AVAILABILITY'
    },
    LOGGED_IN : {
        statusCode: 200,
        customMessage: 'Logged In Successfully.',
        type: 'LOGGED_IN'
    },
    PROMO_CODE_CREATED : {
        statusCode : 200,
        customMessage : 'Promo code created successfully.',
        type : "PROMO_CODE_CREATED"
    },
    PROMO_CODE_APPLIED: {
        statusCode: 200,
        customMessage: 'Promotion code applied successfully.',
        type: 'PROMO_CODE_APPLIED'
    },
    LOGOUT : {
        statusCode: 200,
        customMessage: 'Logged out successfully.',
        type: 'LOGOUT'
    },
    NEW_PASSWORD_LINK_SENT: {
        statusCode:200,
        customMessage : 'Reset password link has been sent to your email id.',
        type : 'NEW_PASSWORD_LINK_SENT'
    },
    PASSWORD_CHANGED: {
        statusCode: 200,
        customMessage: 'Password updated successfully.',
        type: 'PASSWORD_CHANGED'
    },
    ADDED : {
        statusCode: 200,
        customMessage: 'Added successfully.',
        type: 'ADDED'
    },
    USER_VERIFIED_SUCCESSFULLY : {
        statusCode: 200,
        customMessage: 'User Verified Successfully.',
        type: 'USER_VERIFIED_SUCCESSFULLY'
    }
};
exports.swaggerDefaultResponseMessages = [
    {code: 200, message: 'OK'},
    {code: 201, message: 'CREATED'},
    {code: 400, message: 'Bad Request'},
    {code: 401, message: 'Unauthorized'},
    {code: 404, message: 'Data Not Found'},
    {code: 406, message: 'User Not Verified'},
    {code: 500, message: 'Something went wrong, try again'}
];