"use strict";

var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var Regions = require("../model/Regions");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

module.exports = function (router, app) {

    router.get('/regions', function (req, res)
    {
        var projectName = req.session.projectName;
        var nations = req.query.nations ? req.query.nations.split(',') : [];
        var tags = req.query.tags ? req.query.tags.split(',') : [];
        var isLight = req.query.light ? true : false;

        Regions.getRegions(projectName, nations, tags, isLight, function(err, data){
            res.json(data);
        });
    });

    router.get('/nations', function (req, res)
    {
        Regions.getLightNations( function(err, data) {
            res.json(data);
        });
    });

    router.get("/putnation", function (req, res)
    {
        res.redirect('/view/db/nations')
    }),

    router.post("/putnation", function (req, res)
    {

        if( !app.isUploadDone() )
        {
            console.log("UPLOADING....");
            return;
        }

        var files = app.getUploadedFiles();
        var username = req.session.username;
        var projectName = req.session.projectName;
        var ris = {};

        var Regions = require('../model/Regions');

        Regions.importFromFile(files,
            function (err, result) {

                if (err == null)
                {
                    var Project = require("../model/Project");
                    Project.synchronize( req.headers.host, projectName, function(err){
                        res.json( {status:0, result:result } );
                    })
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

