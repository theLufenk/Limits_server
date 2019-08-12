/**
 * Created by Rajat on 1/19/16.
 */
'use strict';

let Good = require('good');

//Register Good Console

exports.register = function(server, options, next){

    server.register({
        register: Good,
        options: {
            ops: {
                interval: 1000
            },
            reporters: {
                myConsoleReporter: [
                    {
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{ log: '*', response: '*' }]
                    },
                    {
                        module: 'good-console'
                    }, 'stdout'],
                myFileReporter: [{
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{ ops: '*' }]
                }, {
                    module: 'good-squeeze',
                    name: 'SafeJson'
                }],
                myHTTPReporter: [{
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{ error: '*' }]
                }, {
                    module: 'good-http',
                    args: ['http://prod.logs:3000', {
                        wreck: {
                            headers: { 'x-api-key': 12345 }
                        }
                    }]
                }]
            }
        }
    }, function (err) {
        if (err) throw err;
    });

    next();
};

exports.register.attributes = {
    name: 'good-console-plugin'
};