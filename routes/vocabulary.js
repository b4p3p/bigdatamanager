"use strict";

var Vocabulary = require("../model/Vocabulary");

module.exports = function (router) {

    /// GET COCABULARY
    router.get('/vocabulary', function (req, res) {
        console.log("GET /vocabulary");

        var project = req.session.project || req.query.project;

        Vocabulary.getVocabulary( project, function(err, docs){
            res.json(docs);
        });
    });


    /// SINCRONIZZAZIONE

    router.get('/syncVocabulary', function (req, res) {
        var project = req.session.project || req.query.project;
        var user = req.session.user || req.query.user;

        if( !user || !project )
        {
            res.json({error:1});
            return;
        }

        Vocabulary.syncVocabulary(project, user, function(err, doc)
        {
            res.json(doc);
        });

    });

    router.get('/syncUserTags', function (req, res) {
        var project = req.session.project || req.query.project;
        Vocabulary.syncUserTags(project, function(err, doc){
            res.json(doc);
        });
    });

    router.get('/syncDataTags', function (req, res) {

        console.log("CALL: /syncDataTags");

        var project = req.session.project || req.query.project;

        Vocabulary.syncDataTags( project, {}, function(err, docs)
        {
            res.json(docs);
        });

    });


    /// GET TAGS

    router.get('/getDataTags', function (req, res){
        var project = req.session.project || req.query.project;
        Vocabulary.getDataTags( project, function(err, docs) {
            res.json(docs);
        });
    });

    router.get('/getUserTags', function (req, res) {
        var project = req.session.project || req.query.project;
        Vocabulary.getUserTags( project, function(err, docs) {
            res.json(docs);
        });
    });

    router.get('/wordcount', function (req, res) {

        var project = req.session.project || req.query.project;
        Vocabulary.getWordCount( project, function(err, docs) {
            res.json(docs);
        });

    });


    /// EDIT USER TAGS

    router.put('/vocabulary', function (req, res)
    {
        Vocabulary.insertTags( req.session.project, req.body, function(err)
        {
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.json({status:"error", error:err});
        });
    });

    /**
     *  req.body: {newTag:{String}, oldTag: {String}}
     */
    router.move('/tag', function (req, res)
    {
        var Vocabulary = require("../model/Vocabulary");
        Vocabulary.renameTag(req.session.project, req.body, function(err)
        {
            if(err==null)
                res.json({status:0, error:""});
            else
                res.end(res.writeHead(400, err));
            //res.status(400).send(err);
        });
    });

    router.delete('/tag', function (req, res)
    {
        Vocabulary.deleteTag(req.session.project, req.body.tag, function(err)
        {
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.end(res.writeHead(400, err));
        });
    });

    /**
     *  req.body - {tag:{String}, words: [{String}]
     */
    router.put('/words', function (req, res)
    {
        var Vocabulary = require("../model/Vocabulary");
        Vocabulary.renameWords(req.session.project, req.body, function(err){
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.end(res.writeHead(400, err));
        });
    });


    /// TEST
    router.get('/test', function (req, res){

        var _ = require("underscore");
        var str = "Juve juve  merda";
        var arr = str.split(' ');
        var tag = 'juve';
        arr = _.filter(arr, function(item){
            return item.toLowerCase() == tag;
        });
        res.end(arr.length.toString());

    });
};