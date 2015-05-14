var extend = require('util')._extend;
var sync = require('synchronize')

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
    tab: TAB.OPENPROJECT,
    error: ERROR
};

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


//const ARG_PROJECT = {
//    nameproject: '' ,
//    username: '',
//    error: '',
//    messageError: ''
//};

//var _USERNAME = "username";
//var _IS_AUTH = "isauth";

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

        if (req.session.arg)
        {
            arg = req.session.arg;
            req.session.arg = null;
        }
        else
        {
            //var err = ERROR;
            //err.status = -1;
            //err.message = "messaggio di test";

            arg.username = req.session.username;
            arg.project = req.session.project;
            arg.page = PAGE.PROJECT;
            arg.tab = TAB.NEWPROJECT;               //TODO mettere open project
            //arg.error = err;
        }

        res.render('../views/pages/index.ejs', arg );

    });

    app.post('/newproject', function (req, res) {

        if(app.uploaddonedone == false) return;

        console.log("PAGE /newproject");

        response = res;
        request = req;

        var dataProject = {
            projectName : req.body.projectName,
            userProject : req.session.username
        };

        dataProject.userProject = 'oim';   //TODO togliere questo

        createProject(dataProject);


        ////var cmbType =   req.body.inputType;
        //////var files =     req.body.files;
        ////var sess =      req.session;
        ////var userProject = sess.username;
        ////
        ////userProject = 'oim';                        //TODO DEBUG
        ////req.body.userProject = userProject;
        //
        //
        //Project = require("../model/Project");
        //
        //var newProject = new Project(req.body);
        //
        //Project.save( newProject,
        //    function(result, message)
        //    {
        //        var arg = { error:false , message: '' };
        //
        //        //qui sai se il progetto è stato salvato o meno
        //        if ( result < 0 )
        //            res.redirect('/project', {}); //aggiungere qui il messaggio di errore mandare come tab -> create
        //        else
        //        {
        //            error = saveDataInProject(saveDataInProject_end);
        //            //res.end();
        //        }
        //    }
        //);
        //
        //res.write(projectName+"\n"+files+"\n"+cmbType+"\n"+userProject);

    });

    var newProject = null;

    function createProject(dataProject)
    {
        console.log("CALL createProject");

        var Project = require("../model/Project");
        newProject = new Project(dataProject);

        Project.getProject( dataProject.projectName, getProjectEnd );

    }

    function getProjectEnd(doc) {

        console.log("CALL getProjectEnd");

        var Project = require("../model/Project");

        if ( doc == null ) {

            var connection = require('mongoose').createConnection('mongodb://localhost/oim');

            var Model = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);
            var modelProject = new Model(newProject.data);

            modelProject.save( function (err) {

                var arg = extend({}, ARG_INDEX);
                var resultError = extend({}, ERROR);

                if (err)
                {
                    resultError.message(err);
                    resultError.status = -2;

                    arg.page = PAGE.PROJECT;
                    arg.tab = TAB.NEWPROJECT;
                    arg.error = resultError;

                    request.session.arg = arg;

                    response.redirect("/project" );

                }
                else
                {

                }

                connection.close();
            });

        }
        else
        {
            //restituisco errore
            var err = extend({}, ERROR);
            err.message = "Project already exists";
            err.status = -1;

            var arg = extend({}, ARG_INDEX);
            arg.error = err;
            arg.tab = TAB.NEWPROJECT;
            arg.page = PAGE.PROJECT;

            request.session.arg = arg;

            response.redirect("/project");
        }


    }

    function projectSaveEnd(err) {

        if (err)
            callback(-1, err ); //error
            callback(0, "" );       //OK

            connection.close();

    }

    //function saveDataInProject_end()
    //{
    //    if (!error)
    //        res.redirect('/project', {}); //mandare come parametro il tab da aprire -> open
    //    else
    //        res.redirect('/project', {}); //mandare come parametro il tab da aprire -> create + error
    //}
    //
    //function saveDataInProject(callback_saveDataInProject_end)
    //{
    //
    //
    //    var fs = require('fs');
    //    var path = req.files.input.path;
    //
    //    //fs.readFile(path, function (err, data) {
    //    //    if (err) {
    //    //         res.end(err);
    //    //    }
    //    //    res.end(data);
    //    //
    //    //});
    //    //
    //    //var csv = require('csv');
    //    //csv.parse(csvData, function(err, data){
    //    //    csv.transform(data, function(data){
    //    //        return data.map(function(value){return value.toUpperCase()});
    //    //    }, function(err, data){
    //    //        csv.stringify(data, function(err, data){
    //    //            //res.end(data);
    //    //        });
    //    //    });
    //    //});
    //
    //    //Converter Class
    //    var Converter = require("csvtojson").core.Converter;
    //    var csvConverter = new Converter();
    //    var jsonObject = null;
    //
    //    csvConverter.on("end_parsed", csvConverter_end_parsed );
    //
    //    fs.createReadStream(path).pipe(csvConverter);
    //
    //
    //}
    //
    //function csvConverter_end_parsed(jsonObj)
    //{
    //    jsonObject = jsonObj;
    //    res.write(JSON.stringify(jsonObj));
    //
    //    Data = require("../model/Data");
    //
    //    req.body.data = jsonObject;
    //    var newData = new Project(jsonObject);
    //    Data.save( newData, saveCallback );
    //
    //}
    //
    //function saveCallback(result, message)
    //{
    //    var arg = { error:false , message: '' };
    //
    //    if ( result >= 0 )
    //        res.redirect('/index');
    //    else
    //    {
    //        arg.message = message;
    //        arg.error = true;
    //        res.render('../views/pages/index.ejs', arg);
    //
    //    }
    //}

    //app.get('/newproject', function (req, res)
    //    {
    //        res.end("ciao get");
    //    }
    //);

};
