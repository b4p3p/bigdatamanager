"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Regions = require("../model/Regions");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

module.exports = function (router, app, upload) {

    router.get('/regions', function (req, res)
    {
        var project = req.session.project;
        var nations = req.query.nations ? req.query.nations.split(',') : [];
        var isLight = req.query.light ? true : false;

        Regions.getRegions(nations , isLight, function(err, data){
            res.json(data);
        });
    });

    router.get('/nations', function (req, res)
    {
        var project = req.session.project || req.query.project;
        Regions.getNations( project, function(err, data) {
            res.json(data);
        });
    });

    router.get("/putnation", function (req, res)
    {
        res.redirect('/view/db/nations')
    });

    app.post("/regions/putnation", app.up_nations , function (req, res)
    {
        var files = req.files;
        var username = req.session.user;
        var project = req.session.project;
        var ris = {};

        var Regions = require('../model/Regions');

        Regions.importFromFile(files,
            function (err, result)
            {
                if (err == null)
                {
                    res.json( {status:0, result:result } );

                    //var Project = require("../model/Project");
                    //Project.sync( req.headers.host, project, function(err){
                    //
                    //})
                }
                else
                    res.json( {status:1, error:err.message } );
            }
        );
    });

    /**
     *  @return: { deletedRegion: {Number}, updatedData: {Number}
     */
    router.delete("/nation", function (req, res)
    {
        var nation = req.body.nation;
        Regions.removeNation(nation, function(err, data){
            res.json(data);
        });

    });
};



//router.post("/putnation", function (req, res)
//{
//    if( !app.isUploadDone() )
//    {
//        console.log("UPLOADING....");
//        return;
//    }
//
//    var files = app.getUploadedFiles();
//    var username = req.session.user;
//    var project = req.session.project;
//    var ris = {};
//
//    var Regions = require('../model/Regions');
//
//    Regions.importFromFile(files,
//        function (err, result)
//        {
//            if (err == null)
//            {
//                res.json( {status:0, result:result } );
//
//                //var Project = require("../model/Project");
//                //Project.sync( req.headers.host, project, function(err){
//                //
//                //})
//            }
//            else
//                res.json( {status:1, error:err.message } );
//        }
//    );
//
//});

