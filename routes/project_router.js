"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Summary = require("../model/Summary");
var async = require('async');
var requestJson = require('request-json');
//var urlencode = require('urlencode');
var fs = require("fs");

module.exports = function (router, app) {

    router.post('/newproject', function (req, res, next)
    {
        console.log("PAGE: /newproject");

        var dataProject = {
            project: req.body.project,
            username: req.session.user,
            description: req.body.description
        };

        var Project = require("../model/Project");
        Project.getProject(dataProject.project, function(data){

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

    });

    router.post('/newproject', function (req, res, next)
    {

        var dataProject = {
            project: req.body.project,
            username: req.session.user,
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
                req.session.project = dataProject.project;
                arg.error = null;
                res.redirect("/home");
            }

        });
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

    router.post('/delproject', function (req, res)
    {

        var project = req.body.project;
        Project.delProject(project, function(err, ris)
        {
            res.json( ris );
        });

    });

    router.post('/setproject', function (req, res)
    {
        req.session.project = req.body.project;

        res.setHeader("Content-Type", "text/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end( JSON.stringify({status: 200}) );

    });

    router.get('/projects', function (req, res)
    {
        Project.getProjects(function(err, data){
            res.json(data);
        })
    });

    router.get('/getproject', function (req, res)
    {
        var project = req.query.pn;

        if(project==null)
            res.json({});
        else
        {
            var Project = require("../model/Project");
            Project.getProject(project, function(data){
                res.json(data);
            });
        }
    });

    router.get('/uploaddata', function (req, res)
    {
        res.redirect("/project/editproject");
    });

    router.post('/uploaddata', function (req, res)
    {
        if( !app.isUploadDone() )
        {
            console.log("UPLOADING....");
            return;
        }

        var files = app.getUploadedFiles();
        var username = req.session.user;
        var project = req.session.project;
        var type = req.body.type;
        var ris = {}

        async.each(files, function(f, next){

            var projectData = {
                filePath : f.path,
                username: username,
                project: project,
                type: type,
                serverUrl: req.headers.host
            };

            var Project = require("../model/Project");

            Project.addData(projectData, false, function(err, result)
            {
                ris[f.originalname] = result;
                fs.unlinkSync(f.path);
                next(err);
            });

        }, function(err){

            var url = req.headers.host;
            Project.synchronize(url, project, function(err){
                res.json(ris);
            });

        });

    });

    router.get('/synchronize', function (req, res)
    {
        var project =   req.session.project || req.query.project;
        var username =  req.session.user;

        console.log("CALL: /synchronize of %s", project);

        if( !project || !username )
            res.json({});
        else
            Summary.sync(project, username,  function(err, result){
                res.json(result);
            });
    });

    router.get('/stat', function (req, res)
    {
        if(req.session.project)
            Summary.getStat( req.session.user, req.session.project, function(err, data)
            {
                res.json(data);
            });
        else
            res.redirect("/view/project/openproject");
    });

};


//app.get('/project', function (req, res)
//{
//    //TODO debug
//    if ( req.session.user == null)
//        req.session.user = 'oim';
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
//        arg.user = req.session.user;
//        arg.project = req.session.project;
//        arg.page = ConstantsRouter.PAGE.PROJECT;
//        arg.tab =  ConstantsRouter.TAB.OPENPROJECT;
//    }
//
//    Project.getProjects(arg.user, function(data, err)
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
//        project: req.body.project,
//        username: req.session.user,
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
//            //var URLproject = urlencode(req.body.project);
//            //res.redirect("/openproject");
//            //sincronizazzioneBatch(urlencode(URLproject));
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
//    //            var URLproject = urlencode(req.body.project);
//    //            res.redirect("/openproject");
//    //            sincronizazzioneBatch(urlencode(URLproject));
//    //        }
//    //    }
//    //);
//} catch (e)
//{
//    console.error("EXCEPTION newproject");
//    console.error(e);
//    console.error(e.stack);
//}
