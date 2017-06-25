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
                likedislike(db, event, callback, context);
            }
        });
    } else {
        likedislike(cacheDb, event, callback, context);
    }
}

function likedislike(db, event, callback, context) {
    let like = event.like
    let postId = event.postid;
    let amt = 0;
    let sub = event.sub;
    if (like == 1) {
        amt = 1;
    } else {
        amt = -1;
    }
    getUser(db,sub).
    then((author) => { console.log(author);db.collection('posts').updateOne({_id:new ObjectId(postId)}, { $inc: { likes: amt }, $addToSet: {likers: author}}, (err, result) => {
            if (err) {
                callback(err, context);
            } else {
                callback(null, result);
            }
        });
    }).catch((err) => { callback(err, context) });
}

function getUser(db, sub) {
    return new Promise((resolve, reject) => {
        db.collection('users').findOne({sub:sub}, { name:1 }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.name);
            }
        });
    });
}
