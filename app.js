var express = require('express');
var session = require('express-session');
var mongo = require('mongodb');
var monk = require('monk');
var MongoStore = require('connect-mongodb-session')(session);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('express-busboy');
var config = require('./config');
var db = monk(config.mongo.host+':'+config.mongo.port+'/'+config.mongo.db);

var index = require('./routes/index');
var api = require('./routes/api');

var nunjucks = require('nunjucks');
var moment = require('moment');
var sendMail = require('sendmail')()

var app = express();
bodyParser.extend(app, {
    upload: true,
    mimeTypeLimit: ['image/jpeg','image/png','image/gif']
});

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
// app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: config.session.secret,
    store: new MongoStore({
        uri: 'mongodb://'+config.session.store.host+':'+config.session.store.port+'/'+config.session.store.db ,
        collection: config.session.store.collection
    }),
    saveUninitialized: false,
    resave: false
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    req.db=db;
	next();
});

app.use((req, res, next) => {
    try {
        console.log(req.session.key);
    } catch(e) {
        console.log(e);
    }
    next();
});

app.use('/', index);
app.use('/api', api);

// send mail
function sendmail(mailOptions) {
    sendMail(mailOptions, (err, reply) => {
        if (err) {
            console.log(err && err.stack);
        }
        console.log(reply);
    });
}

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
  console.log(err.stack);
  res.status(err.status || 500).send();
//  res.render('error');
});

module.exports = app;
