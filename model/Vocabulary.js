"use strict";

String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
};

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';

var _ = require("underscore");
var async = require("async");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var textMiner = require( 'text-miner' );
var Data = require("../model/Data");

var connection = null;
var Model = null;

var Vocabulary = {

    /**
     *
     * @param projectName
     * @param callback - fn({Error},{data})
     */
    getTags: function(projectName, callback)
    {
        MongoClient.connect(url, function (err, db) {
            var vocabularies = db.collection('vocabularies');
            vocabularies.find({projectName:projectName}).toArray( function(err, doc) {
                db.close();
                callback(err, doc);
            });
        });
    },

    /**
     *
     * @param projectName
     * @param data - {tag:{String}, words: [{String}]
     * @param callback - fn({Error})
     */
    insertTags: function(projectName, data, callback)
    {
        console.log("data: " + JSON.stringify(data));

        var connection = mongoose.createConnection('mongodb://localhost/oim');
        var Model = connection.model(MODEL_NAME, VOCABULARY_SCHEMA);
        data.projectName = projectName;
        Model.update(
            {tag: data.tag},
            data,
            {upsert: true},
            function(err){
                callback(err);
            });
    },

    renameTag: function(projectName, data, callback)
    {
        MongoClient.connect(url, function (err, db)
        {
            var Collection = db.collection('vocabularies');
            Collection.findOneAndDelete({tag:data.oldTag}, function(err, doc){
                if( err != null)
                    callback(err);
                else
                    _renameTag(doc.value, data, db, Collection, callback);
            });
        });
    },

    deleteTag: function(projectName, tag, callback)
    {
        console.log("CALL: Vocabulary.deleteTag tag:" + tag);
        connection = mongoose.createConnection('mongodb://localhost/oim');
        Model = connection.model(MODEL_NAME, VOCABULARY_SCHEMA);
        Model.remove({tag:tag}, function(err){
            callback(err);
        });
    },

    renameWords: function(projectName, data, callback)
    {
        data.words = data.words.split(",");
        for(var w in data.words)data.words[w] = data.words[w].trim();
        connection = mongoose.createConnection('mongodb://localhost/oim');
        Model = connection.model(MODEL_NAME, VOCABULARY_SCHEMA);
        Model.update(
            {tag:data.tag},
            {$set: { words: data.words} },
            function(err)
            {
                connection.close();
                callback(err);
            }
        );
    },

    /**
     *
     * @param projectName
     * @param callback - fn({Error}, {tags})
     */
    refreshCounter: function(projectName, callback)
    {
        connection = mongoose.createConnection('mongodb://localhost/oim');
        var Data = require("../model/Data");
        var ModelVocabulary = connection.model(MODEL_NAME, VOCABULARY_SCHEMA);
        var ModelData = connection.model(Data.MODEL_NAME, Data.SCHEMA);
        var _ = require('underscore');

        async.waterfall([

                //prendo il vocabolario formattato come un dizionario
                function(next){
                    ModelVocabulary.find({projectName:projectName},{"words":1, "tag":1}
                    ).lean().exec( function(err, tags)
                        {
                            tags = formatTag(tags);

                            //doc = doc.map( function(doc) { return doc.doc; });
                            //console.log("CALL refreshCounter: doc is " + JSON.stringify(doc));
                            if(err != null)
                                next(err);
                            else
                                next(null, tags, projectName)
                        });
                },

                //prendo i dati del progetto
                function(tags, projectName, next){

                    ModelData.find( { projectName: projectName } , {text:1},
                        function(err, doc)
                        {
                            next(null, doc, projectName, tags);
                        });
                },

                //conto le occorrenze dei tag
                function(datas, projectName, tags, next){

                    //var ris = tags;
                    async.each(datas,
                        function(row, each) {
                            tags = updateTags( row.text , tags );
                            each(null);
                        },
                        function(err) {
                            next(err, tags);
                        });
                },

                //salvo i dati ottenuti nella collection vocabulary
                function(tags, next){

                    var arrayTag = [];
                    for(var t in tags) arrayTag.push(t);

                    MongoClient.connect(url, function (err, db) {
                        var vocabularies = db.collection('vocabularies');
                        async.each(arrayTag,
                            function(tag, each)
                            {
                                var updateData = _.clone(tags[tag]);
                                vocabularies.update(
                                    {tag: tag},
                                    {$set: {counter: updateData}},
                                    function (err) {
                                        each(err);
                                    }
                                );
                            },
                            function(err)
                            {
                                db.close();
                                next(err, tags);
                            }
                        );
                    });
                }
            ],
            function(err, ris){
                connection.close();
                callback(err, ris);
            }
        );
    }
};

