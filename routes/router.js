var extend = require('util')._extend;

const PAGE = {
    HOME: "home",
    PROJECT: "project",
    STAT: "statistics"
};

const TAB = {
    NEWPROJECT: "newproject",
    OPENPROJECT: "openproject"
};

const ERROR = {
    status: 0,
    message: ''
};

const ARG_INDEX = {
    username: '' ,
    project: '',
    page: '',
    tab: '',
    error: ERROR,
    content: null
};

const ARG_PROJECT = {
    projects: ''
};

//var _USERNAME = "username";
//var _IS_AUTH = "isauth";

function setArgIndex(username, project, page, error)
{
    var arg = extend({}, ARG_INDEX);
    arg.username = username;
    arg.project = project;
    arg.page = page;
    arg.error = error;

    if (page == null) arg.page = PAGE.HOME;
    if (error == null) arg.error = extend({}, ERROR);

    return arg;
}

module.exports = function (app) {

    var request;
    var response;

    app.get('/', function (req, res) {
        res.redirect('/login');
    });

    /* LOGIN */

    app.get('/login', function (req, res) {
        var message = { error:false, message: '' };
        res.render('../views/pages/login.ejs', message);
    });

    app.post('/login', function (req, res) {

        var username = req.body.username;
        var password = req.body.password;
        var message = { error:false, message: '' };

        request = req;

        if ( username == "" || password == "" ) {
            message.error = true;
            message.message = "Username or password missing";
            res.render('../views/pages/login.ejs', message);
            return;
        }

        User = require('../model/User');

        User.getUserPsw(username, password, function(data)
        {
            message.error = true;
            message.message = "User not found";

            if ( data == null )
            {
                res.render('../views/pages/login.ejs', message );
            }
            else
            {
                var sess = request.session;
                sess.username = username;
                res.redirect('/index');
            }

        });

    });

    /* REGISTER */

    app.get('/register', function (req, res) {
        var message = { error:false , message: '' };
        res.render('../views/pages/register.ejs', message);
    });

    app.post('/register', function (req, res) {

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

    app.get('/index', function (req, res) {

        var arg = extend({}, ARG_INDEX);

        var sess = req.session;
        var username = sess.username;
        var project = sess.project;

        //TODO se non si dispone del project, redirect alla pagina dei progetti

        arg.username = username;
        arg.project = project;
        arg.page = PAGE.HOME;

        res.render('../views/pages/index.ejs', arg);
    });

    /* INDEX - PAGES */

    app.get('/home', function (req, res) {

        var sess = req.session;
        var arg = extend({}, ARG_INDEX);
        arg.username = sess.username;
        arg.project = sess.project;
        arg.page = PAGE.HOME;

        res.render('../views/pages/index.ejs', arg );

    });

    app.get('/project', function (req, res) {

        //controllo se ho un errore
        var arg = extend({}, ARG_INDEX);
        var Project = require("../model/Project");

        if (req.session.arg)                    // uso  i paramenti presenti nella variabile di sessione
        {
            arg = req.session.arg;
            req.session.arg = null;
        }
        else                                    // mi costruisco la variabile usando le variabili di sessione
        {
            //var err = ERROR;
            //err.status = -1;
            //err.message = "messaggio di test";

            arg.username = req.session.username;
            arg.project = req.session.project;
            arg.page = PAGE.PROJECT;
            arg.tab = TAB.OPENPROJECT;
            //arg.error = err;
        }

        //TODO debug
        if (!arg.username) arg.username = 'oim';

        Project.getProjects(arg.username, function(data, err)
        {
            var projectArg = getArgProject();
            projectArg.projects = JSON.stringify(data);
            arg.content = projectArg;
            res.render('../views/pages/index.ejs', arg );
        });

    });

    app.post('/newproject', function (req, res) {

        /*** Creo un nuovo progetto ***/

        if(app.uploaddonedone == false) return;

        console.log("PAGE /newproject");

        var Project = require("../model/Project");

        response = res;
        request = req;

        var dataProject = {
            projectName : req.body.projectName,
            userProject : req.session.username
        };

        dataProject.userProject = 'oim';   //TODO togliere questo

        // Cerco prima se il progetto esiste
        Project.getProject( dataProject.projectName,
            function(doc)
            {
                // restituisco errore se esiste
                if ( doc == null )  {
                    //Creo un nuovo progetto
                    Project.addProject(dataProject,
                        function (err){
                            if ( err == null) {
                                var type = req.body.inputType;
                                var fileNames = app.fileNames;
                                var Data = require("../model/Data");

                                Data.importFromFile(type, fileNames, function(err) {

                                    if (err.status)
                                    {
                                        sendProjectError(req, res, err.message, err.status);
                                    }
                                    else
                                    {
                                        var arg = getArgIndex();
                                        arg.username = req.session.username;
                                        arg.project = req.session.project;
                                        arg.page = PAGE.PROJECT;
                                        arg.tab = TAB.OPENPROJECT;
                                        req.session.arg = arg;
                                        res.redirect('/project');
                                    }

                                });
                            } else {
                                console.log("Internal error: " + err);
                                sendProjectError(req, res, err.message, err.status);
                            }
                        }
                    );
                } else  {
                    sendProjectError(req, res, "Project already exists", 1);
                }
            }
        );
    });

    function sendProjectError(request, response, message, status)
    {
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

    function getArgIndex()
    {
        return extend({}, ARG_INDEX);
    }

    function getArgProject()
    {
        return extend({}, ARG_PROJECT);
    }

};
