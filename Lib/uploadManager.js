/**
 * Created by CBL40 on 5/25/17.
 */

'use strict';

let fs = require('node-fs'),
    AWS = require('aws-sdk'),
    async = require('async'),
    logger = require('log4js').getLogger('[UPLOAD MANAGER]'),
    CONFIG = require('../Config');

function uploadImageToS3Bucket(file, isThumb, callback) {

    let path = file.path, filename = file.name, folder = file.s3Folder, mimeType = file.mimeType;
    if (isThumb) {
        path = path + 'thumb/';
        filename = file.thumbName;
        folder = file.s3FolderThumb;
    }
    let accessKeyId = CONFIG.s3BucketCredentials.accessKeyId;
    let secretAccessKeyId = CONFIG.s3BucketCredentials.secretAccessKey;
    let bucketName = CONFIG.s3BucketCredentials.bucket;

    fs.readFile(path + filename, (error, file_buffer)=> {

        if (error) return callback(error);

        AWS.config.update({accessKeyId: accessKeyId, secretAccessKey: secretAccessKeyId});
        let s3bucket = new AWS.S3();
        let params = {
            Bucket: bucketName,
            Key: folder + '/' + filename,
            Body: file_buffer,
            ACL: 'public-read',
            ContentType: mimeType
        };
        s3bucket.putObject(params, (err, data)=> {
            if (err) return callback(err);
            else {
                deleteFile(path + filename, function (err) {
                    if (err) return callback(err);
                    else return callback(null);
                })
            }
        });
    });
}

function deleteFile(path, callback) {

    fs.unlink(path, (err)=> {
        if (err) {
            logger.error(err);
            return callback(err);
        } else return callback(null);
    });

}

function generateFilenameWithExtension(oldFilename, newFilename) {
    let ext = oldFilename.substr((~-oldFilename.lastIndexOf(".") >>> 0) + 2);
    return newFilename + '.' + ext;
}

function createThumbnailImage(path, name, callback) {
    try {
        let gm = require('gm').subClass({imageMagick: true});
        let thumbPath = path + 'thumb/' + "Thumb_" + name;
        gm(path + name)
            .resize(200, 200, "!")
            .autoOrient()
            .write(thumbPath, (err, data)=> {
                if (err) return callback(err);
                else return callback(null);
            })
    } catch (e) {
        return callback(e);
    }
}

function initParallelUpload(fileObj, withThumb, callbackParent) {

    async.parallel([
        (callback)=> {
            uploadImageToS3Bucket(fileObj, false, callback);
        },
        (callback)=> {
            if (withThumb) uploadImageToS3Bucket(fileObj, true, callback);
            else callback(null);
        }
    ], (error)=> {
        if (error) return callbackParent(error);
        else return callbackParent(null);
    })

}

let uploadFile = (otherConstants, fileDetails, createThumbnail, callbackParent)=> {
    let filename = fileDetails.name,
        TEMP_FOLDER = otherConstants.TEMP_FOLDER,
        s3Folder = otherConstants.s3Folder,
        file = fileDetails.file,
        mimiType = file.hapi.headers['content-type'];

    async.waterfall([
        (callback)=> {
            saveFile(file, TEMP_FOLDER + filename, callback);
        },
        (callback)=> {
            if (createThumbnail) createThumbnailImage(TEMP_FOLDER, filename, callback);
            else callback(null);
        },
        (callback)=> {
            let fileObj = {
                path: TEMP_FOLDER,
                name: filename,
                thumbName: "Thumb_" + filename,
                mimeType: mimiType,
                s3Folder: s3Folder
            };
            if(createThumbnail) fileObj.s3FolderThumb = otherConstants.s3FolderThumb;
            initParallelUpload(fileObj, createThumbnail, callback);
        }
    ], (error)=> {
        if (error) callbackParent(error);
        else callbackParent(null);
    })
};

function saveFile(fileData, path, callback) {
    try {

        let file = fs.createWriteStream(path);

        file.on('error', function (err) {
            // console.log('@@@@@@@@@@@@@@@',err)
           return callback(err);
        });

        fileData.pipe(file);

        fileData.on('end', function (err) {
            if (err) return callback(err);
            else callback(null);
        });
    } catch (e) {
        logger.trace(e);
        return callback(e);
    }
}

module.exports = {
    generateFilenameWithExtension : generateFilenameWithExtension,
    uploadFile : uploadFile,
    deleteFile : deleteFile,
    saveFile : saveFile
};