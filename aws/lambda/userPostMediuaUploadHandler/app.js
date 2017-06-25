'use strict'

var MongoClient = require('mongodb').MongoClient;
var util = require('util');

let atlas_connection_uri;
let cacheDb = null;

exports.handler = (event, context, callback) => {
    var uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];

    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    if (atlas_connection_uri != null) {
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
                    return createDoc(db, event, callback);
                }
            });
        } else {
            createDoc(cacheDb, event, callback);
        }
    } catch (e) {
        console.error('error: ' + e);
    }
}

function createDoc(db, json, callback) {
    db.collection('test').insertOne(json, (err, result) => {
        if (err) {
            console.error('error :' + err);
        } else {
            console.log(result);
            callback(null, 'SUCCESS');
        }
    });
}
