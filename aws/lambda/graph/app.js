'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

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
    if (cacheDb === null) {
        MongoClient.connect(atlas_connection_uri, (err, db) => {
            if (err) {
                callback(err, context);
            } else {
                cacheDb = db;
                executeRequest(db, event, callback, context);
            }
        });
    } else {
        executeRequest(cacheDb, event, callback, context);
    }
}

function executeRequest(db, event, callback, context) {
    let request = event.request;
    let target = event.target;
    let user = event.sub;
    let collection = '';
    if (request == 'get') {
        if (target == 'following') {
            collection = 'following';
        }
        if (target == 'followers') {
            collection = 'followers';
        }
    }
    if (collection) {
        db.collection(collection).findOne({sub:user}, (err, result) => {
            if (err) {
                callback(err, context);
            } else {
                callback(null, result);
            }
        });
    }
}
