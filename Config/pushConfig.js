/**
 * Created by CBL40 on 9/5/17.
 */
'use strict';

let iOSPushSettings = {
        brandName : "TIE-UP",
        fcmSender : ""
    },
    androidPushSettings = {
        brandName: "TIE-UP",
        fcmSender : ""
    };

if (process.env.NODE_ENV == 'dev'){

    iOSPushSettings.fcmSender = "AAAA_VkzgXE:APA91bGLXswrIuo-dz3RubcL7hl8aSgFr8rRxgCRHAHwu4Plku1oTiW0zyGvTjWWrG30S6m9ZVML8Izfm8TIh6HydYn83E2L4MiF6gg1KRo60qEIx3TI_eXoybqf5Q1Ac6uPQ094tS7B";
    androidPushSettings.fcmSender = "AAAA_VkzgXE:APA91bGLXswrIuo-dz3RubcL7hl8aSgFr8rRxgCRHAHwu4Plku1oTiW0zyGvTjWWrG30S6m9ZVML8Izfm8TIh6HydYn83E2L4MiF6gg1KRo60qEIx3TI_eXoybqf5Q1Ac6uPQ094tS7B";

}

module.exports = {
    iOSPushSettings: iOSPushSettings,
    androidPushSettings : androidPushSettings
};
