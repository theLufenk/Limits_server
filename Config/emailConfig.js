
var smtpConfig = {
    "Mandrill" : {
        host: "smtp.gmail.com",
        port: 587,                                              // port for secure SMTP
        auth: {
            user: "@gmail.com",
            pass: "sd"
        },
        senderEmail : "@gmail.com"
    }
};
module.exports = {
    smtpConfig: smtpConfig
};
