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

Summary.SCHEMA = new Schema( {
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
            countGeo: Number,
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

/**
 * Restituisce il documento stat memorizato all'interno del database
 * E' piu veloce, ma i risultati non sono in tempo reale
 * @param project
 * @param callback
 */
Summary.getStat = function (project, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var summaries = connection.model(Summary.MODEL_NAME, Summary.SCHEMA);

    summaries.findOne(
        {projectName: project},
        function (err, doc) {
            callback(err, doc);
        }
    );
};

/**
 * Si calcola il documento stat sulla base dei dati memorizzati.
 * E' piu lenta, ma serve per costruire il documento stat da salvare nel db
 * N.B.
 * In fase di debug è utile richiamare /project/stat con un parametro nell'URL in modo tale da richiamare questa funzione.
 * E.S. /project/stat?pippo=1
 * @param project
 * @param username
 * @param query
 * @param callback
 */
Summary.getStatFilter = function (project,username, query, callback)
{
    console.log("CALL Summary.getStatFilter of " + project);

    Datas = require("../model/Data");
    Util = require("../controller/nodeUtil");

    var docSync = {
        projectName: project,
        username: username,
        lastUpdate: new Date(),
        data: {
            minDate: null,
            maxDate: null,
            countSync: 0,
            countTot: 0,
            countGeo: 0,
            syncTags: [],
            allTags: [],
            geoTags: [],
            counter: {},
            nations: {}
        }
    };

    var connection = mongoose.createConnection('mongodb://localhost/oim');

    var datas = connection.model(Datas.MODEL_NAME, Datas.SCHEMA);
    var regions = connection.model(Regions.MODEL_NAME, Regions.SCHEMA);
    var maxRegionCount = 0;
    var maxNationCount = 0;

    //assegno il progetto alla query
    if( !query ) query = {};
    query.projectName = project;

    async.parallel( {

            //ottengo le regioni associate alla nazione. Solo stringhe
            regions: function (callback) {
                regions.aggregate( [
                    { $group: {
                        _id: "$properties.NAME_0",
                        //regions: { $addToSet: "$properties.NAME_1" }
                        regions: { $addToSet: {
                            region: "$properties.NAME_1",
                            baseNorm: "$properties.baseNorm"
                        } }
                    }},
                    {$project: { _id: 0,  nation: "$_id",  regions: 1 }}
                ], function(err, result) {
                    callback(err, result);
                });
            },

            //imposto i counter delle regioni che ha trovato
            docSync: function (callback) {

                var exec = datas.aggregate();

                Util.addMatchClause(exec, query);

                //prende solo i dati sincronizzati (i contatori sono calcolati a parte)
                //exec.match( { nation: {$exists: true} });

                exec.project({
                    nation: 1,
                    region: 1,
                    tag: { $ifNull: [ "$tag", "undefined" ] },
                    date: 1,
                    latitude: 1
                });

                exec.group({
                    _id: {
                        nation: "$nation",
                        region: "$region",
                        tag: "$tag"},
                    count: {$sum: 1}
                });

                exec.exec(
                    function (err, result) {
                        var nation = "",
                            region = "",
                            tag = "",
                            count = 0;

                        async.each(result, function (item, next) {

                                nation = item._id.nation;
                                region = item._id.region;
                                tag = item._id.tag;
                                count = item.count;

                                if (!nation) {
                                    next(null);
                                    return;
                                }

                                //counter TOT
                                if (!docSync.data.counter[tag]) {
                                    docSync.data.counter[tag] = {
                                        tag: tag,
                                        count: 0
                                    }
                                }
                                docSync.data.counter[tag].count += count;

                                //counter tot nations
                                if (!docSync.data.nations[nation]) {
                                    docSync.data.nations[nation] = {
                                        name: nation,
                                        regions: {},
                                        count: 0,
                                        counter: {}
                                    }
                                }
                                docSync.data.nations[nation].count += count;

                                //counter  nations
                                if (!docSync.data.nations[nation].counter[tag]) {
                                    docSync.data.nations[nation].counter[tag] = {
                                        tag: tag,
                                        count: 0
                                    }
                                }
                                docSync.data.nations[nation].counter[tag].count += count;

                                //counter tot regions
                                if (!docSync.data.nations[nation].regions[region]) {
                                    docSync.data.nations[nation].regions[region] = {
                                        name: region,
                                        count: 0,
                                        counter: {}
                                    }
                                }
                                docSync.data.nations[nation].regions[region].count += count;

                                //counter regions
                                if (!docSync.data.nations[nation].regions[region].counter[tag]) {
                                    docSync.data.nations[nation].regions[region].counter[tag] = {
                                        tag: tag,
                                        count: 0
                                    }
                                }
                                docSync.data.nations[nation].regions[region].counter[tag].count += count;

                                //docSync.data.syncTags[tag] = tag;

                                //min e max date
                                //setDate(docSync, item.minDate, item.maxDate);

                                //count tot
                                //docSync.data.countTot += item.count;

                                //count tot
                                //docSync.data.countSync += item.count;

                                next(null);
                            },

                            function (err) {

                                //docSync.data.syncTags = _.keys(docSync.data.syncTags);

                                callback(err, true);
                            }
                        );
                    }
                );
            },

            count: function(callback){

                var arg = {
                    query: query,
                    connection: connection
                };
                Datas.getInfoCount(arg, function(err, result){
                    callback(err, result);
                });
            }
        },

        //Aggiunge le regioni mancanti che non sono state prese (no tweet)
        //Aggiunge le informazioni sul contatore e i tag
        function (err, results) {

            connection.close();

            //imposto i contatori
            //i tag sincronizzati vengono calcolati in docsync
            docSync.data.countTot = results.count.countTot;
            docSync.data.countGeo = results.count.countGeo;
            docSync.data.countSync = results.count.countSync;
            docSync.data.allTags =  results.count.allTags;
            docSync.data.syncTags =  results.count.syncTags;
            docSync.data.geoTags =  results.count.geoTags;
            docSync.data.minDate =  results.count.min;
            docSync.data.maxDate = results.count.max;

            //obj: {region:String, baseIndex: Number}
            async.each(results.regions,  function(obj, next) {

                    //nation == null
                    if(!docSync.data.nations[obj.nation]) {
                        next(null);
                        return;
                    }

                    //calcolo l'avg per la nazione
                    //docSync.data.nations[obj.nation].avg = docSync.data.nations[obj.nation].count / results.max.nation;
                    docSync.data.nations[obj.nation].avg = docSync.data.nations[obj.nation].count;

                    //calcolo l'avg per le regioni e aggiungo le regioni mancanti
                    async.each(obj.regions, function(region, next) {

                        //add empty region
                        if(!docSync.data.nations[obj.nation].regions[region.region]) {
                            docSync.data.nations[obj.nation].regions[region.region] = {
                                name: region.region, count: 0, counter: {}
                            };
                        }

                        docSync.data.nations[obj.nation].regions[region.region].baseNorm = region.baseNorm;

                        //calcolo dell'AVG basato sul min-max

                        var count = docSync.data.nations[obj.nation].regions[region.region].count;

                        //var max = results.max.region
                        docSync.data.nations[obj.nation].regions[region.region].avg = count;

                        //calcolo dell'indice normalizzato
                        docSync.data.nations[obj.nation].regions[region.region].avgWeighed = calculateAvgWeight(region.baseNorm, count);

                        next(null);

                    }, function(err){
                        next(err);
                    })
                }
                , function(err){ //end
                    docSync = normalizationMaxMin(docSync);
                    callback(err, docSync);
                }
            );
        });
};

function _setDate(docSync, date) {
    if (!docSync.data.minDate)  docSync.data.minDate = date;
    if (!docSync.data.maxDate)  docSync.data.maxDate = date;
    if (date < docSync.data.minDate)    docSync.data.minDate = date;
    if (date > docSync.data.maxDate)    docSync.data.maxDate = date;
}

function setDate(docSync, minDate, maxDate) {
    _setDate(docSync, minDate);
    _setDate(docSync, maxDate);
}

function calculateAvgWeight(baseNorm, count){

    //count / ( baseNorm + 1),
    //count / ( Math.log(baseNorm + Math.E ) )

    if( baseNorm != null)
    {
        //console.log('baseNorm: ' + baseNorm);
    }

    var ris = [
        baseNorm == 0 ? 0 : count / baseNorm ,
        baseNorm == 0 ? 0 : count / Math.log(baseNorm + Math.E ),
        baseNorm == 0 ? 0 : Math.log( count / baseNorm + Math.E ),
    ];

    return ris;
}

/**
 * Trova il massimo tra tutte le nazioni e normalizza secondo il min-max
 */
function normalizationMaxMin(docSync){

    //var max = { avg: 0, avgWeighed: [] };
    var maxCountNation = 0;
    var maxCountRegion = 0;
    var maxWeight = [];

    //...per ogni nazione
    _.each(docSync.data.nations, function(nation, key_N){

        //se esiste prenso il massimo per la nazione
        if( nation.count )
            maxCountNation = Math.max(nation.count , maxCountNation);

        //...per ogni regione
        _.each(nation.regions, function(region, key_R){

            //se esiste prendo il massimo per la regione
            if( region.count )
                maxCountRegion = Math.max( region.count, maxCountRegion );

            //la prima volta inizializzo l'array con tutti 0
            if( maxWeight.length == 0)
                for(var i = 0; i < region.avgWeighed.length; i++)
                    maxWeight.push(0);

            //...per ogni indice di media per la regione
            _.each(region.avgWeighed, function(value, index){

                //se esiste prendo il massimo
                if( value )
                    maxWeight[index] = Math.max( maxWeight[index], value );
            });
        });
    });

    //normalizzo
    _.each(docSync.data.nations, function(nation, key_N){
        nation.avg = nation.count / maxCountNation;
        _.each(nation.regions, function(region, key_R){
            region.avg = region.count / maxCountRegion;
            _.each(region.avgWeighed, function(value, index){

                //se esiste, lo normalizzo, altrimenti 0
                if( region.avgWeighed[index] )
                    region.avgWeighed[index] = region.avgWeighed[index] / maxWeight[index];
                else
                    region.avgWeighed[index] = 0;
            });
        });
    });

    return docSync;

}

Summary.updateStat = function(project, username, callback){

    var Datas = require("../model/Data");
    var connection = mongoose.createConnection('mongodb://localhost/oim');

    var datas =     connection.model(Datas.MODEL_NAME, Datas.SCHEMA);
    var summaries = connection.model(Summary.MODEL_NAME, Summary.SCHEMA);
    var query = {projectName: project};

    Datas.getInfoCount( {connection: connection, query:query} , function(err, result){

        summaries.findOne({projectName:project}, function(err, doc){

            var s = null;

            if( doc == null)
                s = new summaries({
                    projectName : project,
                    username : username,
                    data: {
                        syncTags : [],
                        counter :  {},
                        countSync : 0,
                        nations : []
                    }
                });
            else
                s = doc;

            s.lastUpdate = new Date();
            s.data.minDate = result.min;
            s.data.maxDate = result.max;
            s.data.allTags = result.allTags;
            s.data.countTot = result.countTot;
            s.data.countGeo = result.countGeo;

            s.save(function(err, result){
                callback(err);
                connection.close();
            });

        });
    });
};

/**
 *
 * @param arg
 * @param arg.connection
 * @param arg.project
 * @param callback
 */
Summary.setEmptyStat = function(arg, callback){

    var connection =  arg.connection==null ? mongoose.createConnection('mongodb://localhost/oim') : arg.connection;
    var summaries = connection.model(Summary.MODEL_NAME, Summary.SCHEMA);
    summaries.update({projectName:arg.project}, {$set: {
        "lastUpdate" : new Date(),
        "data" : {
            "minDate" : new Date(),
            "maxDate" : new Date(),
            "countSync" : 0,
            "countTot" : 0,
            "allTags" : [ ],
            "syncTags" : [ ]
        }}
    }, function(err, result){
        callback(err, result);
    })
};

module.exports = Summary;