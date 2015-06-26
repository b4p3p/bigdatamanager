"use strict";

var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var url = 'mongodb://localhost:27017/oim';

var Summary = function(){};

Summary.MODEL_NAME = "summaries";

Summary.SCHEMA = new Schema(
    {
        projectName: {type: String, required: true},
        username: {type: String, required: true},
        data: {
            tags: [String],
            percentageGeoReference: Number,
            count : Number,
            nations: [{
                name: String,
                regions: [{
                    name: String,
                    counter: [{
                        tag: Number,
                        count:Number}
                    ]
                }],
                sum: Number
            }]
        }
    },
    { strict: false }
);

Summary.sync = function(projectName, callback){

    callback(null, {});

};



module.exports = Summary;