"use strict";

var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var converter = require('../controller/converterCtrl');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var tm = require("text-miner");
var Util = require("../controller/nodeUtil");

//var ERROR = function() {
//    return {
//        status: 0,
//        message: ''
//    };
//};

/**
 * Model data
 * @param {SCHEMA[]} data
 * @constructor
 */
var Data = function (data) {
    this.data = data;
};

Data.ResultFile = {
    success: 0,
    fail: 0
};

Data.MODEL_NAME = "datas";

Data.SCHEMA = new Schema(
    {
        projectName: {type: String, required: true},
        id: {type: String, required: true},
        date: Date,
        latitude: Number,
        longitude: Number,
        loc: {
            type: String,
            coordinates: []
        },
        source: String,
        text: {type: String, required: true},
        user: String,
        tag: String,
        nation : String,
        region: String,
        tokens: [String]
    },
    { strict: false }
);
//Data.SCHEMA.index({ loc: '2dsphere' });

Data.projectName = null;

/**
 * JSON of Data object
 * @type {{}}
 */
Data.prototype.data = {};

/**
 *
 * @param type {String} - "csv" || "json"
 * @param file - name
 * @param projectName {String}
 * @param cb_ris - callback({Error},{Result})
 */
Data.importFromFile = function (type, file, projectName, cb_ris)
{
    async.waterfall([

            // 1) leggo il file
            function (cb_wf) {

                console.log("  1) leggo il file " + file);

                fs.readFile(file,'utf8',  function (err, data) {

                    if (err) {
                        cb_wf(err);

                    } else {
                        cb_wf(null, data);
                    }
                });

            },

            // 2) converto il file
            function (data, cb_wf) {

                console.log("  2) controllo il tipo di " + file + " in json");
                console.log("     fileLenght: " + data.length);

                if (type == "csv") {
                    console.log("     converto il file in json");

                    converter.csvToJson(data, function (jsonData) {
                        if (jsonData)
                            cb_wf(null, jsonData);
                        else
                            cb_wf({status: 2, message: "Invalid json"});
                    });
                }

                else
                    cb_wf(null, JSON.parse(data));

            },

            // 3) salvo il file json
            function (jsonData, cb_wf)
            {

                console.log("  3) salvo il json: length" + jsonData.length);

                addDataArray(jsonData, projectName, function (err, result) {
                    //non da mai errore, ma result
                    if (err) {
                        console.log("     errore salvataggio file: " + file);
                        console.log("     err: " + err);
                        cb_wf(err);

                    } else {
                        cb_wf(null, result);
                    }

                });
            }],

        // Funzione di errore di waterfall
        function (err, result) {

            var ris = {
                success: result.success.length,
                fail: result.fail.length
            };

            if (err)
            {
                console.log("ERROR WATERFALL Data");
                console.log("   Err: " + err);
                cb_ris(err, null);
            }
            else
            {
                cb_ris(null, ris);
            }
        }
    );

};

Data.getDatas = function (projectName, query, callback)
{
    //query.limit = 50;

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var exec = datas.find({projectName: projectName});

    exec = Util.addWhereClause(exec, query);

    exec.exec(function (err, docs) {

        _.each(docs, function(doc){
            if(doc["nation"] == null) {
                doc["nation"] = "-";
                doc["region"] = "-";
            }
            delete doc._doc["_id"];
        });

        callback(err, docs);
        connection.close();
    });
};

Data.getDataFilter = function (projectName, query, callback)
{
    //query.limit = 50;

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    async.parallel({

        data: function(next)
        {
            var exec = datas.find({projectName: projectName});

            exec = Util.addWhereClause(exec, query);

            exec.exec(function (err, docs) {

                _.each(docs, function(doc){
                    if(doc["nation"] == null) {
                        doc["nation"] = "-";
                        doc["region"] = "-";
                    }
                    delete doc._doc["_id"];
                });
                next(null, docs);
            });
        },
        count: function(next)
        {
            var exec = datas.find({projectName: projectName});

            exec = Util.addWhereClause(exec, query);

            exec.count(function(err, count){
                next(null, count);
            });
        }
    },function(err, result){
        connection.close();
        callback(err, {count: result.count, data: result.data });
    });

};

/**
 *
 * @param projectName {String}
 * @param callback {function(ERROR, Array)} callback - The callback that handles the response
 */
Data.loadTags = function (projectName, callback)
{
    MongoClient.connect(url, function (err, db) {
        var datas = db.collection('datas');
        datas.distinct("tag", {projectName: projectName}, function (err, array) {
            db.close();
            if (err)
                callback(err, null);
            else
                callback(null, array);
        });
    });
};

