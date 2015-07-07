"use strict";
var Data = require("../model/Data");
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

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
            async.map( docs , convertObj , function(err, results){
                saveDocs(docs, function(err, result){
                    callback(null, {success: 0, fail: 0} );
                });
            })
        });
    };

    function convertObj(obj, next){

    }

    function saveDocs (docs, callback){

        MongoClient.connect(url, function (err, db) {
            var datas = db.collection('datas');
            datas.insert(docs, function(err, result){
                db.close();
                callback(null, {});
            })
        });
    }
};

module.exports = new CrowdPulse();