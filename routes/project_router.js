"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Summary = require("../model/Summary");
var async = require('async');
var requestJson = require('request-json');
var request = require('request');
var _ = require("underscore");
//var urlencode = require('urlencode');
var fs = require("fs");

module.exports = function (router, app) {

    router.get('/*', function (req, res, next)
    {
        if( !req.session.user && !req.session.isGuest )
        {
            res.redirect("/view/login");
        }
        else
            next(null);

    });

    router.all(/new*|del*|edit*|uploaddata|synchronize/, function (req, res, next)
    {
        console.log("router projects all");
        if( req.session.isGuest )
            res.redirect("/view/register");
        else
            next(null);
    });

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
        var project = req.query.project;
        var username = req.session.user || req.query.user;
        if(project==null)
            res.json({});
        else
        {
            var Project = require("../model/Project");
            Project.getProject(project, username, function(data){
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
        var ris = {};

        async.each(files, function(f, next){

            var projectData = {
                filePath : f.path,
                username: username,
                project: project,
                type: type,
                serverUrl: req.headers.host
            };

            Project.addData(projectData, false, function(err, result)
            {
                ris[f.originalname] = result;
                fs.unlinkSync(f.path);
                next(err);
            });

        }, function(err){

            var url = req.headers.origin + '/project/synchronize';
            request( url , function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    res.json(body); // Show the HTML for the Google homepage.
                }else
                    res.json({});
            })

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
            Summary.sync(project, username, function(err, result){
                res.json(result);
            });
    });

    router.get('/stat', function (req, res, next)
    {
        if ( _.keys(req.query).length > 0 )
        {
            next(null);
            return;
        }

        console.log("CALL: simple stat");

        if(req.session.project)
            Summary.getStat( req.session.project, function(err, data)
            {
                res.json(data);
            });
        else
            res.redirect("/view/project/openproject");
    });

    router.get('/stat', function (req, res)
    {
        console.log("CALL: filter stat");

        if(req.session.project)
            Summary.getStatFilter( req.session.project, req.query, function(err, data)
            {
                res.json(data);
            });
        else
            res.redirect("/view/project/openproject");
    });

    router.get('/lastupdate', function (req, res)
    {
        var project = req.session.project || req.query.project;

        if(!project)
        {
            res.redirect("/view/login");
            return;
        }

        Project.getLastUpdate( project, function(err, data){
            res.json(data);
        })
    });

};

