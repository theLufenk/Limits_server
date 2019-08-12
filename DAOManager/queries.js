/**
 * Created by cl-desktop31 on 20/5/16.
 */
'use strict';

let saveData = function(model,data,callback){
    new model(data).save(function(err,result){
        if(err) return callback(err);
        callback(null,result);
    })
};

let getData = function (model, query, projection, options, callback) {
//console.log('testm434odel',query);

    model.find(query, projection, options, function (err, data) {
        if (err) return callback(err);
        else return callback(null, data);
    });
};

let findOne = function (model, query, projection, options, callback) {

    model.findOne(query, projection, options, function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
    });
};

let findAndUpdate = function (model, conditions, update, options, callback) {
    model.findOneAndUpdate(conditions, update, options, function (error, result) {
        if (error) {
            return callback(error);
        }
        return callback(null, result);
    })
};

let update = function (model, conditions, update, options, callback) {
    model.update(conditions, update, options, function (err, result) {
        if (err) {
            return callback(err);
        }
         callback(null, result);

    });
};

let remove = function (model, condition, callback) {
    model.remove(condition, function (err, result) {
        if (err) {
            return callback(err);
        }
        else callback(null, result);
    });
};
/*------------------------------------------------------------------------
 * FIND WITH REFERENCE
 * -----------------------------------------------------------------------*/
let populateData = function (model, query, projection, options, collectionOptions, callback) {
    model.find(query, projection, options).populate(collectionOptions).exec(function (err, data) {

        if (err) return callback(err);
        else return callback(null, data);

    });
};

let count = function (model, condition, callback) {
    model.count(condition, function (error, count) {
        if (error) return callback(error);
        else return callback(null, count);
    })
};
let distinct = function (model,field, condition, callback) {
    model.distinct(field,condition, function (error, count) {
        if (error) return callback(error);
        else return callback(null, count);
    })
};
/*
 ----------------------------------------
 AGGREGATE DATA
 ----------------------------------------
 */
let aggregateData = function (model, group, callback) {
    model.aggregate(group, function (err, data) {

        if (err) return callback(err);
        else return callback(null, data);
    });
};

let insert = function(model, data, options, callback){
    model.collection.insert(data,options, function(err,result){
        if(err) callback(err);
        else callback(null,result);
    })
};

let insertMany = function(model, data, options, callback){
    model.collection.insertMany(data,options, function(err,result){
        if(err) callback(err);
        else callback(null,result);
    })
};

let aggregateDataWithPopulate = function (model, group, populateOptions, callback) {
    model.aggregate(group, (err, data) => {

        if (err) return callback(err);

        model.populate(data, populateOptions,
            function (err, populatedDocs) {

                if (err) return callback(err);
                return callback(null, populatedDocs);// This object should now be populated accordingly.
            });
    });
};

let deepPopulate= function(model, criteria, projectionQuery, options, populateModel, nestedModel, callback)
{
    model.find(criteria, projectionQuery, options).populate(populateModel)
        .exec(function (err, docs) {
            if (err) return callback(err);

            model.populate(docs, nestedModel,
                function (err, populatedDocs) {
                    if (err) return callback(err);
                    callback(null, populatedDocs);// This object should now be populated accordingly.
                });
        });
};

let bulkFindAndUpdate= function(bulk,query,update,options)
{
    bulk.find(query).upsert().update(update,options);
};

let bulkFindAndUpdateOne= function(bulk,query,update,options)
{
    bulk.find(query).upsert().updateOne(update,options);
};


module.exports = {
    saveData : saveData,
    getData : getData,
    update : update,
    remove: remove,
    insert: insert,
    count: count,
    distinct:distinct,
    findOne: findOne,
    findAndUpdate : findAndUpdate,
    populateData : populateData,
    aggregateData : aggregateData,
    aggregateDataWithPopulate: aggregateDataWithPopulate,
    deepPopulate: deepPopulate,
    bulkFindAndUpdate : bulkFindAndUpdate,
    bulkFindAndUpdateOne : bulkFindAndUpdateOne,
    insertMany:insertMany
};