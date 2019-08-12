/**
 * Created by CBL40 on 7/25/17.
 */
'use strict';

var stripeToken = require('../Config').stripeCredentials.stripeToken,
    stripe = require('stripe')(stripeToken),
    DAO = require('../DAOManager').queries,
    async = require('async'),
    ERROR = require('../Config').responseMessages.ERROR,
    mongoose = require('mongoose'),
    Models = require('../Models/'),
    logger = require('log4js').getLogger('[Stripe Manager]');

exports.addCreditCard = function(authData, payload, defaultStatus, flag, stripeUserId, callback)
{
    if(flag == 1)
    {
        stripe.customers.create({source: payload.stripeToken, email: authData.email}, function (err, user) {
            if (err) {
                logger.error("Error in create customer if new customer-->>>>",err);
                callback(ERROR.INVALID_STRIPE_TOKEN)
            }
            else
            {
                var dataToSet = {
                    userId : authData._id,
                    stripeUserId : user.id,
                    lastFourDigit : user.sources.data[0].last4,
                    cardType : user.sources.data[0].brand,
                    cardToken : user.sources.data[0].id,
                    defaultStatus : defaultStatus
                };

                DAO.saveData(Models.userCards, dataToSet,callback)
            }
        });
    }
    else
    {
        async.waterfall([
            function(callback)
            {
                stripe.customers.createSource(
                    stripeUserId,
                    {source: payload.stripeToken},
                    function (err, user) {
                        if (err) {
                            logger.error("Error in create customer if already exist customer-->>>>",err);
                            callback(ERROR.INVALID_STRIPE_TOKEN)
                        }
                        else
                        {
                            var dataToSet = {
                                userId : authData._id,
                                stripeUserId : stripeUserId,
                                lastFourDigit : user.last4,
                                cardType : user.brand,
                                cardToken : user.id,
                                defaultStatus : defaultStatus
                            };

                            DAO.saveData(Models.userCards, dataToSet,callback)
                        }
                    }
                );
            }
        ],function(err,insertId){
            if(err) {
                logger.error("err-->>",err);
                callback(err);
            }
            else {
                if(defaultStatus == 0) callback(null,insertId);
                else DAO.update(Models.userCards,{userId : authData._id, _id : {$ne : insertId._id}},
                    {$set : {defaultStatus : false}},{lean : true,multi : true},function(err,result){
                    if(err) {
                        logger.error("err in update cards query-->>",err);
                        callback(err);
                    }
                    else callback(null,insertId)
                })
            }
        })
    }
};

exports.retrieveUser = function(userStripeId,callback)
{
    stripe.charges.retrieve(userStripeId,function(err,userDetails){
        if(err) callback(ERROR.STRIPE_ERROR);
        else callback(null,userDetails)
    })
};

exports.deleteUser = function(userStripeId,callback)
{
    stripe.charges.del(userStripeId,function(err,confirmation){
        if(err) callback(ERROR.STRIPE_ERROR);
        else callback(null,confirmation)
    })
};

exports.deleteCard = function(userStripeId,cardId,callback)
{
    stripe.customers.deleteCard(userStripeId,cardId,function(err,confirmation){
        if(err) callback(ERROR.STRIPE_ERROR);
        else callback(null,confirmation)
    })
};

exports.holdAmount = function(userStripeId,cardToken,applicationFee,holdAmount,destinationUserId,bookingId,callback)
{
    let dataToPass = {
        amount: holdAmount * 100,
        application_fee : applicationFee,
        currency: 'usd',
        customer : userStripeId,
        source: cardToken,
        capture: false,
        description: "Price for booking id : " + bookingId
    };

    if(destinationUserId != "") dataToPass.destination = destinationUserId;

    stripe.charges.create(dataToPass,function(err,paymentResult){
        if(err) {
            logger.error("error in stripe---->>>",err);
            callback(ERROR.STRIPE_ERROR);
        }
        else callback(null,paymentResult.id)
    })
};

exports.createAmount = function(userStripeId,cardToken,applicationFee,holdAmount,destinationUserId,bookingId,callback)           //Without Holding
{
    let dataToPass = {
        amount: holdAmount * 100,
        application_fee : applicationFee,
        currency: 'usd',
        customer : userStripeId,
        source: cardToken,
        capture: true,
        description: "Price for booking id : " + bookingId
    };

    if(destinationUserId != "") dataToPass.destination = destinationUserId;

    logger.debug("data-->>>",dataToPass);

    stripe.charges.create(dataToPass,function(err,paymentResult){
        if(err) {
            logger.error("error in stripe---->>>",err);
            callback(ERROR.STRIPE_ERROR);
        }
        else callback(null,paymentResult.id)
    })
};

exports.retrieveCharges = function(transaction_id,callback)
{
    stripe.charges.retrieve({charge : transaction_id}
        ,function(err,retrieveResult){
            if(err) {
                logger.error("err in stripe release capture amount--->>>>>",err);
                callback(ERROR.STRIPE_ERROR)
            }
            else callback(null,retrieveResult);
        });
};

exports.releaseHoldedAmount = function(transaction_id,callback)
{
    stripe.charges.capture(
        transaction_id
        ,function(err,captureResult){
            if(err) {
                logger.error("err in stripe release capture amount--->>>>>",err);
                callback(ERROR.STRIPE_ERROR)
            }
            else callback(null,captureResult);
        });
};

exports.captureSomeHoldedAmount = function(transaction_id,deductAmount,callback)
{
    stripe.charges.capture(
        transaction_id,
        {amount : deductAmount * 100}
        ,function(err,captureResult){
            if(err) {
                logger.error("err in stripe capture amount--->>>>>",err);
                callback(ERROR.STRIPE_ERROR)
            }
            else callback(null,captureResult);
        });
};

exports.refundAmount = function(transaction_id,callback)
{
    stripe.refunds.create(
        {charge : transaction_id}
        ,function(err,captureResult){
            if(err) {
                logger.error("err in stripe refund amount--->>>>>",err);
                callback(ERROR.STRIPE_ERROR)
            }
            else callback(null,captureResult);
        });
};

exports.retrieveRefundAmount = function(refundId,callback)
{
    stripe.refunds.retrieve(
        {refund : refundId}
        ,function(err,refundAmount){
            if(err) {
                logger.error("err in stripe refund amount--->>>>>",err);
                callback(ERROR.STRIPE_ERROR)
            }
            else callback(null,refundAmount);
        });
};
