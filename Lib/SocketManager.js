'use strict';
let  Config = require('../Config');
let  async = require('async');
const mongoose = require('mongoose');
let socket = null;
let all={};
let Fs = require('fs');
let Path = require('path');
let fsExtra = require('fs-extra');
let DAO = require('../DAOManager').queries,
    Models = require('../Models/')

exports.connectSocket = function (server) {
    if (!server.app) {
        server.app = {}
    }
    server.app.socketConnections = {};
    // socket = require('socket.io').listen(server.listener);

    socket.on('connection', function (socket) {

        console.log("connected from client ",socket.id);

      /*  socket.on('UserAuth', function (data) {

            verifyToken(data, function (err, response) {
                if(response){
                    all[response.userData._id]=socket.id;
                    console.log("______________all_________",all);
                    updateSocketId(socket.id,response.userData._id,function (err,res) {
                    })
                } else {}
            })
        });
*/
        socket.on('saveRoute', function (data) { ////userId,workoutId,lat,long
            console.log('dataaaaaaaaaaaa',data)
            if (data.userId && data.userId) {
                saveRoute(data, function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(".............result.........");
                    }
                })
            } else console.log("data not in format");
        });


        socket.on('disconnect', function () {
            console.log('Socket disconnected---->>>>>>>>>', server.app.socketConnections,all);

            if (all.hasOwnProperty(socket.id)) var userId = all[socket.id];

            if (all.hasOwnProperty(userId)) delete all[userId];
            if (all.hasOwnProperty(socket.id)) delete all[socket.id];
       /*
            if (server.app.socketConnections.hasOwnProperty(socket.id)) var userId = server.app.socketConnections[socket.id].userId;
            if (server.app.socketConnections.hasOwnProperty(userId)) delete server.app.socketConnections[userId];
            if (server.app.socketConnections.hasOwnProperty(socket.id)) delete server.app.socketConnections[socket.id];*/
        });
    });

};

const saveRoute = function (data,callback) {
    let criteria = {
        userID: data.userId,
        workoutId:data.workoutId
    };
    let dataToSave = {
        $push:{
            routes:{
                latitude:data.lat,
                longtitude:data.long,
            }
        }
    };
    let option = {new:true};
    DAO.findAndUpdate(Models.userWorkouts,criteria,dataToSave,option,{new:true},(err,result)=>{

      callback()
    })
};