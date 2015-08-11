"use strict";
var ConstantsRouter = require('./constants_router');
var MongoClient = require('mongodb').MongoClient;
var async = require("async");
var mongoose = require('mongoose');
var Datas = require('../model/Data');
var Summary = require('../model/Summary');

var databaseError = function(status, message, project)
{
    if(status == null)
        status = 1;
    if(message == null)
        message = 'error';

    return{
        status: status,
        message: message,
        project: project
    }
};

module.exports = function (app) {

    app.get('/database', function (req, res)
    {
        var arg = ConstantsRouter.argIndex();

        if (req.session.arg)                    // uso  i paramenti presenti nella variabile di sessione
        {
            arg = req.session.arg;
            req.session.arg = null;
        }
        else                                    // mi costruisco la variabile usando le variabili di sessione
        {
            var sess = req.session;
            arg.user = req.session.user;
            arg.project = req.session.project;
            arg.page = ConstantsRouter.PAGE.DATABASE;
        }
        res.render('../views/pages/index.ejs', arg);

    });

    app.post('/database', function (req, res)
    {
        // Controlla che tutti i file siano stati upload-ati
        if (app.isUploadDone() == false) return;

        // reset variable upload
        var fileNames = app.fileNames;
        app.resetVariableUpload();

        var Nation = require('../model/Regions');

        Nation.importFromFile(fileNames,
            function (err, result) {
                if (err == null)
                    sendDatabaseError(req, res, "Loading successfully performed", 0);
                else
                    sendDatabaseError(req, res, err.message, err.status);
            }
        );
    });
};

function sendDatabaseError(request, response, message, status)
{
    //restituisco errore
    var err = databaseError(status, message, request.session.project);
    var arg = ConstantsRouter.argIndex(null, ConstantsRouter.PAGE.DATABASE);
    arg.error = err;

    if (status > 0)
    {
        console.error("CALL: sendDatabaseError");
        console.error(err);
    }else
    {
        console.log("CALL: sendDatabaseError");
    }

    request.session.arg = arg;
    response.redirect("/database");
}