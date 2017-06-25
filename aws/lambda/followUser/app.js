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
            console.log('=> connecting to db');
            MongoClient.connect(atlas_connection_uri, (err, db) => {
                if (err) {
                    console.error('db conneciton: '+ err);
                } else {
                    cacheDb = db;
                    console.log('=> Connected to db!');
                    return followUser(db, event, callback, context);
                }
            });
        } else {
            followUser(cacheDb, event, callback, context);
        }
    } catch (e) {
        console.error('error: ' + e);
    }
}

function followUser(db, event, callback) {
    let sub = event.sub;
    let toFollow = event.tofollow;
    db.collection('following').update({sub:sub}, {$addToSet: { users: toFollow }}, (err, result) => {
        if (err) {
            console.log(err);
            callback(err, event);
        } else {
            callback(null, event);
        }
    });
}
