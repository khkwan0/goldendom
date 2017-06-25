var express = require('express');
var router = express.Router();
var config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
    if (typeof req.session.key !== 'undefined') {
        res.render('feed', { title: config.site.title, username: req.session.user.uname });
    } else {
        res.render('login', { title: config.site.title });
    }
});

router.get('/register', (req, res, next) => {
    res.render('register', { title: config.site.title });
});

router.get('/register2', (req, res, next) => {
    res.render('register2', { title: config.site.title });
});

router.get('/login', (req, res, next) => {
    res.render('login', {title: config.site.title });
});

router.get('/post', (req, res, next) => {
    res.render('post', {title: config.site.title });
});

router.get('/logout', (req, res, next) => {
    res.render('logout', { title: config.site.title });
});

module.exports = router;
