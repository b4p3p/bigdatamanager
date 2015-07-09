"use strict";

var ConstantsRouter = require('./constants_router');
var Vocabulary = require("../model/Vocabulary");

module.exports = function (router) {

    /**
     *  Restituisce il vocabolario dalla collection vocabularies
     *  precedentemente sincronizzato
     */
    router.get('/vocabulary', function (req, res)
    {
        console.log("GET /vocabulary");

        var project = req.session.project || req.query.project;

        Vocabulary.getVocabulary( project, function(err, docs){
            res.json(docs);
        });
    });

    /**
     * Sincronizzo il vocabolario con i token inseriti dall'utente e i token
     * calcolati automaticamente (datas.tokens)
     */
    router.get('/syncVocabulary', function (req, res)
    {
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


    /**
     * Sincronizzo SOLO i tokens presenti nella collections data
     */
    router.get('/syncCustomTags', function (req, res)
    {
        var project = req.session.project || req.query.project;
        var user = req.session.user || req.query.user;

        if( !user || !project )
        {
            res.json({error:1});
            return;
        }

        Vocabulary.syncCustomTags(project, user, function(err, doc){
            res.json(doc);
        });

    });

    /**
     * Sincronizzo SOLO i tokens presenti in user tags in vocabularies
     */
    router.get('/syncTokensData', function (req, res)
    {
        console.log("CALL: /wordcount");

        var project = req.session.project || req.query.project;

        Vocabulary.syncTokensData( project, {}, function(err, docs)
        {
            res.json(docs);
        });

    });

    /**
     * Prendo SOLO i tokens presenti in TokensData in vocabularies
     */
    router.get('/getTokensData', function (req, res){
        var project = req.session.project || req.query.project;
        Vocabulary.getTokensData( project, {}, function(err, docs) {
            res.json(docs);
        });
    });

    /**
     * Prendo SOLO i tokens presenti in TokensData in vocabularies
     */
    router.get('/getUserTags', function (req, res){
        var project = req.session.project || req.query.project;
        Vocabulary.getUserTags( project, function(err, docs) {
            res.json(docs);
        });
    });


    /**********************************************
     *** Funzioni per modificare il vocabolario ***
     **********************************************/

    /**
     *  req.body - {tag:{String}, words: [{String}]
     */
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

    /* req.body: {tag:{String}} */
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

};