Data.getUsers = function(projectName, par, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);
    if(!par) par = {};

    //sort=name&order=desc&limit=10&offset=0&_=1435244766146

    //

    var query = datas.aggregate()
        .match({
            projectName: projectName
        })
        .group({
            "_id": {
                u:"$user",
                t:"$tag",
                isGeo: {$gt:["$latitude", null] }
            },
            "sum": {"$sum": 1}
        })
        .group({
            _id: { u:"$_id.u", t:"$_id.t" },
            sum: { $sum:"$sum"},
            counter: { $push:{ isGeo: "$_id.isGeo", sum: "$sum" }}
        })
        .project({
            _id:0,
            user:"$_id.u",
            counter:1,
            sum: 1
        });

    // ordinamento di default
    if( !par.sort ){ par.sort = "sum"; par.order = "desc"; }

    var sort = par.sort;
    if(par.order)
        sort = par.order == "desc" ? "-" + sort : sort;

    query.sort(sort);

    if( par.limit )
        query.limit( parseInt(par.limit) );

    query.exec( function(err, docs){
        connection.close();
        callback(err, docs);
    });
};

Data.getUserData = function( project , query, callback){

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var users = [];
    if(query.users != null) users = query.users.split(',');

    var exec = datas.aggregate()
        .match({projectName: project, user: {$in:users}})
        .group({
            _id:"$user",
            data:{$push:{
                text:"$text",
                region:"$region",
                nation:"$nation",
                date:"$date",
                tag:"$tag",
                tokens:"$tokens"
            }}
        })
        .project({data:1, _id:0, user:"$_id"})
        .exec(function(err, result){
            callback(err, result);
            connection.close();
        })
};

/**
 *
 * @param arrayData
 * @param projectName
 * @param callback({Error},{Result})
 */
function addDataArray(arrayData, projectName, callback) {

    try {

        //var connection = mongoose.createConnection('mongodb://localhost/oim');
        //var DataModel = connection.model(Data.MODEL_NAME, Data.SCHEMA);
        var cont = 0;
        var url = 'mongodb://localhost:27017/oim';
        MongoClient.connect(url, function (err, db)
        {
            if (err != null) {
                callback(err);
                return;
            }

            console.log("START EACH addDataArray");

            var dataCollection = db.collection('datas');
            var result =
            {
                success: [],
                fail: []
            };

            async.forEach(arrayData,

                function (data, cb_each) {

                    cont++;

                    //applico il lower case a tutte le chiavi
                    var keys = Object.keys(data);
                    for (var k = 0; k < keys.length; k++) {
                        var key = keys[k];
                        if (key != key.toLowerCase()) {
                            data[key.toLowerCase()] = data[key];
                            delete data[key];
                        }
                    }

                    //aggiungo il project name
                    data.projectName = projectName;
                    data.id = data.id.toString();

                    //data.loc = {
                    //    type: "Point",
                    //    coordinates:[data.longitude, data.latitude]
                    //};
                    data.loc = {
                        type: "Point",
                        coordinates: [data.longitude, data.latitude]
                    };

                    data.date = new Date(data.date);

                    dataCollection.save(data,
                        function (err) {
                            if (err)
                                result.fail.push(err);

                            else
                                result.success.push(true);

                            cb_each(null);
                        }
                    );
                },

                function (err) {
                    if (err) {
                        console.error("ERROR addDataArray at row: " + cont);
                        console.error(JSON.stringify(err));
                        callback(err, result);
                    }
                    else {
                        console.log("END EACH addDataArray - cont=" + cont);
                        callback(null, result);
                    }
                }
            );

        });
    }
    catch (e) {
        console.error("Data EXCEPTION: add DataArray");
        console.error(e);
        console.error(e.stack);
    }
}

function getSteps(steps, tot){
    var ris = [];
    for(var i = 1; i <= steps; i++) {
        ris.push( Math.ceil(tot * (i / steps)) )
    }
    return ris;
}

