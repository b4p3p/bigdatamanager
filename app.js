var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('client-sessions'),
    multer  = require('multer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(bodyParser.json() );        // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use(cookieParser());

/**
 *  Utilizzo dei cookie per le sessioni dell'utente
 */

app.use( session( {
    cookieName: 'session',
    secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
    duration: 30 * 60 * 1000,
    activeDuration: 30 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));

//DEBUG
app.use(express.static(__dirname));

/**********
 * UPLOAD
 **********/

app.use(express.static(path.join(__dirname, 'public')));

app.contFile = 0;
app.fileNames = [];

app.isUploadDone = function()
{
    return app.fileNames.length == app.contFile;
};

app.resetVariableUpload = function()
{
    app.contFile = 0;
    app.fileNames = [];
};

app.getUploadedFiles = function()
{
    var ris = this.fileNames;
    this.resetVariableUpload();
    return ris;
};

var upload = multer( {
    dest: 'uploads/'
} );
app.up_nations = upload.array("nations");
app.up_datas = upload.array("datas");


/**************
 * END UPLOAD
 **************/


/*******************************
 ******   ROUTER ***************
 *******************************/

var router_vocabulary = express.Router();
var router_project = express.Router();
var router_view = express.Router();
var router_regions = express.Router();
var router_users = express.Router();
var router_datas = express.Router();

app.use('/vocabulary', router_vocabulary);
app.use('/project', router_project);
app.use('/view', router_view);
app.use('/regions', router_regions);
app.use('/users', router_users);
app.use('/datas', router_datas);

require('./routes/router')(app);
require('./routes/database_router')(app);
require('./routes/statistics_router')(app);

require('./routes/regions_router')(router_regions, app, upload);
require("./routes/vocabulary")(router_vocabulary);
require('./routes/project_router')(router_project, app);
require('./routes/view_router')(router_view);
require('./routes/users_router')(router_users);
require('./routes/datas_router')(router_datas, app);

/********************************
 *** END ROUTER
 ********************************/

// catch 404 and forward to error handler
app.use(function(req, res, next) {

    //res.redirect("/login");

    var err = new Error('Not Found: ' + req.method + ":" + req.originalUrl );
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);

      res.render('pages/error.ejs', {
      message: err.message,
      error: err.stack
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use( function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('pages/error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;