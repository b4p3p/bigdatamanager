"use strict";

var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var Regions = require("../model/Regions");
var Datas = require("../model/Data");
var Projects = require("../model/Project");
var _ = require("underscore");

var Summary = function(){};

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
            counter: [Summary.SCHEMA_COUNTER],
            countSync : Number,
            countTot : Number,
            nations: [Summary.SCHEMA_NATION]
        }
    },
    { strict: false }
);

Array.prototype.indexOfObject = function(key, value)
{
    if(this.length == 0 ) return -1;

    for( var i = 0; i < this.length; i++)
        if(this[i][key] == value)
            return i;

    return -1;
};

Summary.sync = function(project, username, callback)
{
    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var regions     = connection.model( Regions.MODEL_NAME, Regions.SCHEMA);
    var datas       = connection.model( Datas.MODEL_NAME, Datas.SCHEMA);
    var summaries   = connection.model( Summary.MODEL_NAME, Summary.SCHEMA);
    var projects    = connection.model( Projects.MODEL_NAME, Projects.PROJECT_SCHEMA);
    var dictNations = {};
    var cont = 0;

    var docSync = {
        project : project,
        username: username,
        lastUpdate: null,
        data: {
            minDate : null,
            maxDate : null,
            syncTags: [],
            allTags: [],
            countSync : 0,
            countTot: 0,
            counter: [],
            nations: []
        }
    };

    function setCounter(iN, counter)
    {
        for( var i = 0; i<counter.length; i++) {

            var iCT = docSync.data.counter.indexOfObject("tag", counter[i].tag);
            var iCN = docSync.data.nations[iN].counter.indexOfObject("tag", counter[i].tag);

            if(iCT == -1 )
                docSync.data.counter.push({
                    tag: counter[i].tag,
                    count: counter[i].count
                });
            else
                docSync.data.counter[iCT].count += counter[i].count;

            if(iCN == -1 )
                docSync.data.nations[iN].counter.push({
                    tag: counter[i].tag,
                    count: counter[i].count
                });
            else
                docSync.data.nations[iN].counter[iCN].count += counter[i].count;

        }
    }

    function addRegion(region)
    {

        if( dictNations[ region.properties.NAME_0 ] == null ){

            dictNations[ region.properties.NAME_0 ] = cont;

            //salvo la nuova regione
            docSync.data.nations.push( {
                name: region.properties.NAME_0,
                regions: [],
                counter: [],
                count: 0
            });

            cont ++;

        }

        //aggiungo la regione nella rispoettiva nazione
        var index = dictNations[ region.properties.NAME_0 ];

        docSync.data.nations[index].regions.push( {
            name: region.properties.NAME_1,
            counter: [],
            count: 0
        });
    }

    async.waterfall(
        [
            //prendo le regioni
            function(next)
            {
                console.log("    get regions");
                regions.find({},
                    function(err, data) {
                        next(err, data);
                    }
                );
            },

            //costruisco il docSync
            function(regions, next)
            {
                console.log("    build docsync");
                async.each( regions,

                    function(region, next)
                    {
                        region = region._doc;

                        addRegion(region);

                        datas.aggregate (

                            { "$match": {
                                projectName: project,
                                loc: { $geoWithin: { $geometry: region.geometry } } }
                            },

                            {"$group": {
                                "_id": { t:"$tag", r:"$properties.NAME_0" } ,
                                "subtotal": {"$sum": 1}}},

                            { $group:  {
                                _id:"$_id.r",
                                counter:{ $push:{tag:"$_id.t", count:"$subtotal"} },
                                sum:{ $sum:"$subtotal"}}},

                            { "$project": {
                                _id: 1,
                                geometry: 1,
                                counter: 1,
                                nation: { $literal: region.properties.NAME_0 },
                                region: { $literal: region.properties.NAME_1 },
                                IDregion: { $literal: region._id.id },
                                count: "$sum" } },

                            function(err, result){

                                if(!result || result.length == 0) {
                                    next(null); return;
                                }

                                //aggiorno la regione trovata
                                var iN = dictNations[result[0].nation];
                                var iR = _.findIndex(docSync.data.nations[iN].regions, function(obj){
                                    return obj.name == result[0].region;
                                });

                                //aggiorno i contatori
                                docSync.data.nations[iN].regions[iR].counter = result[0].counter;
                                docSync.data.nations[iN].regions[iR].count = result[0].count;
                                docSync.data.nations[iN].count += result[0].count;
                                docSync.data.countSync += result[0].count;
                                setCounter(iN, result[0].counter);

                                //aggiungo i tag trovati
                                _.each(result[0].counter, function(obj, i){
                                    if ( _.indexOf( docSync.data.syncTags, result[0].counter[i].tag ) == -1 )
                                        docSync.data.syncTags.push( result[0].counter[i].tag );
                                });

                                next(null);

                            }
                        );

                    },

                    function(err){
                        next(null, regions);
                    }

                );
            },

            //cancello la precedente sincronizzazione
            function(regions, next)
            {
                console.log("    delete old sync");
                datas.update(
                    { projectName: project } ,
                    { $unset: { region:'', nation:'' } },
                    {multi:true} ,
                    function(err, result){
                        next(null, regions);
                    }
                );
            },

            //sincronizzo i dati
            function(regions, next) {

                MongoClient.connect(url,
                    function (err, db)
                    {

                        var _datas = db.collection('datas');

                        async.each(
                            regions,
                            function(region, next)
                            {
                                region = region._doc;

                                _datas.update(
                                    {
                                        projectName: project,
                                        loc: {
                                            $geoWithin: { $geometry: region.geometry }
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
                                    },
                                    function(err, result)
                                    {
                                        next(null);
                                    }
                                )
                            },
                            function(err)
                            {
                                db.close();
                                next(null);
                            }
                        );
                    }
                );
            },

            //prendo tutti i tag del progetto
            function(next)
            {
                datas.distinct("tag", {projectName: project} ,  function(err, result){
                    docSync.data.allTags = result;
                    next(null);
                });
            },

            //conto i dati
            function(next)
            {
                datas.count( {projectName: project} ,  function(err, result){
                    docSync.data.countTot = result;
                    next(null);
                });
            },

            //prendo il min e max della data
            function(next) {
                datas.aggregate(
                    {
                        "$group": {
                            "_id": null,
                            "min": {$min: "$date"},
                            "max": {$max: "$date"}
                        }
                    }, function(err, result){
                        docSync.data.minDate = result[0].min;
                        docSync.data.maxDate = result[0].max;
                        next(null);
                    }
                );
            },

            //salvo il nuovo docSync
            function(next)
            {
                docSync.lastUpdate = new Date();

                summaries.update(
                    { project : project, username: username } ,
                    docSync,
                    { upsert:true, w:1 },
                    function (err, result) {
                        next(null);
                    }
                );
            },

            //aggiorno il lastUpdate del progetto
            function (next) {
                projects.update(
                    {projectName: project},
                    {$set: { dateLastUpdate: docSync.lastUpdate } }, 
                    { w:1 },
                    function (err, result) {
                        next(null);
                    }
                )
            }
        ],

        function(err){
            connection.close();
            callback(err, docSync);
        }

    );

};


Summary.getStat = function (project, callback) {

    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var summaries   = connection.model( Summary.MODEL_NAME, Summary.SCHEMA);

    summaries.findOne(
        {project: project},
        function(err, doc){
            callback(err, doc);
        }
    );
};

Summary.getStatFilter_bak = function (project, username, query,  callback)
{
    console.log("CALL Summary.getStatFilter of " + project);

    var docSync = {
        project : project,
        username: username,
        lastUpdate: new Date(),
        data: {
            minDate : null,
            maxDate : null,
            syncTags: [],
            allTags: [],
            countSync : 0,
            countTot: 0,
            counter: [],
            nations: []
        }
    };

    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var datas   = connection.model( Datas.MODEL_NAME, Datas.SCHEMA);

    var minDate = new Date(query.start);
    var maxDate = new Date(query.end);

    //itemsSold: { $addToSet: "$item" }

    async.waterfall([

        //prendo i primi campi
        function(next) {

            datas.aggregate([

                {$match: {
                    projectName: project ,
                    $and: [
                        {date: {$gte: minDate}},
                        {date: {$lte: maxDate}}
                    ]
                }},

                {$group: {
                    _id: null,
                    "minDate": {$min: "$date"},
                    "maxDate": {$max: "$date"},
                    "syncTags" :{ $addToSet: "$tag" },
                    countTot: {$sum:1},
                    data: { $push: { nation: "$nation", region: "$region", tag: "$tag" } }
                }}

            ] , function (err, result) {

                if(result[0])
                {
                    docSync.data.minDate = result[0].minDate;
                    docSync.data.maxDate = result[0].maxDate;
                    docSync.data.syncTags = result[0].syncTags;
                    docSync.data.countTot = result[0].countTot
                }
                next(null)
            });
        },

        //prendo il counter totale
        function(next){

            datas.aggregate([

                {$match: {
                    projectName: project ,
                    $and: [
                        {date: {$gte: minDate}},
                        {date: {$lte: maxDate}}
                    ]
                }},

                {$group: {
                    _id: "$tag",
                    count: {$sum:1}
                }},

                {$project:{
                    _id: 0,
                    tag: "$_id",
                    count: 1
                }}

            ] , function (err, result) {

                docSync.data.counter.push(result);

                next(null)

            });
        },

        //prendo il counter delle nazioni
        function(next){

            datas.aggregate([

                {$match: {
                    projectName: project ,
                    $and: [
                        {date: {$gte: minDate}},
                        {date: {$lte: maxDate}}
                    ]
                }},

                {$group: {
                    _id: {nation: "$nation", region: "$region", tag : "$tag" },
                    count: {$sum:1}
                }}

            ] , function (err, result) {

                var ris = {},
                    nation = "",
                    region = "",
                    countSync = 0;

                async.each( result,
                    function (itemregion, next) {

                        nation = itemregion._id.nation;
                        region = itemregion._id.region;

                        if(!nation)
                        {
                            next(null);
                            return;
                        }

                        if(!ris[nation])
                        {
                            ris[nation] = {
                                name: nation,
                                count:0,
                                regions: [],
                                counter: []
                            }
                        }

                        if(!ris[nation].regions[region])
                        {
                            ris[nation].regions[region] = {
                                name: region,
                                count: 0,
                                counter: []
                            }
                        }

                        countSync += itemregion.count;
                        ris[nation].count += itemregion.count;

                        next(null);
                    },

                    function(err)
                    {
                        docSync.data.countSync = countSync;
                        _.each(_.keys(ris), function(nation){
                            docSync.data.nations.push(ris[nation]);
                        });
                        next(null)
                    }
                );
            });
        }

    ], function(err){

        connection.close();
        callback(err, docSync);

    });


};

Summary.getStatFilter = function (project, username, query,  callback)
{
    console.log("CALL Summary.getStatFilter of " + project);

    var docSync = {
        project : project,
        username: username,
        lastUpdate: new Date(),
        data: {
            minDate : null,
            maxDate : null,
            countSync : 0,
            countTot: 0,
            syncTags: {},
            allTags: {},
            counter: {},
            nations: {}
        }
    };

    function _setDate(date)
    {
        if( !docSync.data.minDate )
            docSync.data.minDate = date;
        if( !docSync.data.maxDate )
            docSync.data.maxDate = date;

        if( date < docSync.data.minDate )
            docSync.data.minDate = date;
        if( date > docSync.data.maxDate )
            docSync.data.maxDate = date;
    }

    function setDate(minDate, maxDate)
    {
        _setDate(minDate);
        _setDate(maxDate);
    }

    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var datas   = connection.model( Datas.MODEL_NAME, Datas.SCHEMA);

    var minDate = new Date(query.start);
    var maxDate = new Date(query.end);

    //itemsSold: { $addToSet: "$item" }

    datas.aggregate(
        [
            {$match: {
                projectName: project ,
                $and: [
                    {date: {$gte: minDate}},
                    {date: {$lte: maxDate}}
                ]
            }},

            {$group: {
                _id: {nation: "$nation", region: "$region", tag : "$tag" },
                count: {$sum:1},
                minDate: {$min: "$date"},
                maxDate: {$max: "$date" }
            }}

        ] ,

        function (err, result)
        {
            var nation = "",
                region = "",
                tag = "",
                count = 0

            async.each( result,

                function (item, next) {

                    nation = item._id.nation;
                    region = item._id.region;
                    tag = item._id.tag;
                    count = item.count;

                    //min e max date
                    setDate(item.minDate, item.maxDate);

                    //count tot
                    docSync.data.countTot += item.count;

                    if(!docSync.data.allTags[tag])
                        docSync.data.allTags[tag] = true;

                    if(!nation)
                    {
                        next(null);
                        return;
                    }

                    //count tot
                    docSync.data.countSync += item.count;

                    if(!docSync.data.syncTags[tag])
                        docSync.data.syncTags[tag] = true;

                    //counter
                    if(!docSync.data.counter[tag]) {
                        docSync.data.counter[tag] = {
                            tag: tag,
                            count : 0
                        }
                    }
                    docSync.data.counter[tag].count += count;

                    //nations
                    if(!docSync.data.nations[nation])
                    {
                        docSync.data.nations[nation] = {
                            name: nation,
                            regions: {},
                            count : 0,
                            counter: {}
                        }
                    }

                    docSync.data.nations[nation].count += count;

                    //regions
                    if(!docSync.data.nations[nation].regions[region])
                    {
                        docSync.data.nations[nation].regions[region] = {
                            name: region,
                            count : 0,
                            counter: {}
                        }
                    }
                    docSync.data.nations[nation].regions[region].count += count;

                    //counter
                    if(!docSync.data.nations[nation].regions[region].counter[tag]) {
                        docSync.data.nations[nation].regions[region].counter[tag] = {
                            tag: tag,
                            count : 0
                        }
                    }
                    docSync.data.nations[nation].regions[region].counter[tag].count += count;

                    next(null);
                },

                function(err)
                {
                    docSync.data.allTags = _.keys(docSync.data.allTags);
                    docSync.data.syncTags= _.keys(docSync.data.syncTags);

                    //docSync.data.countSync = countSync;
                    //_.each(_.keys(ris), function(nation){
                    //    docSync.data.nations.push(ris[nation]);
                    //});

                    connection.close();

                    callback(err, docSync);

                }
            );
        }
    );
};



module.exports = Summary;

