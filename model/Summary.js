"use strict";

var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Util = require("../controller/nodeUtil");
var url = 'mongodb://localhost:27017/oim';
var Datas = require("../model/Data");
var Regions = require("../model/Regions");
var _ = require("underscore");

var Summary = function () {
};

Summary.MODEL_NAME = "summaries";

Summary.SCHEMA_COUNTER = new Schema({
    tag: String,
    count: Number
});

Summary.SCHEMA_REGIONS = new Schema({
    name: String,
    counter: [Summary.SCHEMA_COUNTER],
    count: Number
});

Summary.SCHEMA_NATION = new Schema({
    name: String,
    counter: [Summary.SCHEMA_COUNTER],
    count: Number,
    regions: [Summary.SCHEMA_REGIONS]
});

Summary.SCHEMA = new Schema(
    {
        projectName: {type: String, required: true},
        username: {type: String, required: true},
        lastUpdate: Date,
        data: {
            minDate: Date,
            maxDate: Date,
            syncTags: [String],
            allTags: [String],
            counter: Object,
            countSync: Number,
            countTot: Number,
            nations: Object
        }
    },
    {strict: false}
);

Array.prototype.indexOfObject = function (key, value) {
    if (this.length == 0) return -1;

    for (var i = 0; i < this.length; i++)
        if (this[i][key] == value)
            return i;

    return -1;
};

Summary.getStat = function (project, callback)
{

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var summaries = connection.model(Summary.MODEL_NAME, Summary.SCHEMA);

    summaries.findOne(
        {project: project},
        function (err, doc) {
            callback(err, doc);
        }
    );
};

