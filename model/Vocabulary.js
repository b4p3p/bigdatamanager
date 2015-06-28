"use strict";
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';

var async = require("async");
var mongoose = require('mongoose');
var MODEL_NAME = "vocabularies";
var VOCABULARY_SCHEMA = new mongoose.Schema({
    projectName: String,
    tag: String,
    words: []
});

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

function updateTags(text, tags)
{
    for(var t in tags)
        for(var w in tags[t]) {
            if(text.indexOf(w) >= 0 )
                tags[t][w] = tags[t][w] += 1;
        }
    return tags;
}

function formatTag(tags)
{
    var ris = {};
    for(var t in tags)
    {
        var tag = tags[t].tag;
        ris[tag] = {};

        var words = tags[t].words;
        for(var w in words)
        {
            var word = words[w];
            ris[tag][word] = 0;
        }
    }
    return ris;
}

//var _tags = null;
//var _ris = null;
//function setCounter(datas, projectName, tags, callback)
//{
//    _tags = tags;
//    var counter = {};
//    async.each(datas,
//        function(row, next){
//            _tags = updateTags( row.text , _tags );
//            next(null);
//        },
//        function(err){
//            callback(err, _tags);
//        }
//    );
//}



function _renameTag(doc, data, db, Collection, callback)
{
    /* aggiorno il nuovo documento */
    doc.tag = data.newTag;

    Collection.update(
        {tag: data.newTag},
        {$set: { tag: data.newTag, words:doc.words } },
        {upsert:true},
        function(err){
            db.close();
            callback(err);
        }
    );
}

module.exports = Vocabulary;