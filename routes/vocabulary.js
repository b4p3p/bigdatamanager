"use strict";

var Vocabulary = require("../model/Vocabulary");
var _ = require("underscore");

module.exports = function (router, app) {

    router.get('/sync*', function (req, res, next) {
        var project = req.session.project || req.query.project;
        if(project==null){
            res.redirect('/view/openproject');
        }else{
            next(null);
        }
    });

    /**
     * Restituisce il vocabolario memorizzato nella collection
     * @param project
     */
    router.get('/vocabulary', function (req, res) {

        console.log("GET /vocabulary");

        var project = req.session.project || req.query.project;

        Vocabulary.getVocabulary( project, function(err, docs){
            res.json(docs);
        });
    });

    /**
     * [Asincrona]Calcola il wordcount utilizzando il vocabolario dell'utente
     * e i token presenti nei dati
     */
    router.get('/syncUserTags', function (req, res) {

        var start = new Date();
        var project = req.session.project || req.query.project;

        if(project)
            res.status(200).end("Sync Data tags start...");
        else
        {
            res.status(500).end("No project selected");
            return;
        }

        app.io.emit("syncUserTags_msg",
            "##################################<br>" +
            '###### Sync User Tags start ######<br>' +
            '##################################<br>'
        );

        Vocabulary.syncUserTags(project, app, function(err, doc){
            app.io.emit("syncUserTags_end", writeResult(app, doc, start) );
        });

    } );

    /**
     * [Asincrona]Calcola il wordcount utilizzando il SOLO i token nei dati
     */
    router.get('/syncDataTags', function (req, res) {

        var start = new Date();
        var project = req.session.project || req.query.project;

        if(project)
            res.status(200).end("Sync Data tags start...");
        else
        {
            res.status(500).end("No project selected");
            return;
        }

        app.io.emit("syncDataTags_msg",
            "##################################<br>" +
            '###### Sync Data tags start ######<br>' +
            '##################################<br>'
        );

        Vocabulary.syncDataTags( project, {}, app,
            function(err, doc) {
                app.io.emit("syncDataTags_end", writeResult(app, doc, start) );
            }
        );
    });

    /**
     * Richede i tag nei dati con i rispettivi tokens
     */
    router.get('/getDataTags', function (req, res){
        var project = req.session.project || req.query.project;
        Vocabulary.getDataTags( project, function(err, docs) {
            res.json(docs);
        });
    });

    /**
     * Per ogni tag inserito nel vocabolario dell'utente, restituisce il token count
     * @param project
     */
    router.get('/getUserTags', function (req, res) {
        var project = req.session.project || req.query.project;
        Vocabulary.getUserTags( project, function(err, docs) {
            res.json(docs);
        });
    });

    /**
     * Restituisce dataTags e userTags
     * @param project
     */
    router.get('/wordcount', function (req, res) {

        var project = req.session.project || req.query.project;
        Vocabulary.getWordCount( project, function(err, docs) {
            res.json(docs);
        });

    });

    /**
     * Inserisce un nuovo elemento nel vocabolario dell'utente
     * @param project
     * @param data
     * @param data.tag - nuovo tag da aggiungere
     * @param data.tokens - tokens da aggiungere nel tag
     */
    router.put('/vocabulary', function (req, res) {
        Vocabulary.insertTags( req.session.project, req.body, function(err)
        {
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.json({status:"error", error:err});
        });
    });

    /**
     * Rinomina un tag nel vocavolario dell'utente
     * @param project
     * @param data
     * @param data.newTag - nuovo nome
     * @param data.oldTag - vecchio nome
     */
    router.move('/tag', function (req, res) {
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

    /**
     * Elimina un tag dal vocabolario dell'utente
     * @param project
     * @param tag
     */
    router.delete('/tag', function (req, res) {
        Vocabulary.deleteTag(req.session.project, req.body.tag, function(err)
        {
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.end(res.writeHead(400, err));
        });
    });

    /**
     * Cambia i tokens nel tag specificato
     * @param project
     * @param data
     * @param data.words - parole da aggiungere/modificare nel tag specificato
     * @param data.tag - tag da modificare
     */
    router.put('/words', function (req, res) {
        var Vocabulary = require("../model/Vocabulary");
        Vocabulary.renameWords(req.session.project, req.body, function(err){
            if(err==null)
                res.json({status:"ok", error:""});
            else
                res.end(res.writeHead(400, err));
        });
    });

    function writeResult(app, doc, start) {

        var msg = '';

        msg += '<hr>';
        msg += 'Result:<br>';

        _.each(doc, function(item){
            msg += '<b>Tag:</b>' + item.tag + '</br>';
            msg += '<b>Counter:</b><br>';
            msg += '<ui>';
            _.each(item.counter, function(item){
                msg += '<li>' + item.token + ":" + item.count + '</li>';
            });
            msg += '</ul>'
        });
        msg += 'Finish in ' + (new Date().getTime() - start.getTime()) / 1000 + " s";
        return msg;
    }
};