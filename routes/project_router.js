"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

function argContentProjects(data)
{

    if (!data) data = {};

    return {
        projects: JSON.stringify(data)
    }
};

function projectError (status, message)
{
    if(!status) status = 1;
    if(!message) message = 'error';

    return{
        status: status,
        message: message
    }
};

function sendProjectError(request, response, message, status)
{
    console.log("CALL: sendProjectError");

    var err = projectError(status, message);
    var arg = ConstantsRouter.argIndex();

    arg.error = err;

    arg.page = ConstantsRouter.PAGE.NEW_PROJECT;
    arg.error = err;

    request.session.arg = arg;
    response.redirect("/project");
}

/**
 *  Richiesta di sincronizzazione in batch
 */
function sincronizazzioneBatch(projectName)
{
    var client = requestJson.createClient('http://localhost:8080');
    client.get('synchronize?projectName=' + projectName, function(err, res, body) {

        console.log( "Sincronizzazione effettuata:" + body.message);
    });
}

module.exports = function (router) {

    //app.get('/project', function (req, res)
    //{
    //    //TODO debug
    //    if ( req.session.userProject == null)
    //        req.session.userProject = 'oim';
    //
    //    //controllo se ho un errore
    //    var arg = ConstantsRouter.argIndex();
    //    var Project = require("../model/Project");
    //
    //    if (req.session.arg)                    // uso  i paramenti presenti nella variabile di sessione
    //    {
    //        arg = req.session.arg;
    //        req.session.arg = null;
    //    }
    //    else                                    // mi costruisco la variabile usando le variabili di sessione
    //    {
    //        arg.userProject = req.session.userProject;
    //        arg.projectName = req.session.projectName;
    //        arg.page = ConstantsRouter.PAGE.PROJECT;
    //        arg.tab =  ConstantsRouter.TAB.OPENPROJECT;
    //    }
    //
    //    Project.getProjects(arg.userProject, function(data, err)
    //    {
    //        if(err) {
    //
    //        }
    //
    //        arg.content = argContentProjects( data );
    //        res.render('../views/pages/index.ejs', arg );
    //
    //    });
    //
    //});

    router.get('/newproject', function (req, res)
    {
        var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.NEW_PROJECT);
        res.render('../views/pages/index.ejs', arg );
    });

    router.post('/newproject', function (req, res, next)
    {

        console.log("PAGE: /newproject");

        var dataProject = {
            projectName: req.body.projectName,
            userProject: req.session.userProject,
            description: req.body.description
        };

        var Project = require("../model/Project");
        Project.getProject(dataProject.projectName, function(data){

            if(data == null)
                next(null);
            else
            {
                var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.NEW_PROJECT );
                arg.error = {
                    status:1,
                    message: "Project already exists"
                };
                res.render('../views/pages/index.ejs', arg );
            }
        });

        //try {
        //
        //    // Controlla che tutti i file siano stati upload-ati
        //
        //    //if (app.isUploadDone() == false) return;
        //
        //    // reset variable upload
        //    //var fileNames = app.fileNames;
        //    //app.resetVariableUpload();
        //
        //    var dataProject = {
        //        projectName: req.body.projectName,
        //        userProject: req.session.userProject,
        //        description: req.body.description
        //    };
        //
        //    var Project = require("../model/Project");
        //    Project.addProject(dataProject, function(err){
        //
        //        if (err) {
        //            sendProjectError(req, res, err.message, err.status);
        //        }
        //        else
        //        {
        //
        //            next();
        //
        //            //var URLProjectName = urlencode(req.body.projectName);
        //            //res.redirect("/openproject");
        //            //sincronizazzioneBatch(urlencode(URLProjectName));
        //
        //        }
        //    });
        //
        //    //addNewProjectWithData(fileNames, dataProject,
        //    //    function (err) {
        //    //        if (err) {
        //    //            sendProjectError(req, res, err.message, err.status);
        //    //        }
        //    //        else {
        //    //            res.redirect("/openproject");
        //    //
        //    //            var URLProjectName = urlencode(req.body.projectName);
        //    //            res.redirect("/openproject");
        //    //            sincronizazzioneBatch(urlencode(URLProjectName));
        //    //        }
        //    //    }
        //    //);
        //} catch (e)
        //{
        //    console.error("EXCEPTION newproject");
        //    console.error(e);
        //    console.error(e.stack);
        //}
    });

    router.post('/newproject', function (req, res, next)
    {

        var dataProject = {
            projectName: req.body.projectName,
            userProject: req.session.userProject,
            description: req.body.description
        };

        var Project = require("../model/Project");
        Project.addProject(dataProject, function(err){

            var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.NEW_PROJECT );

            if (err != null)
            {
                arg.error = {
                    status:1,
                    message: err.toString()
                };
                res.render('../views/pages/index.ejs', arg );
            }
            else
            {
                req.session.projectName = dataProject.projectName;
                arg.error = null;
                res.redirect("/home");
            }

        });
    });

    router.get('/editproject', function (req, res)
    {
        var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.EDIT_PROJECT);

        if ( req.session.projectName != null)
            arg.projectName = req.session.projectName;
        else
            arg.projectName = null;

        res.render('../views/pages/index.ejs', arg );
    });

    router.post('/editproject', function (req, res)
    {

        console.log("CALL: POST editprojects");

        var Project = require('../model/Project');

        Project.editProject(req.body, function(err, numAffect){

            var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.EDIT_PROJECT);
            arg.error = err;
            res.render('../views/pages/index.ejs', arg );

        });

    });

    router.get('/openproject', function (req, res)
    {
        //TODO debug
        if ( req.session.userProject == null)
            req.session.userProject = 'oim';

        //controllo se ho un errore
        var arg = ConstantsRouter.argIndex();
        var Project = require("../model/Project");

        if (req.session.arg)                    // uso  i paramenti presenti nella variabile di sessione
        {
            arg = req.session.arg;
            req.session.arg = null;
        }
        else                                    // mi costruisco la variabile usando le variabili di sessione
        {
            arg.userProject = req.session.userProject;
            arg.projectName = req.session.projectName;
            arg.page = ConstantsRouter.PAGE.OPEN_PROJECT;
        }

        Project.getProjects(arg.userProject, function(data, err)
        {
            if(err) {

            }

            arg.content = argContentProjects( data );
            res.render('../views/pages/index.ejs', arg );

        });

    });

    router.post('/delproject', function (req, res) {

        var projectName = req.body.projectName;
        Project.delProject(projectName, function(err, ris)
        {
            res.json( ris );
        });

    });

    /**
     *  Method: POST
     *  @param  POST: req.body.projectName - username da settare
     *  @return {{}}
     */
    router.post('/setproject', function (req, res)
    {
        req.session.projectName = req.body.projectName;

        var arg = ConstantsRouter.argIndex();

        arg.userProject =   req.session.userProject;
        arg.projectName =   req.session.projectName;
        arg.page =          ConstantsRouter.PAGE.HOME;

        res.setHeader("Content-Type", "text/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end( JSON.stringify({status: 200}) );

    });

    router.get('/getproject', function (req, res)
    {
        var projectName = req.query.pn;

        if(projectName==null)
            res.json({});
        else
        {
            var Project = require("../model/Project");
            Project.getProject(projectName, function(data){
                res.json(data);
            });
        }
    });

    router.post('/uploaddata', function (req, res)
    {

        console.log("CALL: uploaddata");
        console.log(JSON.stringify(req.body.files));
        res.json({});

    });


};

