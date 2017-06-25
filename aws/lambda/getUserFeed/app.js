'use strict';

var MongoClient = require('mongodb').MongoClient;
var util = require('util');

let atlas_connection_uri;
let cacheDb = null;

exports.handler = (event, context, callback) => {
    var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];

    if (atlas_connection_uri !== null && typeof atlas_connection_uri !== 'undefined') {
        processEvent(event, context, callback);
    } else {
        atlas_connection_uri = uri;
        processEvent(event, context, callback);
    }
};

function processEvent(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        if (cacheDb == null) {
            MongoClient.connect(atlas_connection_uri, (err, db) => {
                if (err) {
                    console.error('db conneciton: '+ err);
                } else {
                    cacheDb = db;
                    return getPosts(db, event, callback, context);
                }
            });
        } else {
            getPosts(cacheDb, event, callback, context);
        }
    } catch (e) {
        console.error('error: ' + e);
    }
}

function getPosts(db, event, callback, context) {
    console.log(event);
    let sub = event.sub;
    db.collection('posts').find({sub:sub}).toArray((err, result) => {
        if (err) {
            callback(err, context);
        } else {
            callback(null, result);
        }
    });
}