Vocabulary.MODEL_NAME = "vocabularies";

Vocabulary.SCHEMA_COUNT = new Schema({
    w:String,
    c:Number
});

Vocabulary.SCHEMA_TAGS = new Schema({
    tag: String,
    tags: [String],                     //lista di tutti i tag
    count: [Vocabulary.SCHEMA_COUNT]    //risultati dell'indice text
});

Vocabulary.SCHEMA = new mongoose.Schema({
    project: String,
    username: String,
    userTags: [Vocabulary.SCHEMA_TAGS],
    tags: [Vocabulary.SCHEMA_TAGS]
});

Vocabulary.sync = function (project, username,  callback)
{

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

Vocabulary.syncWordCount = function (project, username,  callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var counter = {};

    async.waterfall( [

        //calcolo il counter
        function(next)
        {
            vocabularies.find(
                {username:username, project:project},
                function(err, doc)
                {
                    var tags = doc[0].tags;

                    //ogni tag
                    async.each( tags ,

                        function(tagObj, nextTag)
                        {
                            counter[tagObj.tag] = [];

                            async.each( tagObj.tags,

                                function(word, nextWord)
                                {

                                    datas.find(
                                        { $text: {
                                            $search: word, $language: "it" }
                                        }
                                    ).count(
                                        function(err, result){

                                            if( result > 0)
                                            {
                                                counter[tagObj.tag].push( { w:word, c: result });
                                            }

                                            nextWord(null);

                                        }
                                    );

                                },

                                function(err)
                                {
                                    nextTag(null);
                                }
                            )
                        },
                        function(err)
                        {
                            next(null)
                        }
                    );
                }
            );
        },

        //aggiorno il documento
        function(next)
        {
            var keys = _.keys(counter);
            async.each(keys,

                function(key, next){

                    vocabularies.update(
                        {
                            username:username,
                            project: project,
                            'tags.tag': key
                        },

                        {$set: { 'tags.$.count': counter[key] } } ,

                        { w:1 },

                        function (err, result) {
                            next(null);
                        }
                    )
                },

                function(err){
                    next(null);
                }
            );
        }

    ], function(err){

        connection.close();
        callback(null, counter);

    });

};

Vocabulary.getVocabulary = function(project, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    vocabularies.find(
        {project: project} ,
        function (err, doc) {
            connection.close();
            callback(err, doc);
        }
    )
};

Vocabulary.getWordCount = function(project, query,  callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    var result = {};

    async.waterfall(
        [
            //raggruppo per tag
            function (next) {
    
                vocabularies.distinct( "tags.tag",
                    {project:project} ,
                    function (err, result) {
                        next(null, result );
                    }
                );
            },

            function (tags, next) {

                async.each( tags,

                    function (tag, next) {

                        console.log("raggruppo per tag " + tag);

                        vocabularies.aggregate([

                            {$unwind : "$tags"}

                            , {$match : {"tags.tag": tag} }

                            , {$unwind : "$tags.count"}

                            , {$project : {
                                "tag" : "$tags.count"
                              }}

                            , {$sort: {"tag.c" : -1} }

                            , {$limit: 20 }

                            , {$project: {
                                    word: "$tag.w",
                                    count: "$tag.c",
                                    tag: 1,
                                    _id: 0
                              } }

                        ] , function(err, resultByTag)
                            {
                                console.log("tag " + tag);
                                _.each(resultByTag, function(obj){
                                   delete obj.tag;
                                });

                                result[tag] = resultByTag;
                                next(null);
                            }
                        );

                    },

                    function (err) {
                        next(null);
                    }
                );
            }

        ],

        function(err){
            callback(null, result)
        }
    
    );
};

module.exports = Vocabulary;

//"$project": {
//    "_id": 0,
//        "tag": "$_id"
//}} ,

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