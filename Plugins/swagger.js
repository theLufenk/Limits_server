/**
 * Created by Rajat on 9/11/15.
 */

//Register Swagger
'use strict';

let pack = require('../package'),
    swaggerOptions = {
        pathPrefixSize: 2
    };

const Inert = require('inert'),
    Vision = require('vision');

exports.register = function(server, options, next){

    server.register([
        Inert,
        Vision,
        {
        register: require('hapi-swagger'),
        options: swaggerOptions
    }], function (err) {
        if (err) server.log(['error'], 'hapi-swagger load error: ' + err);
        else server.log(['start'], 'hapi-swagger interface loaded')
    });

    next();
};

exports.register.attributes = {
    name: 'swagger-plugin'
};
