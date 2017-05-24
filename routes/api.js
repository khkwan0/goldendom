var express = require('express');
var router = express.Router();
var config = require('../config');
var fs = require('fs');

function dbFindOne(collection, fields) {
    return new Promise((resolve, reject) => {
        collection.findOne(fields, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function dbFindMany(collection, fields) {
    return new Promise((resolve, reject) => {
        collection.find(fields, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function checkIfNotEmpty(obj) {
    return new Promise((resolve, reject) => {
        if (obj == null) {
            resolve('OK');
        }
        if (Object.keys(obj).length > 0) {
            reject('EDUP');
        } else {
            resolve('OK');
        }
    });
}

function dbInsert(collection, obj) {
    return new Promise((resolve, reject) => {
        collection.insert(obj, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

router.post('/register', (req, res, next) => {
    let uname = req.body.uname;
    let pwd = req.body.pwd;
    if (uname && pwd) {
        Users = req.db.get('users');

        dbFindOne(Users, {uname:uname}).
        then((result) => {
            return checkIfNotEmpty(result);
        }).
        then((msg) => {
            let new_user = {
                uname: uname,
                password: pwd,
                email: '',
                createdAt: new Date(),
                verified: 0
            };
            return dbInsert(Users, new_user);
        }).
        then((result) => {
            let res_obj = {
                err_no: 0,
                err_msg: 'OK',
                data: result
            };
            res.status(200).send(JSON.stringify(res_obj));
        }).
        catch((err) => {
            let res_obj = {
                err_no: 1,
                err_msg: err,
                data: null
            };
            res.status(200).send(JSON.stringify(res_obj));
        });

    } else {
        let res_obj = {
            err_no: 1,
            err_msg: 'Username or password not defined.',
            data: null
        };
        res.status(200).send(JSON.stringify(res_obj));
    }
});

router.post('/login', (req, res, next) => {
    let uname = req.body.uname;
    let pwd = req.body.pwd;
    if (uname && pwd) {
        Users = req.db.get('users');
        dbFindOne(Users, {uname:uname, password:pwd})
        .then((result) => {
            let res_obj = {
                err_no: 1,
                err_msg: '',
                data: null
            };
            if (result) {
                res_obj.err_no = 0;
                res_obj.err_msg = 'OK';
                res_obj.data = result;
                req.session.key = uname;
                req.session.user = result;
            } else {
                res_obj.err_no = 1;
                res_obj.err_msg = 'ENONE';
                res_obj.data = 'User does not exist';
            }
            res.status(200).send(JSON.stringify(res_obj));
        }).catch((err) => {
            let res_obj = {
                err_no: 1,
                err_msg: err,
                data: null
            };
            res.status(200).send(JSON.stringify(res_obj));
        })
    }
});

router.get('/user/profile/:what', (req, res, next) => {
    if (req.session.key) {
        let result = {
            err_no: 1,
            url: ''
        }
        res.status(200).send(JSON.stringify(result));
    } else {
        res.status(404).send();
    }
});

function handleProfile(req) {
    let result = {
        err_no: 1,
        url: ''
    }
    if (req.params.subj == 'pic') {
        console.log(req.files);
        result.err_no = 0;
    }
    return result;
}

router.post('/user/profile/:subj/:verb', (req, res, next) => {
    if (req.session.key) {
        if (req.params.verb == 'upload') {
            result = handleProfile(req);
            res.status(200).send(JSON.stringify(result));
        } else {
            res.status(404).send();
        }
    } else {
        res.status(404).send();
    }
});

module.exports = router;
