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

    router.post('/adduser', function (req, res)
    {
        var obj = {
            username : req.body.user,
            password : req.body.password,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            created : new Date()
        };

        Users.addUser(obj, function(err){

            if(err) {
                var arg = null;
                if(err.code == 11000)
                    arg = ConstantsRouter.argError(err.code, "Username already exists")
                else
                    arg = ConstantsRouter.argError(1, err.message);

                res.render('../views/pages/register.ejs', arg );
            }
            else
                res.redirect('/views/pages/login.ejs');
        })

    });

};

