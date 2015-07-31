"use strict";

var extend = require('util')._extend;
var ConstantsRouter = require('./constants_router');

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

    app.get('/logout', function (req, res)
    {
        console.log("CALL: /logout");

        req.session.destroy();
        req.session.isGuest = null;

        res.end("ok");

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
                res.redirect('/view/app');
            }

        });

    });

    var cont = 0;

    function writeLine(res){
        res.write("test -" + cont + "<br>");
    }

    function loop(res){
        setTimeout(function(){
            cont++;
            if(cont<15) {
                writeLine(res);
                loop(res)
            }
            else
            {
                res.end("fine");
                //res.end("<p>");
            }
        },400);
    }

    app.get('/test', function (req, res){

        res.setHeader('Connection', 'Transfer-Encoding');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        cont = 0;
        //res.write("<p>");
        loop(res);
    });

};