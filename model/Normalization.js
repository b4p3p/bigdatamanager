"use strict";

var url = 'mongodb://localhost:27017/oim';
var _ = require("underscore");
var async = require("async");

var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Data = require("../model/Data");
var Project = require("../model/Project");

var Normalization = function(){};

var MODELNAME = "normalization";
Normalization.MODEL_NAME = MODELNAME;

var SCHEMA = new Schema({
    loc: {
        "type" : String,
        "coordinates" : [ Number ]
    }
}, {
    collection: MODELNAME
});
Normalization.SCHEMA = SCHEMA;

Normalization.overwriteDocs = function(docs, callback){

    MongoClient.connect(url, function (err, db) {

        var norm = db.collection('normalization');

        async.waterfall([

            //cancello i precenti dati
            function(next){
                norm.remove({}, function(err, result){
                    next(null);
                });
            },

            //salvo i nuovi dati
            function(next){
                norm.insert(docs, function(err, result){
                    next(null);
                });
            }

        ], function(err){
            db.close();
            callback(err);
        });

    });
};

module.exports = Normalization;