/**
 * Created by cl-desktop31 on 17/5/16.
 */
'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let dbkey = new Schema({
    dbkey:{type: String, required:true},
    
});

module.exports = mongoose.model('dbkey', dbkey);