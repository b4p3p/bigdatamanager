"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Regions = require("../model/Regions");
var Users = require("../model/User");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

module.exports = function (router, app) {

    router.get('/users', function (req, res)
    {
        Users.getUsers(function(err, users){
            res.json(users);
        });
    });

};

