"use strict";
var ConstantsRouter = require('./constants_router');
var MongoClient = require('mongodb').MongoClient;
var async = require("async");
var mongoose = require('mongoose');
var Datas = require('../model/Data');
var Summary = require('../model/Summary');

var databaseError = function(status, message, projectName)
{
    if(status == null)
        status = 1;
    if(message == null)
        message = 'error';

    return{
        status: status,
        message: message,
        projectName: projectName
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
            arg.userProject = req.session.userProject;
            arg.projectName = req.session.projectName;
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


    app.get('/synchronize', function (req, res)
    {
        var projectName = req.session.projectName || req.query.projectName;

        console.log("CALL: /synchronize of %s", projectName);

        if(!projectName)
            res.json(result);
        else
            Summary.sync(projectName, function(err, result){
                res.json(result);
            });
    });

    /**
     *  Sincronizza i dati con le regioni:
     *   - imposta la regione e la nazione ai dati
     */
    app.get('/synchronize_bak', function (req, res)
    {
        var _db = null;
        var _datas = null;
        var _regions = null;
        var cont_modificati = 0;
        var projectName = req.query.projectName;

        if(projectName == null || projectName == "") {
            res.json(databaseError(1,"'projectName' is required"));
            return;
        }

        async.waterfall([

            //connessione al database
            function (cb_w)
            {
                var url = 'mongodb://localhost:27017/oim';
                MongoClient.connect(url, function (err, db)
                {

                    _datas = db.collection('datas');
                    _regions = db.collection('regions');
                    _db = db;

                    cb_w(null);

                });
            },

            function(cb_r){

                var cursor = _regions.find({});

                console.log("### sincronizzazione  ###");

                var cont_success = 0;
                var cont_dafare = 0;
                var cont_fatti = 0;

                cursor.each( function(err, region) {

                    if ( region == null )
                    {
                        console.log("### fine  ###");
                    }
                    else
                    {
                        console.log(" - " + region.properties.NAME_0 + " " +  region.properties.NAME_1)

                        cont_dafare++;

                        _datas.update(
                            {
                                projectName: projectName,
                                loc: {
                                    $geoWithin: {
                                        $geometry: region.geometry
                                    }
                                }
                            },
                            {
                                $set: {
                                    nation: region.properties.NAME_0,
                                    region: region.properties.NAME_1
                                }
                            },
                            {
                                multi: true , w:1
                            }, function(err, result)
                            {
                                if(!result)
                                    console.log("");
                                cont_success+=result.result.n;
                                cont_fatti++;
                                console.log(result.result.n);
                                if(cont_dafare==cont_fatti)
                                {
                                    cb_r(null, cont_success);
                                }
                            })
                    }

                })

            }
            
        ], function (err, cont_success)
        {
            _db.close();
            res.json(databaseError(0, cont_success, projectName));
        });

    });
};

function sendDatabaseError(request, response, message, status)
{
    //restituisco errore
    var err = databaseError(status, message, request.session.projectName);
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