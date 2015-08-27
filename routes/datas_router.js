"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Regions = require("../model/Regions");
var Summary = require("../model/Summary");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');
var mongoose = require('mongoose');

module.exports = function (router, app) {

    router.get('/*', function (req, res, next) {

        if(!req.session.user) {
            res.redirect("/view/login");
            return;
        }

        if(!req.session.project) {
            res.redirect("/view/project/openproject");
            return;
        }

        next(null);
    });

    router.get('/users', function (req, res) {
        var project = req.session.project || req.query.project;

        Data.getUsers( project , req.query, function(err, docs){
            if(!docs) docs = {};
            res.json(docs);
        });
    });

    router.get('/datas', function (req, res) {
        var project = req.session.project || req.query.project;
        var query = req.query;

        Data.getDatas( project , query, function(err, docs){
            res.json(docs);
        });

    });

    router.get('/datafilter', function (req, res) {
        var project = req.session.project || req.query.project;
        var query = req.query;

        Data.getDataFilter( project , query, function(err, docs){
            res.json(docs);
        });

    });

    router.get('/userdata', function (req, res) {
        var project = req.session.project || req.query.project;
        var query = req.query;

        Data.getUserData( project , query, function(err, docs){
            if(err)
            {
                res.status(500).end( err.toString() );
            }else
            {
                res.json(docs);
            }

        });

    });

    router.get('/overrideTokensData', function (req, res) {

        res.setHeader('Connection', 'Transfer-Encoding');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        var start = new Date();

        res.write('<body style="color:dimgrey;font-family: monospace;font-size: 15px;text-align: left;position: static;">');

        res.write('########################################<br>');
        res.write('###### Override tokens data start ######<br>');
        res.write('########################################<br>');

        var project = req.session.project || req.query.project;

        Data.overrideTokensData(project, res, function(err) {
            app.io.emit('overrideDataTokens_end', {});
            res.end("fatto!")
        });

    });

    router.get('/nations', function (req, res) {
        var project = req.session.project || req.query.project;
        Data.getNations( project, function(err, data) {
            res.json(data);
        });
    });

    router.get('/databydate', function(req, res){

        var project = req.session.project || req.query.project;

        Data.dateByDate(project, req.query, function(err, docs){
            if(!err) {
                res.json(docs);
            }else{
                res.status(500).send(err.toString());
            }
        })
    });

    router.post('/deldata', function(req, res){

        res.end("ok");

        var project = req.body.project || req.session.project;
        if( project == null || project == "") { res.status(500).end("missing project"); return; }

        var connection = mongoose.createConnection('mongodb://localhost/oim');

        async.parallel({
            data: function(next){
                Data.delData({project:project, connection:connection}, function(err, res){
                    next(err, res);
                });
            },
            summaries: function(next){
                Summary.setEmptyStat({project:project, connection:connection}, function(err, res){
                    next(err, res);
                })
            }
        }, function(err, result){
            connection.close();
            app.io.emit("deldatas", {data:result.data.result.n});
        });
    });

    router.get('/info', function(req, res){
        var project = req.session.project || req.query.project;
        Data.getInfo(project, function(err, result){
            if(!err) res.json(result); else res.status(500).send(err.toString());
        })
    });
};

