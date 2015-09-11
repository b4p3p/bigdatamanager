"use strict";

String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
};

var url = 'mongodb://localhost:27017/oim';
var _ = require("underscore");
var async = require("async");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Data = require("../model/Data");
var Project = require("../model/Project");
var WaitController = require("../controller/waitController");

var Vocabulary = function(){};

Vocabulary.MODEL_NAME = "vocabularies";

Vocabulary.SCHEMA_COUNT = new Schema({
    token:String,
    count:Number
});

Vocabulary.SCHEMA_TAGS = new Schema({
    tag: String,
    tokens: [String]                                //lista di tutti i tag
});

Vocabulary.SCHEMA_RISSYNC = new Schema({
    tag:String,
    counter:[Vocabulary.SCHEMA_COUNT]
});

Vocabulary.SCHEMA = new mongoose.Schema({
    project: String,
    userTags: [Vocabulary.SCHEMA_TAGS],             //tags custom inseriti dall'utente
    dataTags: [Vocabulary.SCHEMA_TAGS],             //tags inseriti all'interno dei dati
    syncUserTags: [Vocabulary.SCHEMA_RISSYNC],
    syncDataTags: [Vocabulary.SCHEMA_RISSYNC]
});

Vocabulary.insertTags =  function(project, data, callback) {

    console.log("data: " + JSON.stringify(data));

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne( {project: project} , function (err, doc)
    {
        if(doc == null){
            doc = new vocabularies();
            doc.project = project;
        }

        var i = _.findIndex( doc.userTags, function(item){
            return item.tag == data.tag
        });

        if(i == -1)
            if(doc.userTags)
                doc.userTags.push(data);
            else
                doc.userTags = [data];
        else
            doc.userTags[i].tokens = data.tokens;

        if(data.tag == "" ) data.tag = null;

        doc.save(function(err, result){
            connection.close();
            callback(err, result);
        });

    });
};

Vocabulary.renameTag = function(project, data, callback) {

    console.log("data: " + JSON.stringify(data));

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne( {project: project} , function (err, doc){

        if(err) { callback(err.message); return; }

        var i_new = _.findIndex( doc.userTags, function(item){
            return item.tag == data.newTag
        });

        if(i_new > -1) { callback("Tag already exists"); return; }

        var i_old = _.findIndex( doc.userTags, function(item){
            return item.tag == data.oldTag
        });

        doc.userTags[i_old].tag = data.newTag;

        doc.save(function (err) { callback(err); });

    });
};

Vocabulary.deleteTag = function(project, tag, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne( {project: project} , function (err, doc)
    {
        var i = _.findIndex( doc.userTags, function(item){
            return item.tag == tag
        });

        doc.userTags.splice(i, 1);

        doc.save(function(err){
            callback(err)
        });
    });
};

Vocabulary.renameWords = function(project, data, callback) {

    data.words = data.words.split(",");
    data.words = _.map(data.words, function(item){return item.trim()});

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne( {project: project} , function (err, doc)
    {
        var i = _.findIndex( doc.userTags, function(item){
            return item.tag == data.tag
        });
        doc.userTags[i].tokens = data.words;
        doc.save(function(err){
            connection.close();
            callback(err);
        })
    });
};

