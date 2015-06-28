"use strict";

var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var Regions = require("../model/Regions");
var Datas = require("../model/Data");
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
        data: {
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

Summary.sync = function(project, username,  callback)
{
    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var regions     = connection.model( Regions.MODEL_NAME, Regions.SCHEMA);
    var datas       = connection.model( Datas.MODEL_NAME, Datas.SCHEMA);
    var summaries   = connection.model( Summary.MODEL_NAME, Summary.SCHEMA);
    var dictNations = {};
    var cont = 0;

    var docSync = {
        project : project,
        username: username,
        data: {
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
                regions.find({},
                    function(err, data) {
                        next(err, data);
                    }
                );
            },

            //costruisco il docSync
            function(regions, next) {

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

                        summaries.update(
                            { project : project, username: username } ,
                            docSync,
                            { upsert:true, w:1 },
                            function (err, result) {
                                next(null, regions);
                            }
                        );
                    }

                );
            },

            //cancello la precedente sincronizzazione
            function(regions, next){

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
            function(next){
                datas.distinct("tag", {projectName: project} ,  function(err, result){
                    docSync.data.allTags = result;
                    next(null);
                });
            },

            //conto i dati
            function(next){
                datas.count( {projectName: project} ,  function(err, result){
                    docSync.data.countTot = result;
                    next(null);
                });
            }
        ],

        function(err){
            connection.close();
            callback(err, docSync);
        }

    );

};


Summary.getStat = function (username, project, callback) {

    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var summaries   = connection.model( Summary.MODEL_NAME, Summary.SCHEMA);

    summaries.findOne(
        {project: project, username: username},
        function(err, doc){
            callback(err, doc);
        }
    );
};


module.exports = Summary;