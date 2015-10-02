"use strict";
var Data = require("../model/Data"),
    fs = require('fs'),
    readline = require('readline'),
    stream = require('stream'),
    async = require('async'),
    _ = require('underscore'),
    mongoose = require('mongoose');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var iconvlite = require('iconv-lite');

var CrowdPulse = function() {

    /**
     *
     * @param arg
     * @param arg.filePath
     * @param arg.fileName
     * @param arg.app
     * @param arg.project
     * @param callback
     */

    this.importFromFile = function(arg ,  callback)
    {
        console.log("CALL: CrowdPulse.importFromFile");

        var filePath = arg.filePath;
        var project = arg.project;
        var app = arg.app;
        var instream = fs.createReadStream(filePath);
        var outstream = new stream;
        var rl = readline.createInterface(instream, outstream);

        var docs = [];
        var contLine = 0;
        var contError = 0;

        rl.on('line', function(line) {
            try{
                var obj = JSON.parse(line);
                docs.push(obj);
            }catch(e) { contError++; }
            contLine++;
        });

        rl.on('close', function() {

            console.log("lette " + contLine + " righe, errori: " + contError);

            async.waterfall([

                //costruisco il dataset da salvare
                function(next){ async.map( docs , function(obj, next) {

                        var d = {
                            "id" : obj["oid"],
                            "date" : new Date( obj.date["$date"] ),
                            "projectName" : project,
                            "source" : obj.source,
                            "text" : obj["text"],
                            "user" : obj["fromUser"],
                            "tag" : '',
                            "loc" : {},
                            tokens : []
                        };

                        if( obj.latitude ) d.latitude = obj.latitude;
                        if( obj.longitude ) d.longitude = obj.longitude;

                        //prende il tag dalla prima posizione di custom tags
                        if( obj['customTags'] &&
                            obj['customTags'].length > 0 &&
                            obj['customTags'][0]) {

                            d.tag = obj['customTags'][0];
                        }

                        //costruisce l'attributo punto
                        if(obj.latitude && obj.longitude) {
                            d.loc = {
                                "type" : "Point",
                                "coordinates" : [ obj.longitude, obj.latitude ]
                            }
                        }

                        //processo i token
                        if( obj.tokens )
                        for(var i = 0; i< obj.tokens.length; i++)
                        {
                            //per diversi bug in crowdpulse, le stringhe piccole sono considerate irrilevanti
                            if( obj.tokens[i].text.length <= 2 ) continue;

                            //prendo solo le non stopword
                            if(obj.tokens[i].stopWord == false)
                            {
                                d.tokens.push(obj.tokens[i].text);
                            }
                        }

                        next(null, d);

                    } ,
                        function(err, results){
                            next(err, results);
                        }
                    )
                },

                //salvo i documenti
                function(results, next){

                    saveDocs({app:app, docs: results, file: arg.fileName} ,
                        function(err, resultSave){
                            next(err, resultSave);
                        }
                    );

                },

                //aggiorno il contatore
                function(resultSave, next){

                    var Project = require('../model/Project');

                    Project.setSize({project: arg.project}, function(err){
                        next(err, resultSave);
                    })

                }

            ], function(err, resultSave){


                if(err)
                    callback(err, {success: 0, fail: 9999} );
                else
                    callback(err, resultSave );

            });

        });
    };

    /**
     *
     * @param arg
     * @param arg.app
     * @param arg.docs
     * @param arg.file
     * @param callback
     */
    function saveDocs (arg, callback) {

        var result = {fail: 0, success:0};
        var docs = arg.docs;
        var app = arg.app;
        var file = arg.file;

        if(docs.length == 0) {
            callback("doc is empty", result);
            return;
        }

        MongoClient.connect(url, function (err, db) {

            var datas = db.collection('datas');
            var len = docs.length;
            var cont = 0;

            console.log("Salvo: " + len + " documenti");

            async.each(docs, function (doc, next) {
                datas.insert(doc, function(err){

                    if(err) result.fail++; else result.success++;
                    cont++;

                    if( cont % 2000 == 0)
                    {
                        var percentage = ((cont / len) * 100).toFixed(2);
                        app.io.emit("uploaddata_progress", {tot:len, done:cont, percentage: percentage, file:file});
                        console.log( percentage + " %" ) ;
                    }

                    next(null);
                });

            }, function (err) {

                db.close();
                callback(err, result)

            });
        });
    }
};

module.exports = new CrowdPulse();