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
                saveComment(db, event, callback, context);
            }
        });
    } else {
        saveComment(cacheDb, event, callback, context);
    }
}

function saveComment(db, event, callback, context) {
    let comment = event.comment;
    let postId = event.postid;
    let sub = event.sub;
    getUser(db, sub).
    then((author) => {
        let data = {
            comment: comment,
            author: author,
            datetime: new Date()
        };
        db.collection('posts').update({_id:new ObjectId(postId)}, { $addtoset: { comments: data}}, (err, result) => {
            if (err) {
                callback(err, context);
            } else {
                callback(null, result);
            }
        });
    }).catch((err) => {
        callback(err, context);
    });
}

function getUser(db, sub) {
    console.log(sub);
    return new Promise((resolve, reject) => {
        db.collection('users').findOne({sub:sub}, {name:1}, (err, result) => {
            if (err) {
                reject(err);
            } else {
            console.log(result);
                resolve(result.name);
            }
        });
    });
}
