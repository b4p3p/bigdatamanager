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

    router.get('/*', function (req, res, next) {
        if (!req.session.user && !req.session.isGuest) {
            res.redirect("/view/login");
        }
        else
            next(null);

    });

    router.all(/new*|del*|edit*|uploaddata|sync/, function (req, res, next) {
        console.log("router projects all");
        if (req.session.isGuest)
            res.redirect("/view/register");
        else
            next(null);
    });

    router.get('/projects', function (req, res) {
        Project.getProjects(function (err, data) {
            res.json(data);
        })
    });

    router.post('/newproject', function (req, res, next) {
        console.log("PAGE: /newproject");

        var dataProject = {
            project: req.body.project,
            username: req.session.user,
            description: req.body.description
        };

        var Project = require("../model/Project");
        Project.getProject(dataProject.project, dataProject.username, function (data) {

            if (data == null)
                next(null);
            else {
                var error = ConstantsRouter.status( 1, "Project already exists");
                res.json(error);
            }

        });

    });

    router.post('/newproject', function (req, res, next) {

        var dataProject = {
            project: req.body.project,
            username: req.session.user,
            description: req.body.description
        };
        var Project = require("../model/Project");
        Project.addProject(dataProject, function (err) {
            if (err != null) {
                console.error(err.toString());
                res.json( ConstantsRouter.status(1, err.toString()) );
            }
            else {
                req.session.project = dataProject.project;
                var result = ConstantsRouter.status(0, "ok" );
                result.newproject = dataProject.project;
                res.json( result );
            }
        });
    });

    router.post('/editproject', function (req, res) {

        console.log("CALL: POST editprojects");

        var Project = require('../model/Project');

        Project.editProject(req.body, function (err) {

            var ris = (err == null)
                ? ConstantsRouter.status(0, "ok")
                : ConstantsRouter.status(1, err.toString());

            res.json(ris)

        });

    });

    router.post('/delproject', function (req, res) {
        var project = req.body.project;
        Project.delProject(project, function (err, ris) {
            res.json(ris);
        });

    });

    router.post('/setproject', function (req, res) {
        req.session.project = req.body.project;

        res.setHeader("Content-Type", "text/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify({status: 200}));

    });

    router.get('/getproject', function (req, res) {
        var project = req.query.project;
        var username = req.session.user || req.query.user;
        if (project == null)
            res.json({});
        else {
            var Project = require("../model/Project");
            Project.getProject(project, username, function (data) {
                res.json(data);
            });
        }
    });

    router.get('/uploaddata', function (req, res) {
        res.redirect("/project/editproject");
    });

    app.post('/project/uploaddata', app.up_datas, function (req, res) {

        var files = req.files;
        var username = req.session.user;
        var project = req.session.project;
        var type = req.body.type;
        var ris = {};

        res.end("ok");

        //res.json({status:0});

        async.each(files,

            function (f, next) {

                var projectData = {
                    app: app,
                    filePath: f.path,
                    fileName: f.originalname,
                    username: username,
                    project: project,
                    type: type,
                    serverUrl: req.headers.host
                };

                Project.addData( projectData, function (err, result) {
                    ris[f.originalname] = result;
                    fs.unlinkSync(f.path);
                    next(err);
                });

            },

            function (err) {

                Summary.updateStat( project, username, function(err){
                    app.io.emit("uploaddata_end", ris);
                    //res.json(ris);
                });
            }
        );

    });

    router.get('/sync', function (req, res) {

        var project =  req.session.project || req.query.project;
        var username = req.session.user || req.query.user;

        var start = new Date();

        app.io.emit("projectsync_msg", "###########################################");
        app.io.emit("projectsync_msg", "###### Synchronize datas in regions  ######");
        app.io.emit("projectsync_msg", "###########################################");

        if( !project ) {
            //res.write("Error: no project<br>");
            res.status(200).end("Nessun progetto selezionato");
            app.io.emit("Nessun progetto selezionato");
            return;
        }

        /**
         *  Restiruisce subito lo status
         *  I messaggi verranno scambiati con le socket.io
         */
        console.log("CALL: /project/sync - project: " + project);
        res.status(200).end("Sincronizzazione di " + project + " in corso...");
        app.io.emit("projectsync_msg", "Project: " + project);

        Project.sync(project, username, app, function (err, result) {
            app.io.emit("projectsync_msg", 'Finish in ' + (new Date().getTime() - start.getTime()) / 1000 + " s");
        });
    });

    router.get('/stat', function (req, res, next) {

        if (_.keys(req.query).length > 0) {
            next(null);
            return;
        }

        console.log("CALL: simple stat");

        if (req.session.project)
            Summary.getStat(req.session.project, function (err, data) {
                res.json(data);
            });
        else
            res.redirect("/view/app/#project/openproject");
    });

    /**
     * Stat calcolato a runtime
     */
    router.get('/stat', function (req, res) {
        console.log("CALL: filter stat");

        var project = req.session.project || req.query.project;
        var username = req.session.user;

        if (req.session.project)
            Summary.getStatFilter(project, username, req.query, function (err, data) {
                res.json(data);
            });
        else
            res.redirect("/view/app/#project/openproject");
    });

    router.post('/stat', function (req, res) {

        console.log("CALL: filter stat");

        var project = req.session.project || req.query.project;
        var username = req.session.user;

        if (req.session.project)
            Summary.getStatFilter(project, username, req.body, function (err, data) {
                res.json(data);
            });
        else
            res.redirect("/view/app/#project/openproject");
    });

    router.get('/lastupdate', function (req, res) {
        var project = req.session.project || req.query.project;

        if (!project) {
            res.redirect("/view/login");
            return;
        }

        Project.getLastUpdate(project, function (err, data) {
            res.json(data);
        })
    });

};

