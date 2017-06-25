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
        console.log(atlas_connection_uri);
        processEvent(event, context, callback);
    }
};

function processEvent(event, context, callback) {
    console.log('Calling MongoDB Atlas from AWS Lambda with event: ' + JSON.stringify(event));
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        if (cacheDb == null) {
            MongoClient.connect(atlas_connection_uri, (err, db) => {
                if (err) {
                    callback(err, context);
                } else {
                    cacheDb = db;
                    return checkNotifications(db, event, callback, context);
                }
            });
        } else {
            checkNotifications(cacheDb, event, callback, context);
        }
    } catch (e) {
        callback(e, context);
    }
}

function checkNotifications(db, event, callback, context) {
    let sub = event.sub;
    db.collection('notifications').findOne({sub:sub}, (err, result) => {
        if (err) {
            callback(err, context);
        } else {
            callback(null, result);
        }
    });
}
