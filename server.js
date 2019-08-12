
'use strict';

                                                    //External Dependencies
let Hapi = require('hapi'),
    path = require('path'),
    https = require('https'),
    fs = require('fs'),
                                                    //Internal Dependencies
    Config = require('./Config'),
    Routes = require('./Routes'),
    Plugins = require('./Plugins'),
    Bootstrap = require('./Utils/bootStrap'),
    logger = require('log4js').getLogger('[SERVER]'),
     universal=require('./Utils/universalFunctions')
    // SocketManager = require('./Lib/SocketManager')


logger.info("env variables--->>>>>", process.env.NODE_ENV);

//Create Server
let server = new Hapi.Server({
    app: {
        name : Config.constants.SERVER.APP_NAME
    }
});

server.connection({
    port: Config.dbConfig.config.PORT,
    routes: { cors: true }
});

//Register All Plugins
server.register(Plugins, function (err) {
    if (err) server.error('Error while loading plugins : ' + err);
    else server.log('info','Plugins Loaded')
});

//Default Routes
server.route(
    {
        method: 'GET',
        path: '/',
        handler: function (req, res) {
            res.view('index')
        }
    }
);

//API Route
server.route(Routes);

//Adding Views
server.views({
    engines: {
        html: require('handlebars')
    },
    relativeTo: __dirname,
    path: './Utils'
});
// SocketManager.connectSocket(server)
server.on('response', function (request) {
    logger.fatal(request.info.remoteAddress + ': ' + request.method.toUpperCase() +
        ' ' + request.url.path + ' --> ' + request.response.statusCode);
    logger.debug('Request payload:', request.payload);
});

/*
Bootstrap.BOOTSTRAP_ADMIN_SETTINGS(function (err, message) {
    if (err) {
        console.log('Error while bootstrapping Admin settings : ' + err)
    } else {
        console.log(message);
    }
}); */



server.start(function (err,result) {
    if(err) server.log(err);
    else server.log('info', 'Server running at: ' + server.info.uri);
});
