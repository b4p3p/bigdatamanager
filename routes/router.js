"use strict";

var extend = require('util')._extend;
var ConstantsRouter = require('./constants_router');

module.exports = function (app) {

    app.get('/', function (req, res) {
        res.redirect('/view/login');
    });

    /**
     * Imposta le variabili di sessione per l'utente ospite
     */
    app.get('/guest', function (req, res) {
        console.log("CALL: /guest");

        req.session.destroy();
        req.session.isGuest = true;
        req.session.level = -1;

        res.redirect("/view/app");

    });

    /**
     * Effettua il logout distruggendo le variabili di sessione
     */
    app.get('/logout', function (req, res) {
        console.log("CALL: /logout");

        req.session.destroy();
        req.session.isGuest = null;

        res.end("ok");

    });

    /**
     * Effettua il login impostando le variabili di sessione
     */
    app.post('/login', function (req, res){
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
                req.session.level = data.level;

                User.setLastLogin(username);

                res.redirect('/view/app');
            }

        });

    });

};