var express = require('express');
var session = require('express-session');
var mongo = require('mongodb');
var monk = require('monk');
var MongoStore = require('connect-mongo')(session);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport'),
        LocalStrategy = require('passport-local').Strategy,
        FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./config');
var db = monk(config.mongo.host+':'+config.mongo.port+'/'+config.mongo.db);

var index = require('./routes/index');
var nunjucks = require('nunjucks');
var moment = require('moment');
var sendMail = require('sendmail')()

var app = express();
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: config.session.secret,
    store: new MongoStore({ url: 'mongodb://'+config.session.store.host+':'+config.session.store.port+'/'+config.session.store.db }),
    saveUninitialized: false,
    resave: false
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    req.db=db;
    req.passport = passport;
	next();
});

app.use('/', index);

// send mail
function sendmail(mailOptions) {
    sendMail(mailOptions, (err, reply) => {
        if (err) {
            console.log(err && err.stack);
        }
        console.log(reply);
    });
}
passport.use(new FacebookStrategy({
            clientID: config.facebook.clientID,
            clientSecret: config.facebook.clientSecret,
            callbackURL: config.facebook.callbackURL,
            profileFields: ['id', 'photos', 'emails']
        },
        function (successToken, refreshToken, profile, done) {
            email = profile.emails[0].value;
			let collection = db.get('users');
            collection.find({email:email}, (err, user)=> {
                if (err) {
                    return done(err);
                }
                if (user) {
                    if (typeof user.profile === 'undefined') {
                        user.profile = {};
                    }
                    if (typeof user.profile.fb === 'undefined') {
                        user.profile.fb = profile;
                    }
                    user.lastlogin = new Date();
                    collection.update({email:email}, user, { upsert: true}, (err, result)=> {
                        if (err) {
                            throw(err);
                        }
                        done(null, user);
                    });
                } else { 
                    let datetime = new Date();

                    var new_user = {
                        'email': email,
                        'datetime': datetime,
                        'profile': {fb:profile},
                        'admin': 0,
                        'lastlogin': datetime,
                    }
                    mailOptions = {
                        from: config.email.from,
                        to: 'fillmein@fillmein.com',
                        subject: 'New user: '+ email,
                        html: '<div>Date: ' + new_user.datetime + '</div><br /><div><pre>' + new_user.profile + '</pre></div>'
                    }
                    sendmail(mailOptions);
                    collection.insert(new_user, (err, result) => {
                        if (err) {
                            throw(err);
                        }
                        return done(null, new_user);
                    });
                }
            });
        }
));

passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
}, (req, email, password, done) => {
	let collection = db.get('users');
	collection.find({email:email}, (err, data) => {
        if (err) {
            return done(err);
        }
        if (!data) {
            return done(null, false, req.flash('loginMessage', 'No user found'));
        } else {
            user = data;
            user.lastlogin = new Date();
            collection.update({email:email}, user, { upsert: true }, (err, result)=> {
				if (err) {
					console.log(err);
				}
			});
            if (password != user.password) {
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password'));
            }
            return done(null, user);
        }
    });
}));

passport.use('local-register', new LocalStrategy({
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true
            }, function(req, email, password, done) {
                process.nextTick(function() {
					let collection = db.get('users');
                    collection.find({email:email}, (err, user) => {
                        if (err) {
                            done(err);
                        }
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That email already exists.'));
                        } else {
							let datetime = new Date();
                            var new_user = {
                                email: email,
                                password: password,
                                datetime: datetime,
                                profile: {
                                    local: {}
                                },
                                admin: 0,
                                lastlogin: datetime
                            }
                            mailOptions = {
                                from: config.email.from,
                                to: 'fillmein@fillmein.com',
                                subject: 'New user: '+ email,
                                html: '<div>Date: ' + new_user.datetime + '</div><br /><div><pre>' + new_user.profile + '</pre></div>'
                            }
                            sendmail(mailOptions);
                            collection.insert(new_user, (err, result) => {
								if (err) {
									console.log(err);
								}	
							});
                            return done(null, new_user);
                        }
                    });
                });
            })
);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).send();
//  res.render('error');
});

module.exports = app;
