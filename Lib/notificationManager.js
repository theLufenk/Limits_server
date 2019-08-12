/**
 * Created by Rajat on 1/21/16.
 */

let Config = require('../Config'),
    async = require('async'),
    FCM = require('fcm-push'),
    CONSTANTS = require('../Config'),
    Path = require('path'),
    USER_TYPE = require('../Config').constants.USER_TYPE,
    _ = require('underscore'),
    nodeMailerModule = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    transporter = nodeMailerModule.createTransport(smtpTransport(Config.emailConfig.smtpConfig.Mandrill)),
    emailTemplates = require('../Config/emailTemplates'),
    logger = require('log4js').getLogger('[Notification Manager]');
    //https = require('https');

/*
 ==================================================
 Send the notification to the android/IOS device
 ==================================================
 */
exports.sendFCMPushNotification = (deviceToken, data, callback)=> {

    let serverKey = Config.pushConfig.androidPushSettings.fcmSender,
        fcm = new FCM(serverKey);

    logger.fatal(" device token, server key ---->>>>",deviceToken);

    let message = {
        registration_ids : deviceToken,
        collapse_key: 'your_collapse_key',
        notification : {
            title : "FitGhost",
            message : data.message,
          //flag : data.flag,
            body : data.message,
            data : data
        },
        data: {
            title : "FitGhost",
            message : data.message,
            //flag : data.flag,
            body : data.data
        },
        priority: "high"
    };

    fcm.send(message, function (err, messageId) {
        if(err) {
            logger.error("Something has gone wrong !");
            callback(err)
        } else {
            logger.info("Successfully sent with response :");

            callback(null,messageId)
        }
    });
};

exports.sendEmailToUser = (emailType, emailVariables, emailId, emailSubject, callback)=> {
    let mailOptions = {
        from: 'FitGhost <' + Config.emailConfig.smtpConfig.Mandrill.senderEmail + '>',
        to: emailId,
        subject: null,
        html: null
    };

    async.series([
         (cb)=> {
            switch (emailType) {
                case 'TESTING_MAIL':
                    mailOptions.subject = emailSubject;
                    mailOptions.html = "<h1>This is Testing Email</h1>";
                    break;
                case 'USER_PAYMENT_ACCOUNT_CREATE':
                    mailOptions.subject = emailSubject;
                    mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.stripeAccountRegister, emailVariables);
                    break;
                case 'VERIFICATION_EMAIL':
                    mailOptions.subject = emailSubject;
                    mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.verificationEmail, emailVariables);
                    break;
                case 'FORGOT_PASSWORD':
                    mailOptions.subject = emailSubject;
                    mailOptions.html = renderMessageFromTemplateAndVariables(emailTemplates.forgotPassword, emailVariables);
                    break;
            }
            return cb();
        },  (cb)=> {
            sendMailViaTransporter(mailOptions, (err, res)=> {
                if (err) return cb(err);
                else return cb();
            });
        }
    ], (err)=> {
        if (err) callback(err);
        else callback(null);
    });
};

function renderMessageFromTemplateAndVariables(templateData, variablesData) {
    let Handlebars = require('handlebars');
    return Handlebars.compile(templateData)(variablesData);
}

function sendMailViaTransporter(mailOptions, cb) {
    transporter.sendMail(mailOptions, function (error, info) {
        logger.error('Mail Sent Callback Error:', error);
        logger.info('Mail Sent Callback Info:', info);
    });
    cb(null, null);
}