// Sovrascrivo i token in data
Data.overrideTokensData = function (project, res, callback) {

    /**
     * Sincronizzo il vocabolario con i token inseriti dall'utente e i token
     * calcolati automaticamente (datas.tokens)
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var contSave = 0;
    var contStem = 0;
    var tot = 0;
    var steps = [];

    res.write("Get data<br>");

    datas.find({projectName:project}, function(err, docs){

        tot = docs.length;
        steps = getSteps(50, tot);

        res.write("Filter " + tot + " documents<br>");

        async.each(docs, function(doc, next){

            var text = Data.cleanText(doc.text);

            var corpus = new tm.Corpus(text);

            corpus.toLower()
                .removeNewlines()
                .removeDigits()
                .removeInvalidCharacters()
                .removeInterpunctuation()
                .removeWords(tm.STOPWORDS.IT)
                .clean();

            var terms = _.filter( tm.Terms(corpus).vocabulary, function(item){

                //return true;
                //if( /^rt$/  .test(item) ) return false;
                if( /^http/ .test(item) ) return false;
                if( /^@/    .test(item) ) return false;
                if( /^co\//    .test(item) ) return false;
                if( /^&quot/    .test(item) ) return false;
                if( /^\/\//    .test(item) ) return false;
                if( /^.$/    .test(item) ) return false;
                if( item.length <=2 ) return false;

                return true;
            });

            contStem++;
            printPercentage( steps, contStem, res );

            doc.update({$set:{tokens:terms}}, function(){

                contSave++;
                printPercentage( steps, contSave, res );

                next(null);
            });

        }, function(err){
            callback(err);
        });
    });

    /**
     *
     * @param num - [10|20|30|...|100]
     * @param res
     */

    function printPercentage(steps, cont, res)
    {
        if( steps.indexOf(cont) == -1 ) return;

        var tot = steps[ steps.length -1 ];
        var percentage = Math.ceil( cont / tot * 100 ); //[1-100]
        var width = 50;
        var limit = Math.ceil(width * percentage / 100 );

        var i;
        for(i = 0; i < limit; i++)
            res.write("#");
        for(i = limit; i < width; i++)
            res.write("&nbsp;");
        res.write("&nbsp;" + percentage + "%<br>");
    }

    //
    //async.waterfall([
    //
    //    //prendo tutti i testi
    //    function (next)
    //    {
    //
    //        //{ $limit: 100 },
    //
    //        datas.aggregate(
    //
    //            { $match: { projectName: project } },
    //
    //            { $group: {
    //                _id: "$tag" ,
    //                count: {"$sum": 1} ,
    //                documents:{ $push:{ text:"$text" } }
    //            }},
    //
    //            { $project: {
    //                _id:0,
    //                tag:"$_id",
    //                count: 1,
    //                documents: 1
    //            }}
    //
    //        ).exec (
    //            function (err, doc)
    //            {
    //                next(null, doc);
    //            }
    //        );
    //    },
    //
    //    //tokenizzo
    //    function(docs, next)
    //    {
    //        // x ogni tag
    //        async.each(docs, function(obj, nextDoc)
    //            {
    //                var docTag = {
    //                    tag: obj.tag,
    //                    tags: []
    //                };
    //
    //                // x ogni documento nel tag
    //                async.each(obj.documents,
    //
    //                    function (obj, innerNext)
    //                    {
    //                        var corpus = new textMiner.Corpus([ obj.text ]);
    //
    //                        var wordArr = corpus
    //                            .clean()
    //                            .trim()
    //                            .toLower().removeWords(textMiner.STOPWORDS.IT)
    //                            .clean().documents.map(function(x){
    //                                return x;
    //                            });
    //
    //                        wordArr = wordArr[0].split(' ');
    //
    //                        async.each(wordArr,
    //
    //                            function(wa, next){
    //
    //                                if( wa[0] == '@' )           { next(null); return; }
    //                                if(wa.startsWith('rt'))      { next(null); return; }
    //                                if(wa.startsWith('http'))      { next(null); return; }
    //                                if(docTag.tags[wa] != null ) { next(null); return; }
    //
    //                                docTag.tags[wa] = true;
    //                                next(null);
    //                            },
    //
    //                            function (err) {
    //                                innerNext(null)
    //                            }
    //                        )
    //                    },
    //
    //                    function (err)
    //                    {
    //                        console.log("elaborato tag " + docTag.tag);
    //                        docTag.tags = _.keys(docTag.tags);
    //                        docSync.tags.push(docTag);
    //                        nextDoc(null);
    //                    }
    //                );
    //
    //            },
    //
    //            function(err)
    //            {
    //                next(null) ; //next waterfall
    //            });
    //    },
    //
    //    //salvo il file
    //    function (next) {
    //        vocabularies.update(
    //            {username:username, project: project},
    //            docSync,
    //            { upsert:true, w:1 },
    //            function (err, result) {
    //                next(null);
    //            }
    //        )
    //    }
    //
    //], function(err, result){
    //
    //    connection.close();
    //    callback(null, docSync);
    //
    //});

};

Data.cleanText = function(text){
    text = text.replace(/'/g, ' ');
    text = text.replace(/&quot;/g, '');
    text = text.replace(/:/g, ' ');
    text = text.replace(/\^/g, ' ');
    text = text.replace(/`/g, ' ');
    text = text.replace(/’/g, ' ');
    return text;
};

Data.getNations = function (project, callback) {

    console.log("CALL: Data.getNations");

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model("datas", Data.SCHEMA);

    datas.aggregate([
        {$match: {projectName: project}},
        {
            $group: {
                _id: "$nation",
                sum: {$sum: 1}
            }
        },
        {
            $project: {
                _id: 0,
                nation: {$ifNull: ["$_id", "undefined"]},
                sum: 1
            }
        }
    ], function (err, doc) {
        callback(err, doc)
    });

}

module.exports = Data;
