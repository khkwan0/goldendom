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
                    return getFeed(db, event, callback);
                }
            });
        } else {
            getFeed(cacheDb, event, callback);
        }
    } catch (e) {
        console.error('error: ' + e);
    }
}

function getFeed(db, event, callback) {
    let sub = event.sub;
    db.collection('following').findOne({sub:sub}, (err, result) => {
        let users = result.users;
        let actions = users.map((user) => { return getLatestPost(db, user) });
        Promise.all(actions).then((data) => { console.log(data);callback(null, data) }).catch((err) => {callback(err, context)});        
    });
}

function getLatestPost(db, user) {
    return new Promise((resolve, reject) => {
        db.collection('posts').findOne({sub:user},(err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
