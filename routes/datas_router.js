"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Regions = require("../model/Regions");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

module.exports = function (router, app) {

    router.get('/users', function (req, res)
    {
        var project = req.session.project || req.query.project;

        Data.getUsers( project , req.query, function(err, docs){
            if(!docs) docs = {};
            res.json(docs);
        });
    });

};

