'use strict';

var MongoClient = require('mongodb').MongoClient;

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
                    callback(err, context);
                } else {
                    cacheDb = db;
                    getUsers(db, event, callback, context);
                }
            });
        } else {
            getUsers(db, event, callback, context);
        }
    } catch (e) {
        console.error('error: ' + e);
    }
}

function getUsers(db, event, callback, context) {
    db.collection('users').find({}, (err, result) => {
        if (err) {
            callback(err, context);
        } else {
            callback(null, result);
        }
    });
}
