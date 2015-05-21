var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var multer  = require('multer');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(cookieParser());

app.use(session({secret: 'kjhkjsdhjdljaslkjwi___4587'}));

//DEBUG
app.use(express.static(__dirname));
//app.use(express.static(path.join(__dirname, 'public')));

app.uploaddone = false;
app.fileNames = [];

app.use(multer({ dest: './uploads/',
    rename: function (fieldname, filename)
    {
        console.log('CALL: app.rename');
        return filename+Date.now();
    },
    onFileUploadStart: function (file) {
        console.log('CALL: app.onFileUploadStart (' + file.originalname + ')');
    },
    onFileUploadComplete: function (file) {
        console.log('CALL: app.onFileUploadComplete (' + file.path + ')');
        app.fileNames.push(file.path);
        app.uploaddone = true;
    }
}));

require('./routes/router')(app);   //chiamo il router

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err =
        new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

//// development error handler
//// will print stacktrace
//if (app.get('env') === 'development') {
//  app.use(function(err, req, res, next) {
//    res.status(err.status || 500);
//    res.render('pages/error.ejs', {
//      message: err.message,
//      error: err
//    });
//  });
//}
//
//// production error handler
//// no stacktraces leaked to user
//app.use( function(err, req, res, next) {
//  res.status(err.status || 500);
//  res.render('pages/error', {
//    message: err.message,
//    error: {}
//  });
//});



module.exports = app;
