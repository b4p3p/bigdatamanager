"use strict";

var ConstantsRouter = require('./constants_router');
var Vocabulary = require("../model/Vocabulary");

module.exports = function (router) {

    router.get('/sync', function (req, res){

        var project = req.session.project || req.query.project;
        var user = req.session.user || req.query.user;

        if( !user || !project )
        {
            res.json({error:1});
            return;
        }

        Vocabulary.sync(project, user, function(err, doc){
            res.json(doc);
        })

    });

    router.get('/syncwordcount', function (req, res)
    {
        var project = req.session.project || req.query.project;
        var user = req.session.user || req.query.user;

        if( !user || !project )
        {
            res.json({error:1});
            return;
        }

        Vocabulary.syncWordCount(project, user, function(err, doc){
            res.json(doc);
        });

    });


    router.get('/vocabulary', function (req, res)
    {
        console.log("GET /vocabulary");

        var project = req.session.project || req.query.project;

        Vocabulary.getVocabulary( project, function(err, docs){
            res.json(docs);
        });
    });

    router.get('/wordcount', function (req, res)
    {
        console.log("GET /vocabulary");

        var project = req.session.project || req.query.project;

        Vocabulary.getWordCount( project, {}, function(err, docs){
            res.json(docs);
        });
    });


    /**
     *  req.body - {tag:{String}, words: [{String}]
     */
    router.put('/vocabulary', function (req, res)
    {

        var Vocabulary = require("../model/Vocabulary");
        Vocabulary.insertTags(req.session.project, req.body, function(err)
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
        Vocabulary.renameTag(req.session.project, req.body, function(err){
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.json({status:"error", error:err});
        });

    });

    /* req.body: {tag:{String}} */
    router.delete('/tag', function (req, res)
    {

        var Vocabulary = require("../model/Vocabulary");
        Vocabulary.deleteTag(req.session.project, req.body.tag, function(err){
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.json({status:"error", error:err});
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
                res.json({status:"error", error:err});
        });
    });

    router.get('/refresh', function (req, res)
    {

        if(req.session.project == null)
        {
            //TODO debug
            console.error("req.session.project is null: set 'oim'");
            req.session.project = "oim";
        }

        var Vocabulary = require("../model/Vocabulary");
        Vocabulary.refreshCounter(req.session.project, function(err, data){
            if(err==null)
                res.json(data);
            else
                res.json({status:"error", error:err});
        });
    });

};