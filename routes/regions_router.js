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

};

