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
    let liker = event.sub;
    if (like == 1) {
        amt = 1;
    } else {
        amt = -1;
    }
    getLikerUserName(db,liker).
    then((liker) => { return recordLike(db, liker, amt, postId); }).
    then(() => { return getPostAuthor(db, postId); }).
    then((author) => { ;return addNotification(db, author, liker, postId, callback); }).
    then((result) => { callback(null, result); }).
    catch((err) => { callback(err, context) });
}

function getPostAuthor(db, postId) {
    return new Promise((resolve, reject) => {
        db.collection('posts').findOne({_id:new ObjectId(postId)}, { sub: 1 }, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result.sub);
        });
    });
}

function recordLike(db, liker, amt, postId) {
    return new Promise((resolve, reject) => {
        db.collection('posts').updateOne({_id:new ObjectId(postId)}, { $inc: { likes:amt }, $addToSet: {likers: liker}}, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

function getLikerUserName(db, sub) {
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

function addNotification(db, author, sub, postId) {
    return new Promise((resolve, reject) => {
        let data = {
            postid: postId,
            unread: 1,
            meta: {
                who: sub,
                ts: new Date(),
                what: 'like'
            }
        };
        db.collection('notifications').update({sub:author}, {$addToSet: {notifications: data}}, (err, result) => {
            if (err) {
                reject(err);
            }  else {
                resolve(result);
            }
        });
    });
}
