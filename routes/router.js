var extend = require('util')._extend;

const PAGE = {
    HOME: "home",
    PROJECT: "project",
    DATABASE: "database",
    STAT_MAP: "stat-map",
    STAT_REGIONS_BAR: "stat-regions-bar",
    STAT_REGIONS_RADAR: "stat-regions-radar",
    STAT_TIMELINE: "stat-timeline",
    STAT_TAG: "stat-tag"
};

const TAB = {
    NEWPROJECT: "newproject",
    OPENPROJECT: "openproject"
};

const ERROR = {
    status: null,
    message: ''
};

var Error = function (status, message) {
    if (!status) status = 1;
    if (!message) message = 'error';
    return {
        status: status,
        message: message
    }
};

const ARG_INDEX = {
    userProject: '' ,
    projectName: '',
    page: '',
    tab: '',
    error: ERROR,
    content: null       //usata per passare il contenuto alla pagina partials (es: ARG_PROJECTS )
};

const ARG_PROJECT = {
    projects: ''
};

function setArgIndex(userProject, projectName, page, error)
{
    var arg = extend({}, ARG_INDEX);
    arg.userProject = userProject;
    arg.projectName = projectName;
    arg.page = page;
    arg.error = error;

    if (page == null) arg.page = PAGE.HOME;
    if (error == null) arg.error = extend({}, ERROR);

    return arg;
}

module.exports = function (app) {

    //var request;
    //var response;

    app.get('/', function (req, res) {
        res.redirect('/login');
    });

    /* LOGIN */

    app.get('/login', function (req, res)
    {
        var message = { error:false, message: '' };
        res.render('../views/pages/login.ejs', message);
    });

    app.post('/login', function (req, res)
    {
        var userProject = req.body.userProject;
        var password = req.body.password;
        var message = { error:false, message: '' };

        request = req;

        if ( userProject == "" || password == "" ) {
            message.error = true;
            message.message = "Username or password missing";
            res.render('../views/pages/login.ejs', message);
            return;
        }

        User = require('../model/User');

        User.getUserPsw(userProject, password, function(data)
        {
            message.error = true;
            message.message = "User not found";

            if ( data == null )
            {
                res.render('../views/pages/login.ejs', message );
            }
            else
            {
                req.session.userProject = userProject;
                res.redirect('/index');
            }

        });

    });

    /* REGISTER */

    app.get('/register', function (req, res)
    {
        var message = { error:false , message: '' };
        res.render('../views/pages/register.ejs', message);
    });

    app.post('/register', function (req, res)
    {

        //var username = req.body.username;
        //var password = req.body.password;
        //var name = req.body.name;
        //var lastname = req.body.lastname;

        User = require("../model/User");

        var newUser = new User(req.body);
        User.save( newUser,
            function(result, message)
            {
                var arg = { error:false, message: '' };

                if ( result >= 0 )
                    res.redirect('/login');
                else
                {
                    arg.message = message;
                    arg.error = true;
                    res.render('../views/pages/register.ejs', arg);
                }
            }
        );
    });

    /* INDEX */

    app.get('/index', function (req, res)
    {

        var arg = extend({}, ARG_INDEX);

        var sess = req.session;
        var userProject = sess.userProject;
        var projectName = sess.projectName;

        //TODO se non si dispone del project, redirect alla pagina dei progetti

        arg.userProject = userProject;
        arg.projectName = projectName;
        arg.page = PAGE.HOME;

        res.render('../views/pages/index.ejs', arg);
    });

    /* INDEX - PAGES */

    app.get('/home', function (req, res)
    {

        var arg = getArgIndex();
        var sess = req.session;
        arg.userProject = req.session.userProject;
        arg.projectName = req.session.projectName;
        arg.page = PAGE.HOME;

        res.render('../views/pages/index.ejs', arg );

    });

    /* DATABASE - PAGES */

    app.get('/database', function (req, res)
    {

        var arg = getArgIndex();

        if (req.session.arg)                    // uso  i paramenti presenti nella variabile di sessione
        {
            arg = req.session.arg;
            req.session.arg = null;
        }
        else                                    // mi costruisco la variabile usando le variabili di sessione
        {
            arg = getArgIndex();
            var sess = req.session;
            arg.userProject = req.session.userProject;
            arg.projectName = req.session.projectName;
            arg.page = PAGE.DATABASE;
        }
        res.render('../views/pages/index.ejs', arg );

    });

    app.post('/database', function (req, res)
    {
        // Controlla che tutti i file siano stati upload-ati
        if (app.isUploadDone() == false) return;

        // reset variable upload
        var fileNames = app.fileNames;
        app.resetVariableUpload();

        Nation = require('../model/Nation');

        Nation.importFromFile(fileNames,
            function (err)
            {
                if ( err == null )
                    sendDatabaseError(req, res, "Loading successfully performed", 0);
                else
                    sendDatabaseError(req, res, err.message, err.status);
            }
        );
    });

    function sendProjectError(request, response, message, status)
    {
        console.log("CALL: sendProjectError");

        //restituisco errore
        var err = extend({}, ERROR);
        err.message = message;
        err.status = status;

        var arg = extend({}, ARG_INDEX);
        arg.error = err;
        arg.tab = TAB.NEWPROJECT;
        arg.page = PAGE.PROJECT;

        request.session.arg = arg;
        response.redirect("/project");
    }

    function sendDatabaseError(request, response, message, status)
    {
        console.log("CALL: sendDatabaseError");
        //restituisco errore
        var err = extend({}, ERROR);
        err.message = message;
        err.status = status;

        var arg = extend({}, ARG_INDEX);
        arg.error = err;
        arg.page = PAGE.DATABASE;

        request.session.arg = arg;
        response.redirect("/database");
    }

    function getError(status, msg)
    {
        var err = extend({}, ERROR);
    }

    function getArgProject()
    {
        return extend({}, ARG_PROJECT);
    }

};
