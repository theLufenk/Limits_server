/**
 * Created by CBL40 on 5/25/17.
 */

'use strict';

let bucket = "",
    accessKeyId = "",
    secretAccessKey = "",
    s3URL = "";

let folder = {
    "profilePicture": "profilePicture",
    "thumb": "thumb",
    // "picInApps": "picInApps",
    "user": "user",
    // "boat": "boat",
    // "tieup": "tieup",
    // "spot": "spot",
    // "meetup": "meetup",
    // "dock": "dock",
    // "spotType": "spotType",
    // "aminity": "aminity"
    "workout":"workout"
};

module.exports = {
    bucket: bucket,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    s3URL: s3URL,
    folder: folder
};
