var extend = require('util')._extend;

const PAGE = {
    HOME: "home",
    PROJECT: "project",
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
    status: 0,
    message: ''
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

const ARG_STAT = {
    content: ''
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

    app.get('/login', function (req, res) {
        var message = { error:false, message: '' };
        res.render('../views/pages/login.ejs', message);
    });

    app.post('/login', function (req, res) {

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
        var userProject = sess.userProject;
        var projectName = sess.projectName;

        //TODO se non si dispone del project, redirect alla pagina dei progetti

        arg.userProject = userProject;
        arg.projectName = projectName;
        arg.page = PAGE.HOME;

        res.render('../views/pages/index.ejs', arg);
    });

    /* INDEX - PAGES */

    app.get('/home', function (req, res) {

        var arg = getArgIndex();
        var sess = req.session;
        arg.userProject = req.session.userProject;
        arg.projectName = req.session.projectName;
        arg.page = PAGE.HOME;

        res.render('../views/pages/index.ejs', arg );

    });

    app.get('/project', function (req, res) {

        //controllo se ho un errore
        var arg = getArgIndex();
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

            arg.userProject = req.session.userProject;
            arg.projectName = req.session.projectName;
            arg.page = PAGE.PROJECT;
            arg.tab = TAB.OPENPROJECT;
            //arg.error = err;
        }

        //TODO debug
        if (!arg.userProject) arg.userProject= 'oim';

        Project.getProjects(arg.userProject, function(data, err)
        {
            var projectArg = getArgProject();
            projectArg.projects = JSON.stringify(data);
            arg.content = projectArg;

            res.render('../views/pages/index.ejs', arg );

        });

    });


    /**
     *  Crea un nuovo progetto
     */
    app.post('/newproject', function (req, res) {

        try {
            if (app.uploaddonedone == false) return;

            console.log("PAGE /newproject");

            var Project = require("../model/Project");

            //response = res;
            //request = req;

            var dataProject = {
                projectName: req.body.projectName,
                userProject: req.session.userProject
            };

            dataProject.userProject = 'oim';   //TODO togliere questo

            // Cerco prima se il progetto esiste
            Project.getProject(dataProject.projectName,
                function (doc) {
                    // restituisco errore se esiste
                    if (doc == null) {
                        //Creo un nuovo progetto
                        Project.addProject(dataProject,

                            function (err) {
                                if (err == null) {
                                    var type = req.body.cmbType;
                                    var fileNames = app.fileNames;
                                    app.fileNames = [];
                                    var Data = require("../model/Data");

                                    Data.importFromFile(type, fileNames, dataProject.projectName,

                                        function (err)

                                        {

                                            if (err.status > 0) {
                                                console.log("CALL: importFromFile ERROR");

                                                sendProjectError(req, res, err.message, err.status);
                                                return;
                                            }
                                            else {
                                                console.log("CALL: importFromFile OK");

                                                try {
                                                    var arg = getArgIndex();

                                                    req.session.projectName = dataProject.projectName;
                                                    arg.userProject = req.session.userProject;
                                                    arg.projectName = req.session.projectName;
                                                    arg.page = PAGE.PROJECT;
                                                    arg.tab = TAB.OPENPROJECT;
                                                    req.session.arg = arg;

                                                    res.redirect('/project');

                                                }
                                                catch (e) {
                                                    console.log("ERR: importFromFile!!!!!");
                                                    console.log(e);

                                                    res.redirect('/project');
                                                }

                                            }
                                        });
                                } else {
                                    console.log("Internal error: " + err);
                                    sendProjectError(req, res, err.message, err.status);
                                    return;
                                }
                            }
                        );
                    } else {
                        sendProjectError(req, res, "Project already exists", 1);
                    }
                }
            );
        } catch (e) {
            console.log("ERROR!!!! newprojecterror");
            console.log(e);
        }
    });

    app.post('/setproject', function (req, res) {

        req.session.projectName = req.body.projectName;

        //var projectArg = getArgProject();
        var arg = getArgIndex();

        //projectArg.projects = req.session.projects;

        arg.userProject = req.session.userProject;
        arg.projectName = req.session.projectName;
        arg.page = PAGE.HOME;
        //arg.tab = TAB.OPENPROJECT;
        //arg.content = projectArg;

        //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

        //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        //res.redirect('/project');

        res.setHeader("Content-Type", "text/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify({status: 200}));

    });


    /***
     *      STATISTICS
     */
    app.get('/showmap', function (req, res)
    {
        var statController = require("../controller/StatController");
        var arg = getArgIndex(req, PAGE.STAT_MAP);
        var argStat = getArgStat();
        argStat.content = statController.getMapData();
        arg.content = argStat;

        res.render('../views/pages/index.ejs', arg );
    });

    app.get('/showregionsbar', function (req, res)
    {
        var arg = getArgIndex(req, PAGE.STAT_REGIONS_BAR);
        res.render('../views/pages/index.ejs', arg );
    });

    app.get('/showregionsradar', function (req, res)
    {
        var arg = getArgIndex(req, PAGE.STAT_REGIONS_RADAR);
        res.render('../views/pages/index.ejs', arg );
    });

    app.get('/showtimeline', function (req, res)
    {
        var arg = getArgIndex(req,PAGE.STAT_TIMELINE);
        res.render('../views/pages/index.ejs', arg );
    });

    app.get('/showtag', function (req, res)
    {
        var arg = getArgIndex(req, PAGE.STAT_TAG);
        res.render('../views/pages/index.ejs', arg );
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


    /**
     *  Crea una copia della variabile ARG_INDEX
     */
    function getArgIndex(req, page)
    {
        var arg = extend({}, ARG_INDEX);

        if ( req != null)
        {
            arg.userProject = req.session.userProject;
            arg.projectName = req.session.projectName;
        }

        if ( page != null)
        {
            arg.page = page;
        }

        return arg;
    }

    function getArgProject()
    {
        return extend({}, ARG_PROJECT);
    }

    function getArgStat()
    {
        return extend({}, ARG_STAT);
    }

};
