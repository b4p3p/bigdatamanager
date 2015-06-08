"use strict";
var ConstantsRouter = require('./constants_router');
var async = require("async");

var databaseError = function(status, message)
{
    if(status == null)
        status = 1;
    if(message == null)
        message = 'error';

    return{
        status: status,
        message: message
    }
};

module.exports = function (app) {

    app.get('/database', function (req, res) {
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

    app.post('/database', function (req, res) {
        // Controlla che tutti i file siano stati upload-ati
        if (app.isUploadDone() == false) return;

        // reset variable upload
        var fileNames = app.fileNames;
        app.resetVariableUpload();

        var Nation = require('../model/Nation');

        Nation.importFromFile(fileNames,
            function (err, result) {
                if (err == null)
                    sendDatabaseError(req, res, "Loading successfully performed", 0);
                else
                    sendDatabaseError(req, res, err.message, err.status);
            }
        );
    });

    /**
     *  Sincronizza i dati con le regioni:
     *   - imposta la regione e la nazione ai dati
     */
    app.get('/synchronize', function (req, res)
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
                MongoClient.connect(url, function (err, db) {

                    _datas = db.collection('datas');
                    _regions = db.collection('regions');
                    _db = db;

                    cb_w(null);

                });
            },

            //prendo le regioni
            function (cb_w)
            {
                _regions.find({}, ["properties.NAME_0", "properties.NAME_1", "geometry"]).toArray(
                    function (err, regions) {
                        cb_w(null, regions)
                    }
                );
            },

            // per ogni regione modifico la tupla di datas
            function (regions, cb_w)
            {
                updateRegions(regions, function (err) {
                    cb_w(null);
                });
            }
            
        ], function (err) {
            res.json(databaseError(0, cont_modificati));
        });

        function updateRegions(regions, callback) {

            console.log("### update regions ###");

            async.each(regions, updateRegion, function(err)
            {
                console.log("### end ###");
                callback(null);
            });
        }

        function updateRegion(region, callback)
        {
            _datas.find( {
                projectName: projectName,
                loc:{
                    $geoWithin: {
                        $geometry: region.geometry
                    }
                }
            },["_id"]).toArray( function( err, editDatas ) {

                cont_modificati = 0;

                if(editDatas == null || editDatas.length == 0 )
                    callback(null);

                else
                    async.each(editDatas, updateDato.bind(null, region), function(err)
                    {
                        console.log(region.properties.NAME_1 + ": "  + cont_modificati);
                        callback(null);
                    });
            });
        }

        function updateDato(region, d, callback)
        {
            _datas.update(
                {"_id": d._id},
                {
                    $set : {
                        nation : region.properties.NAME_0,
                        region : region.properties.NAME_1
                    }
                },
                function(err){
                    cont_modificati++;
                    callback(null);
                }
            );
        }
    });
};

function sendDatabaseError(request, response, message, status)
{
    //restituisco errore
    var err = databaseError(status, message);
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