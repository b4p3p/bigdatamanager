"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Regions = require("../model/Regions");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

module.exports = function (router, app) {

    router.get('/*', function (req, res, next)
    {
        if(!req.session.user)
        {
            res.redirect("/view/login");
            return;
        }

        if(!req.session.project)
        {
            res.redirect("/view/project/openproject");
            return;
        }

        next(null);
    });

    router.get('/users', function (req, res)
    {
        var project = req.session.project || req.query.project;

        Data.getUsers( project , req.query, function(err, docs){
            if(!docs) docs = {};
            res.json(docs);
        });
    });

    router.get('/datas', function (req, res)
    {
        var project = req.session.project || req.query.project;

        Data.getDatas( project , function(err, docs){
            res.json(docs);
        });

    });

};

