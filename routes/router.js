"use strict";

var extend = require('util')._extend;
var ConstantsRouter = require('./constants_router');
var MongoClient = require('mongodb').MongoClient;

module.exports = function (app) {

    app.get('/', function (req, res) {
        res.redirect('/view/login');
    });

    app.get('/guest', function (req, res)
    {
        console.log("CALL: /guest");

        req.session.destroy();
        req.session.isGuest = true;

        res.redirect("/view/home");

    });

    app.post('/login', function (req, res)
    {
        console.log("CALL: login");

        req.session.destroy();

        var username = req.body.username;
        var password = req.body.password;
        var message = { error:false, message: '' };

        var arg = ConstantsRouter.argIndex(req);

        if ( username == "" || password == "" ) {
            arg.status = ConstantsRouter.status(1, "Username or password missing");
            res.render('../views/pages/login.ejs', arg);
            return;
        }

        var User = require('../model/User');

        User.getUserPsw( username, password, function(data)
        {
            arg.status = ConstantsRouter.status(1, "User not found");

            if ( data == null )
                res.render('../views/pages/login.ejs', arg );

            else
            {
                // ### success ###

                req.session.user = username;
                req.session.isGuest = false;
                res.redirect('/view/home');
            }

        });

    });



};

//function sendProjectError(request, response, message, status)
//{
//    console.log("CALL: sendProjectError");
//
//    //restituisco errore
//    var err = extend({}, ERROR);
//    err.message = message;
//    err.status = status;
//
//    var arg = extend({}, ARG_INDEX);
//    arg.error = err;
//    arg.tab = TAB.NEWPROJECT;
//    arg.page = PAGE.PROJECT;
//
//    request.session.arg = arg;
//    response.redirect("/project");
//}
//
//function getError(status, msg)
//{
//    var err = extend({}, ERROR);
//}
//
//function getArgProject()
//{
//    return extend({}, ARG_PROJECT);
//}