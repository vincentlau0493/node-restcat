var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth');
var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var cattery = require('./cattery');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/myblog');

var db = mongoose.connection;
db.once('open', function callback () {
    console.log('DB connected!');
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




// var auth = function (req, res, next) {
//   function unauthorized(res) {
//     res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
//     return res.send(401);
//   };
//   var user = basicAuth(req);
//   console.log(user);
//   // console.log(req.method);

//   if (!user || !user.name || !user.pass) {
//     return unauthorized(res);
//   };

//   if (user.name === 'foo' && user.pass === 'bar') {
//     return next();
//   } else {
//     return unauthorized(res);
//   };
// };
// app.use(auth);

app.use('/', routes);
app.use('/users', users);

//----------------
//Restcat
//----------------
app.use(cattery.post.register());
app.use(cattery.user.register());


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
