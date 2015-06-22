"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Regions = require("../model/Regions");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

module.exports = function (router) {

    router.get('/regions-light', function (req, res)
    {
        Regions.getLightRegions(function(err, data){
            res.json(data);
        });
    });

    router.get('/nations-light', function (req, res)
    {
        Regions.getLightNations(function(err, data){
            res.json(data);
        });
    });

    router.post("/putnation", function (req, res){

        var files = req.files.fileNation;

        res.json("");

    });
};

