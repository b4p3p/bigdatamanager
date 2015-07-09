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
    syncCustomTags: [Vocabulary.SCHEMA_RISSYNC],
    syncTokensData: [Vocabulary.SCHEMA_RISSYNC]
});

Vocabulary.insertTags =  function(project, data, callback) {

    console.log("data: " + JSON.stringify(data));

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne( {project: project} , function (err, doc)
    {

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

        doc.save(function (err, result) { callback(err); });

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

        doc.save(function(err, result){
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

Vocabulary.refreshCounter = function(projectName, callback) {

    /**
     *
     * @param projectName
     * @param callback - fn({Error}, {tags})
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
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
};

Vocabulary.getVocabulary = function(project, callback) {

    /**
     * Sincronizzo il vocabolario con i token inseriti dall'utente e i token
     * calcolati automaticamente (datas.tokens)
     */

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

Vocabulary.syncCustomTags = function (project, username,  callback) {

    /**
     * Sincronizzo SOLO i tokens presenti nella collections data
     */

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

Vocabulary.syncTokensData = function (project, query,  callback) {
    /**
     * Sincronizzo SOLO i tokens presenti in user tags in vocabularies
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);
    var projects = connection.model(Project.MODEL_NAME, Project.SCHEMA);

    function updateProjects(docs){
        projects.update(
            { projectName: project },
            { $set: {dateLastUpdate: new Date()} },
            { w:1 }, function (err, result) {
                callback(err, docs);
            }
        );
    }

    Vocabulary.getTokensData(project, query, function(err, docs){

        vocabularies.update(
            { project: project },
            { $set: {
                project: project,

                syncTokensData: docs }
            } ,
            { w:1, upsert: true },
            function (err, result) {
                if(!err)
                    updateProjects(docs);
                else
                    callback(err, {message:err.message} );
            }
        )
    });
};

Vocabulary.getTokensData = function(project, query, callback){

    /**
     * Costruisco il documento per la sincronizzazione dei token presenti
     * in datas
     */

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var fn =
    {
        map: function () {
            for(var i = 0; i < this.tokens.length; i++)
            {
                var tag = this.tag ? this.tag : null;
                emit( { tag: tag, token:this.tokens[i] }, 1);
            }
        },
        reduce: function(key, values)
        {
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

Vocabulary.getUserTags = function (project, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var vocabularies = connection.model(Vocabulary.MODEL_NAME, Vocabulary.SCHEMA);

    vocabularies.findOne({project:project},{userTags:1, _id:0 },  function(err, doc){

        var ris = [];

        if(doc!=null)
        _.each(doc.userTags, function(item, index){
            ris.push({
                tag: item.tag,
                tokens: item.tokens
            });
        });
        callback(null, ris);
    });
};

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