"use strict";
var Data = require("../model/Data"),
    fs = require('fs'),
    readline = require('readline'),
    stream = require('stream'),
    async = require('async'),
    _ = require('underscore');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';

var iconvlite = require('iconv-lite');

var CrowdPulse = function() {

    this.importFromFile = function(filePath, project, callback)
    {
        console.log("CALL: CrowdPulse.importFromFile");

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
            }catch(e) {
                contError++;
            }
            contLine++;
        });

        rl.on('close', function() {
            console.log("lette " + contLine + " righe, errori: " + contError);
            async.map( docs , function(obj, next){

                var d = {
                    "id" : obj["oid"],
                    "date" : new Date( obj.date["$date"] ),
                    "projectName" : project,
                    "source" : obj.source,
                    "text" : obj["text"],
                    "user" : obj["fromUser"],
                    tokens : []
                };

                if( obj.latitude ) d.latitude = obj.latitude;
                if( obj.longitude ) d.longitude = obj.longitude;

                if(obj['customTags'] && obj['customTags'].length > 0 && obj['customTags'][0])
                {
                    d.tag = obj['customTags'][0];
                }

                if(obj.latitude && obj.longitude)
                {
                    d.loc = {
                        "type" : "Point",
                        "coordinates" : [ obj.longitude, obj.latitude ]
                    }
                }

                _.each(obj['tokens'], function(token){
                    if(!token['stopWord'])
                        d.tokens.push(token.text )
                });

                next(null, d);

            } , function(err, results){

                if(!err)
                    saveDocs(results, function(err, result){
                        callback(err, result );
                    });
                else {
                    callback(err, {success: 0, fail: 9999} );
                }

            })
        });
    };

    function saveDocs (docs, callback) {

        var result = {fail: 0, success:0};

        if(docs.length == 0) {
            callback("doc is empty", result);
            return;
        }

        MongoClient.connect(url, function (err, db) {

            var datas = db.collection('datas');
            var len = docs.length;

            console.log("Salvo: " + len + " documenti");

            var cont = 0;

            async.each(docs, function (doc, next) {
                datas.insert(doc, function(err, res){
                    if(err) {
                        console.error(err.message);
                        result.fail++;
                    }else
                        result.success++;

                    cont++;

                    if( cont % 2000 == 0)
                        console.log( ((cont / len) * 100) + " %" ) ;

                    next(null);
                });
            }, function (err) {
                db.close();
                callback(null, result);
            });
        });
    }
};

module.exports = new CrowdPulse();