var express = require('express');
var router = express.Router();
var config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: config.site.title });
});

router.get('/auth/facebook', (req, res, next)=> {
    let passport = req.passport;
    passport.authenticate('facebook', {scope: 'email'});
});

router.get('/auth/facebook/callback', (req, res, next) => {
    let passport = req.passport;
    passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login'
    });
});

router.post('/auth/local', (req, res, next) => {
    let passport = req.passport;
    passport.authenticate('local-login', {
        successRedirect: '/status',
        failureRedirect: '/login',
        failureFlash: true
    });
});

module.exports = router;
