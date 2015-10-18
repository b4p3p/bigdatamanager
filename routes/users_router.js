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

    /**
     * Restituisce tuttI gli utenti registrati
     */
    router.get('/users', function (req, res)
    {
        Users.getUsers(function(err, users){
            res.json(users);
        });
    });

    /**
     * Aggiunge un nuovo utente
     */
    router.post('/adduser', function (req, res)
    {
        var obj = {
            username : req.body.username,
            password : req.body.password,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            created : new Date()
        };

        Users.addUser(obj, function(err){

            if(err)
            {
                var arg = null;
                if(err.code == 11000)
                    arg = ConstantsRouter.status(err.code, "Username already exists");
                else if ( err.message )
                    arg = ConstantsRouter.status(1, err.message);
                else
                    arg = ConstantsRouter.status(1, err.toString());
                res.render('../views/pages/register.ejs', arg );
            }
            else
            {
                //res.redirect('/view/app#/');
                res.redirect('/view/login#useradd');
            }
        })

    });

    /**
     * Cancella l'utente selezionato
     */
    router.post('/deluser', function (req, res) {
        var user = req.body.user;
        if(!user) res.status(500).end("user missing");
        Users.delUser(user, function(err) {
            res.end("ok");
        });
    });
};

