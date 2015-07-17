"use strict";

var Vocabulary = require("../model/Vocabulary");
var _ = require("underscore");

module.exports = function (router) {

    router.get('/sync*', function (req, res, next) {
        var project = req.session.project || req.query.project;
        if(project==null){
            res.redirect('/view/openproject');
        }else{
            next(null);
        }
    });

    /// GET COCABULARY
    router.get('/vocabulary', function (req, res) {
        console.log("GET /vocabulary");

        var project = req.session.project || req.query.project;

        Vocabulary.getVocabulary( project, function(err, docs){
            res.json(docs);
        });
    });


    function writeResult(res, doc, start) {

        res.write('<hr>');
        res.write('Result:<br>');

        _.each(doc, function(item){
            res.write('<b>Tag:</b>' + item.tag + '</br>');
            res.write('<b>Counter:</b><br>');
            res.write('<ui>');
            _.each(item.counter, function(item){
                res.write('<li>' + item.token + ":" + item.count + '</li>');
            });
            res.write('</ul>');
        });

        res.write('Finish in ' + (new Date().getTime() - start.getTime()) / 1000 + " s");

        res.end('</body>');

    }

    router.get('/syncUserTags', function (req, res) {

        res.setHeader('Connection', 'Transfer-Encoding');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        var start = new Date();

        res.write('<body style="color:dimgrey;font-family: monospace;font-size: 15px;text-align: left;position: static;">');

        res.write('##################################<br>');
        res.write('###### Sync User Tags start ######<br>');
        res.write('##################################<br>');

        var project = req.session.project || req.query.project;

        Vocabulary.syncUserTags(project, res, function(err, doc){
            //res.json(doc);
            writeResult(res, doc, start);
            var diff = new Date().getTime() - start.getTime();
            res.end("Process complete in " + diff / 1000 + " sec." );
        });

    } );

    router.get('/syncDataTags', function (req, res) {

        res.setHeader('Connection', 'Transfer-Encoding');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        var start = new Date();

        res.write('<body style="color:dimgrey;font-family: monospace;font-size: 15px;text-align: left;position: static;">');

        res.write('##################################<br>');
        res.write('###### Sync Data tags start ######<br>');
        res.write('##################################<br>');

        var project = req.session.project || req.query.project;

        Vocabulary.syncDataTags(
            project,
            {},
            res,
            function(err, doc) {
                //res.json(docs);
                writeResult(res, doc, start);
            }
        );
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