Vocabulary.getVocabulary = function(project, callback) {

    /**
     * Sincronizzo il vocabolario con i token inseriti dall'utente e i token
     * calcolati automaticamente (datas.tokens)
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    vocabularies.findOne(
        {project: project} ,
        function (err, doc) {
            connection.close();
            callback(err, doc);
        }
    )
};

/// EFFETTUA LA SINSCRONIZZAZIONE INSERENDO I COUNTER

function updateProjects(docs, connection, project, next) {

    var Project = require("../model/Project");

    var projects = connection.model(Project.MODEL_NAME, Project.SCHEMA);
    projects.update(
        { projectName: project },
        { $set: {dateLastUpdate: new Date()} },
        { w:1 }, function (err) {
            next(err, docs);
        }
    );
}

/**
 * Sincronizzo SOLO i tokens presenti nella collections data
 * La funzione è asincrona, si usa socket.io
 */
Vocabulary.syncUserTags = function (project, app, callback) {

    var Data = require('../model/Data');

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    vocabularies.findOne( {project: project}, {userTags:1, _id:0}, function(err, doc){

        if(doc == null)
        {
            app.io.emit("syncUserTags_msg", 'Create new document');
            doc = new vocabularies();
            doc.project = project;
        }

        var dict = {};
        app.io.emit("syncUserTags_msg", 'Get userTags');

        _.each(doc.userTags, function(item){
            var tag = item.tag == "" || item.tag == null ? null : item.tag;
            dict[tag] = { tag: tag, tokens: item.tokens };
        });

        app.io.emit("syncUserTags_msg", 'Update vocabulary');

        Vocabulary.prepareUserTags( project, app, dict, datas, function(err, docs) {
            vocabularies.update(
                { project: project },
                { $set: {
                    project: project,
                    syncUserTags: docs }
                } ,
                { w:1, upsert: true },
                function (err) {
                    if(!err)
                    {
                        app.io.emit("syncUserTags_msg", 'Update project');
                        updateProjects(docs, connection , project,  callback);
                    }
                    else
                    {
                        app.io.emit("syncUserTags_msg", 'Error: ' + err.toString());
                        callback(err, {} );
                    }
                }
            );
        })
    })

};

/**
 * Funzione per sincronizzare ed effettuare il word count dei tokens presenti nei dati
 * La funzione è asincrona, si usa socket.io
 * @param project
 * @param query
 * @param app
 * @param callback
 */
Vocabulary.syncDataTags = function (project, query, app, callback) {

    /**
     * Sincronizzo SOLO i tokens presenti in user tags in vocabularies
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    Vocabulary.prepareDataTags(project, query, app, function(err, docs){

        app.io.emit("syncDataTags_msg", "Update vocabulary");
        console.log("Update vocabulary");

        var dataTags = _.map(docs, function(item){
            var tokens = _.map(item.counter, function(item){
                return item.token;
            });
            return {
                tag: item.tag,
                tokens: tokens
            }
        });

        vocabularies.update(
            { project: project },
            { $set: {
                project: project,
                syncDataTags: docs,
                dataTags: dataTags} },
            { w:1, upsert: true },
            function (err) {
                if(!err)
                {
                    app.io.emit("syncDataTags_msg", "Update project");
                    updateProjects(docs, connection , project,  callback);
                }
                else
                {
                    app.io.emit("syncDataTags_msg", "Error: " + err.toString());
                    callback(err, null);
                }
            }
        );
    });
};

function convertPrepareRis(tmpRis){
    var arrayRis = [];
    _.each(tmpRis, function(item){
        var counter = [];
        _.each(item.counter, function(item){
            counter.push(item);
        });
        arrayRis.push({tag: item.tag, counter: counter});
    });
    return arrayRis;
}

function limitConvertResult(arrayRis, num){
    //ordino e limito i risultati
    _.each(arrayRis, function(item, index){
        arrayRis[index].counter = _.sortBy(item.counter, 'count').reverse();
        arrayRis[index].counter = arrayRis[index].counter.slice(0,num);
    });
    return arrayRis;
}

/// LEGGE I TOKENS DA DATAS E COSRUISCE I DOCSYNC E  DATATAGS IN VOCABULARY

Vocabulary.prepareDataTags = function(project, query, app, callback) {

    var Data = require('../model/Data');

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    app.io.emit("syncDataTags_msg", "Fetch data");
    console.log("Fetch data");

    var wait = new WaitController(app, "syncDataTags_msg");
    wait.start();

    var ris = {};

    datas.find({projectName:project},{text:1, tag:1, tokens:1}, function(err, docs){
        wait.stop();

        app.io.emit("syncDataTags_msg", "Group data");

        async.each(docs, function(doc, next){

            //fix tag null
            var tag = doc.tag;
            if(doc["tag"]==null||doc.tag=="null"||doc.tag=="undefined") tag = null;

            if(ris[tag]==null){
                ris[tag] = {tag: tag, counter: {} };
                app.io.emit("syncDataTags_msg", "Found " + tag);
            }

            //prepare data text
            var arrayText = Data.cleanText(doc.text).split(' ');

            //calcolo il counter dai token presenti nel documento
            _.each(doc.tokens, function(token){
                var count = _.reduce(arrayText, function(memo, item){
                    if( item.toLowerCase() == token )
                        return memo + 1;
                    else
                        return memo;
                }, 0);

                if(ris[tag].counter[token] == null)
                    ris[tag].counter[token] = {token:token, count:0};
                ris[tag].counter[token].count++;
            });

            next(null);

        },function(err){
            var arrayRis = convertPrepareRis(ris);
            arrayRis = limitConvertResult(arrayRis, 30);
            callback(err, arrayRis);
        });
    });
};

Vocabulary.prepareUserTags = function(project, app, dict, datas, callback){

    var Data = require('../model/Data');

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    app.io.emit("syncUserTags_msg", "Fetch data");

    //comincia  astampare puntini ...
    var wait = new WaitController(app, "syncUserTags_msg");
    wait.start();

    //fix dict
    _.each(dict, function(tag){
        tag = tag.tag;
        dict[tag].counter = {};
        _.each(dict[tag].tokens, function(token) {
            dict[tag].counter[token] = {token:token, count:0};
        });
    });
    delete dict["tokens"];

    datas.find({projectName:project},{text:1, tag:1, tokens:1}, function(err, docs){

        wait.stop();
        app.io.emit("syncUserTags_msg", "Group data");

        async.each(docs, function(doc, next){

            //fix tag null
            var tag = doc.tag;
            if(doc["tag"]==null||doc.tag=="null"||doc.tag=="undefined") tag = null;

            if(dict[tag]==null){
                dict[tag] = {tag: tag, counter: {} };
                app.io.emit("syncUserTags_msg","Found " + tag);
            }

            //prepare data text
            var arrayText = Data.cleanText(doc.text).split(' ');

            //calcolo il counter prendendo il dizionario dell'utente
            _.each(arrayText, function(word){
                if(dict[tag]['counter'][word] != null)
                    dict[tag]['counter'][word].count ++;
            });

            next(null);

        }, function(err){
            var arrayRis = convertPrepareRis(dict);
            arrayRis = limitConvertResult(arrayRis, 30);
            callback(err, arrayRis);
        })

    });
};

/// LEGGE DA USERTAGS IN VOCABULARY E CREA IL DOCSYNC
Vocabulary.prepareUserTags__ = function(project, res, dict, datas, callback){

    res.write("Perform mapReduce function<br>");

    var fn =
    {
        map: function () {

            for(var tag in dict)
            {
                var tokens = dict[tag].tokens;
                var arr = this.text.split(' ');
                tokens.forEach( function(token){
                    var filter = arr.filter( function(item){
                        return item.toLowerCase() == token.toLowerCase();
                    });
                    var len = filter.length;
                    if( len > 0 ) emit( { tag: tag, token:token }, len );
                })
            }
        },
        reduce: function(key, values) {
            var count = 0;
            values.forEach( function(v) {
                count += v;
            });
            return count;
        },
        query: { projectName: project },
        out: { replace: 'word_count' },
        scope: { dict: dict },
        verbose: true
    };

    datas.mapReduce( fn , function (err, model, stats) {
        console.log('mapReduce took %d ms', stats.processtime);
        res.write('mapReduce took ' + stats.processtime / 1000 + ' s<br>');
        model.aggregate( [
            {$project:{ _id:0, key:"$_id", count: "$value" }},
            {$sort:{count:-1}},  {$limit:50},
            {$group:{ _id:"$key.tag", counter: {$push: { token: "$key.token", count: "$count" }} }},
            {$project:{ _id:0, counter:1, tag:"$_id" }}
        ], function(err, docs){
            callback(docs);
        })
    });

};


/// SOLO VISUALIZZAZIONE ///

Vocabulary.getUserTags = function (project, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne({project:project},{userTags:1, _id:0 },  function(err, doc){

        var ris = [];

        if(doc!=null)
        _.each(doc.userTags, function(item){
            ris.push({
                tag: item.tag,
                tokens: item.tokens
            });
        });

        callback(null, ris);
    });
};

Vocabulary.getDataTags = function (project, callback) {
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne({project:project},{dataTags:1, _id:0 },  function(err, doc){

        var ris = [];

        if(doc!=null)
            _.each(doc.dataTags, function(item){
                ris.push({
                    tag: item.tag,
                    tokens: item.tokens
                });
            });

        callback(null, ris);
    });
};

Vocabulary.getWordCount = function(project, callback){

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne(
        {project:project},
        {_id:0, syncUserTags:1, syncDataTags:1 },
        function(err, doc) {

            var ris = {};

            if(doc!=null) {
                ris = appendxxxxTags(doc.syncDataTags, "syncDataTags", ris);
                ris = appendxxxxTags(doc.syncUserTags, "syncUserTags", ris);
            }
            else {
                ris["syncDataTags"] = [];
                ris["syncUserTags"] = [];
            }

            connection.close();
            callback(err, ris);
        }
    );
};

function appendxxxxTags(tags , section, ris){
    ris[section] = {};
    _.each(tags, function(item, key){
        var tag = item.tag;
        ris[section][tag] = [];
        _.each(item.counter, function(item, key){
            ris[section][tag].push({token:item.token, count:item.count});
        });
    });
    return ris;
}

module.exports = Vocabulary;

//Vocabulary.getWordCount__ = function(project, query,  callback)
//{
//    var connection = mongoose.createConnection('mongodb://localhost/oim');
//    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
//    var result = {};
//
//    vocabularies.aggregate(
//
//        { "$match": {
//            "project": project
//        }} ,
//
//        { "$unwind": "$tags" },
//
//        { "$group": {
//            "_id": "$tags.tag" ,
//            "count" : { $push: "$tags.count" }
//        }},
//
//        { "$project" : {
//
//            _id : 0,
//                tag : "$_id",
//                count: 1
//        }} ,
//
//        { "$unwind": "$count" },
//
//        { $sort : { "count.c" : 1 } } ,
//
//        function (err, doc) {
//
//            for(var i = 0; i < doc.length; i++)
//            {
//                var limit = 10;
//                var tmpRis = [];
//                for(var d = 0; d < doc[i].count.length && d < limit; d++){
//                    tmpRis.push(doc[i].count[d]);
//                }
//                result[doc[i].tag] = tmpRis;
//            }
//
//            callback(err, result );
//
//        }
//    );
//};