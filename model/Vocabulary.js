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


// CHIAMA syncCustomTags E syncTokensData

Vocabulary.syncVocabulary = function (project, username,  callback) {

    /**
     * Sincronizzo il vocabolario con i token inseriti dall'utente e i token
     * calcolati automaticamente (datas.tokens)
     */

    var docSync = {
        username: username,
        project: project,
        userTags: [],
        tags: []
    };

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);
    //

    async.waterfall([

        //prendo tutti i testi
        function (next)
        {

            //{ $limit: 100 },

            datas.aggregate(

                { $match: { projectName: project } },

                { $group: {
                    _id: "$tag" ,
                    count: {"$sum": 1} ,
                    documents:{ $push:{ text:"$text" } }
                }},

                { $project: {
                    _id:0,
                    tag:"$_id",
                    count: 1,
                    documents: 1
                }}

            ).exec (
                function (err, doc)
                {
                    next(null, doc);
                }
            );
        },

        //tokenizzo
        function(docs, next)
        {
            // x ogni tag
            async.each(docs, function(obj, nextDoc)
            {
                var docTag = {
                    tag: obj.tag,
                    tags: []
                };

                // x ogni documento nel tag
                async.each(obj.documents,

                    function (obj, innerNext)
                    {
                        var corpus = new textMiner.Corpus([ obj.text ]);

                        var wordArr = corpus
                            .clean()
                            .trim()
                            .toLower().removeWords(textMiner.STOPWORDS.IT)
                            .clean().documents.map(function(x){
                            return x;
                        });

                        wordArr = wordArr[0].split(' ');

                        async.each(wordArr,

                            function(wa, next){

                                if( wa[0] == '@' )           { next(null); return; }
                                if(wa.startsWith('rt'))      { next(null); return; }
                                if(wa.startsWith('http'))      { next(null); return; }
                                if(docTag.tags[wa] != null ) { next(null); return; }

                                docTag.tags[wa] = true;
                                next(null);
                            },

                            function (err) {
                                innerNext(null)
                            }
                        )
                    },

                    function (err)
                    {
                        console.log("elaborato tag " + docTag.tag);
                        docTag.tags = _.keys(docTag.tags);
                        docSync.tags.push(docTag);
                        nextDoc(null);
                    }
                );

            },

            function(err)
            {
                next(null) ; //next waterfall
            });
        },

        //salvo il file
        function (next) {
            vocabularies.update(
                {username:username, project: project},
                docSync,
                { upsert:true, w:1 },
                function (err, result) {
                    next(null);
                }
            )
        }

    ], function(err, result){

        connection.close();
        callback(null, docSync);

    });

};


/// EFFETTUA LA SINSCRONIZZAZIONE INSERENDO I COUNTER

function updateProjects(docs, connection, project, next) {
    var projects = connection.model(Project.MODEL_NAME, Project.SCHEMA);
    projects.update(
        { projectName: project },
        { $set: {dateLastUpdate: new Date()} },
        { w:1 }, function (err) {
            next(err, docs);
        }
    );
}

Vocabulary.syncUserTags = function (project,  callback) {

    /**
     * Sincronizzo SOLO i tokens presenti nella collections data
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    vocabularies.findOne({project: project}, {userTags:1, _id:0}, function(err, doc){

        var dict = {};

        _.each(doc.userTags, function(item){
            var tag = item.tag == "" || item.tag == null ? null : item.tag;
            dict[tag] = { tag: tag, tokens: item.tokens };
        });

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
            query: {
                projectName: project
            },
            out: {
                replace: 'word_count'
            },
            scope: { dict: dict },
            verbose: true
        };

        datas.mapReduce( fn , function (err, model, stats) {
            console.log('map reduce took %d ms', stats.processtime);
            model.aggregate([
                {$project:{
                    _id:0,
                    key:"$_id",
                    count: "$value"
                }},
                {$sort:{count:-1}},
                {$limit:50},
                {$group:{
                    _id:"$key.tag",
                    counter: {$push: { token: "$key.token", count: "$count" }}
                }},
                {$project:{
                    _id:0,
                    counter:1,
                    tag:"$_id"
                }}
            ], function(err, docs){

                vocabularies.update(
                    { project: project },
                    { $set: {
                        project: project,
                        syncUserTags: docs }
                    } ,
                    { w:1, upsert: true },
                    function (err) {
                        if(!err)
                            updateProjects(docs, connection , project,  callback);
                        else
                            callback(err, {} );
                    }
                );
            })
        });
    })

};

Vocabulary.syncDataTags = function (project, query,  callback) {

    /**
     * Sincronizzo SOLO i tokens presenti in user tags in vocabularies
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    Vocabulary.prepareDataTags(project, query, function(err, docs){

        async.parallel( [

            //salvo il documento in vocabulary
            function(next){
                vocabularies.update(
                    { project: project },
                    { $set: {
                        project: project,
                        syncDataTags: docs }
                    } ,
                    { w:1, upsert: true },
                    function (err) {
                        if(!err)
                            updateProjects(docs, connection , project,  next);
                        else
                            next(err);
                    }
                )
            },

            //salvo solo i data tokens
            function(next){
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
                        dataTags: dataTags
                    }},
                    { w:1, upsert: true },
                    function (err) {
                        next(err);
                    }
                )
            }

        ], function (err, result) {
            callback(err, docs)
        });

    });
};


/// LEGGE I TOKENS DA DATAS E COSRUISCE I DATA TAGS IN VOCABULARY

Vocabulary.prepareDataTags = function(project, query, callback){

    /**
     * Costruisco il documento per la sincronizzazione dei token presenti
     * in datas
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var fn =
    {
        map: function () {
            var arr = this.text.split(' ');
            this.tokens.forEach( function(token){
                var tag = this.tag ? this.tag : null;
                var filter = arr.filter( function(item){
                    return item.toLowerCase() == token.toLowerCase();
                });
                var len = filter.length;
                if( len > 0 ) emit( { tag: tag, token:token }, len);
            })
        },
        reduce: function(key, values) {
            var count = 0;
            values.forEach( function(v) {
                count += v;
            });
            return count;
        },
        query: {
            projectName: project
        },
        out: {
            replace: 'word_count'
        },
        verbose: true
    };

    datas.mapReduce( fn , function (err, model, stats) {
        console.log('map reduce took %d ms', stats.processtime);
        model.aggregate([
            {$project:{
                _id:0,
                key:"$_id",
                count: "$value"
            }},
            {$sort:{count:-1}},
            {$limit:50},
            {$group:{
                _id:"$key.tag",
                counter: {$push: { token: "$key.token", count: "$count" }}
            }},
            {$project:{
                _id:0,
                tag:"$_id",
                counter:1
            }}
        ], function(err, docs){
            connection.close();
            callback(null, docs);
        });
    } )
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
            ris = appendxxxxTags(doc.syncDataTags, "syncDataTags", ris);
            ris = appendxxxxTags(doc.syncUserTags, "syncUserTags", ris);
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