Summary.getStatFilter = function (project,username, query, callback)
{
    console.log("CALL Summary.getStatFilter of " + project);

    Datas = require("../model/Data");

    var docSync = {
        project: project,
        username: username,
        lastUpdate: new Date(),
        data: {
            minDate: null,
            maxDate: null,
            countSync: 0,
            countTot: 0,
            syncTags: {},
            allTags: {},
            counter: {},
            nations: {}
        }
    };

    function _setDate(date) {

        if (!docSync.data.minDate)
            docSync.data.minDate = date;
        if (!docSync.data.maxDate)
            docSync.data.maxDate = date;

        if (date < docSync.data.minDate)
            docSync.data.minDate = date;
        if (date > docSync.data.maxDate)
            docSync.data.maxDate = date;
    }

    function setDate(minDate, maxDate) {
        _setDate(minDate);
        _setDate(maxDate);
    }

    function buildQuery(query) {

        var ris = [];

        if (query) {

            if (query.start) ris.push({date: {$gte: new Date(query.start)}});
            if (query.end)   ris.push({date: {$lte: new Date(query.end)}});

            if (query.tags) {
                var tags = query.tags.split(',');
                ris.push({tag: {$in: tags}});
            }

            if (query.nations) {
                var nations = query.nations.split(',');
                ris.push({nation: {$in: nations}});
            }

            if (query.regions) {
                var regions = query.regions.split(',');
                ris.push({region: {$in: regions}});
            }
        }
        if (ris.length > 0) return ris; else return [{}];

    }

    var connection = mongoose.createConnection('mongodb://localhost/oim');



    var datas = connection.model(Datas.MODEL_NAME, Datas.SCHEMA);
    var regions = connection.model(Regions.MODEL_NAME, Regions.SCHEMA);
    var maxRegionCount = 0;
    var maxNationCount = 0;

    var queryAgg = buildQuery(query);

    async.parallel( {

            regions: function (callback)
            {
                regions.aggregate( [

                    { $group: {
                        _id: "$properties.NAME_0",
                        regions: { $addToSet: "$properties.NAME_1" }
                    }},

                    {$project: {
                        _id: 0,
                        nation: "$_id",
                        regions: 1
                    }}
                ], function(err, result) {

                    callback(err, result);

                });
            },

            docSync: function (callback)
            {
                datas.aggregate(
                    [
                        {
                            $match: {
                                projectName: project,
                                nation: {$exists: true},
                                $and: queryAgg
                            }
                        },

                        {
                            $group: {
                                _id: {nation: "$nation", region: "$region", tag: "$tag"},
                                count: {$sum: 1},
                                minDate: {$min: "$date"},
                                maxDate: {$max: "$date"}
                            }
                        }

                    ],

                    function (err, result) {
                        var nation = "",
                            region = "",
                            tag = "",
                            count = 0;

                        async.each(result,

                            function (item, next) {

                                nation = item._id.nation;
                                region = item._id.region;
                                tag = item._id.tag;
                                count = item.count;

                                //min e max date
                                setDate(item.minDate, item.maxDate);

                                //count tot
                                docSync.data.countTot += item.count;

                                if (!docSync.data.allTags[tag])
                                    docSync.data.allTags[tag] = true;

                                if (!nation) {
                                    next(null);
                                    return;
                                }

                                //count tot
                                docSync.data.countSync += item.count;

                                if (!docSync.data.syncTags[tag])
                                    docSync.data.syncTags[tag] = true;

                                //counter TOT
                                if (!docSync.data.counter[tag]) {
                                    docSync.data.counter[tag] = {
                                        tag: tag,
                                        count: 0
                                    }
                                }
                                docSync.data.counter[tag].count += count;

                                //nations
                                if (!docSync.data.nations[nation]) {
                                    docSync.data.nations[nation] = {
                                        name: nation,
                                        regions: {},
                                        count: 0,
                                        counter: {}
                                    }
                                }

                                docSync.data.nations[nation].count += count;

                                //COUNTER NATION
                                if (!docSync.data.nations[nation].counter[tag]) {
                                    docSync.data.nations[nation].counter[tag] = {
                                        tag: tag,
                                        count: 0
                                    }
                                }
                                docSync.data.nations[nation].counter[tag].count += count;

                                //REGIONS
                                if (!docSync.data.nations[nation].regions[region]) {
                                    docSync.data.nations[nation].regions[region] = {
                                        name: region,
                                        count: 0,
                                        counter: {}
                                    }
                                }
                                docSync.data.nations[nation].regions[region].count += count;

                                //COUNTER REGIONS
                                if (!docSync.data.nations[nation].regions[region].counter[tag]) {
                                    docSync.data.nations[nation].regions[region].counter[tag] = {
                                        tag: tag,
                                        count: 0
                                    }
                                }
                                docSync.data.nations[nation].regions[region].counter[tag].count += count;

                                next(null);
                            },

                            function (err) {
                                docSync.data.allTags = _.keys(docSync.data.allTags);
                                docSync.data.syncTags = _.keys(docSync.data.syncTags);

                                callback(err, true);
                            }
                        );
                    }
                );
            },

            max: function(callback) {

                datas.aggregate(
                    [
                        {
                            $match: {
                                projectName: project,
                                nation: {$exists: true},
                                $and: queryAgg
                            }
                        },

                        {
                            $group: {
                                _id: {nation: "$nation", region: "$region" },
                                sum: {$sum: 1}
                            }
                        },

                        {
                            $group: {
                                _id: "$_id.nation" ,
                                sum: {$sum: "$sum" },
                                regions: {$push: {region: "$_id.region", sum:"$sum" } }
                            }
                        },

                        {
                            $project: { _id: 0, nation: "$_id", sum: 1, regions:1 }
                        },

                        {
                            $sort: { count: -1 }
                        }

                    ],

                    function (err, result) {

                        if (result.length == 0){
                            callback(null, 0);
                            return;
                        }

                        var ris = {nation : 0, region : 0};

                        _.each(result, function(nation) {

                            ris.nation = Math.max( ris.nation, nation.sum);
                            _.each(nation.regions, function(region) {
                                ris.region = Math.max( ris.region, region.sum);
                            });
                        });


                        callback(null, ris);

                    }
                );

            },
            
            allTags: function(callback){
                datas.distinct("tag", {projectName: project}, function (err, result) {
                    callback(err, result);
                })
            },

            count: function(callback){
                var exec = datas.find( {projectName: project} );
                exec = Util.addWhereClause(exec, query);
                exec.count( function (err, result) {
                    callback(err, result);
                });
            }
        },

        //add missing region - add avg
        function (err, results) {

            connection.close();

            docSync.data.allTags = results.allTags;
            docSync.data.countTot = results.count;

            async.each(results.regions,

                function(obj, next){

                    //nation == null
                    if(!docSync.data.nations[obj.nation]) {
                        next(null);
                        return;
                    }

                    docSync.data.nations[obj.nation].avg = docSync.data.nations[obj.nation].count / results.max.nation;

                    async.each(obj.regions, function(region, next)
                    {

                        //add empty region
                        if(!docSync.data.nations[obj.nation].regions[region])
                        {
                            docSync.data.nations[obj.nation].regions[region] = {
                                name: region,
                                count: 0,
                                counter: {}
                            };
                        }

                        docSync.data.nations[obj.nation].regions[region].avg =
                            docSync.data.nations[obj.nation].regions[region].count / results.max.region;

                        next(null);

                    }, function(err){
                        next(err);
                    })
                }

                , function(err){ //end

                callback(err, docSync);

            })
            ;
        });
};

module.exports = Summary;
