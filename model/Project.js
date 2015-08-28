"use strict";

var mongoose = require('mongoose');
var url = 'mongodb://localhost:27017/oim';
var MongoClient = require('mongodb').MongoClient;
var async = require("async");
var request = require("request");

var Summary =       require("../model/Summary");
var Regions =       require("../model/Regions");
var Datas =         require("../model/Data");
var Vocabularies =         require("../model/Vocabulary");
var CrowdPulse =    require("../model/CrowdPulse");

var Project = function (data) {
    this.data = data;
};

Project.MODEL_NAME = "projects";

Project.SCHEMA = new mongoose.Schema({
    projectName: {type : String, required : true },
    userProject: { type : String, required : true },
    dateCreation: {type: Date, default: Date.now()},
    dateLastUpdate: {type: Date, default: Date.now()},
    description : {type : String, default:""} ,
    size : Number
}, {strict:false});

Project.prototype.data = {};    //json

/**
 *
 * @param projectName
 * @param callback - fn({Data})
 */
Project.getProject = function (projectName, username, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Projects = connection.model(Project.MODEL_NAME, Project.SCHEMA);

    Projects.findOne( {projectName: projectName, userProject: username },
        function (err, doc)
        {
            console.log("CALL getProject.findOne - foundDoc:" + (doc != null).toString() );
            connection.close();
            callback(doc);
        }
    );
};

Project.getProjects = function(callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var projects = connection.model(Project.MODEL_NAME, Project.SCHEMA);

    projects.find(
        {},
        {
            '_id': 0,
            projectName: 1,
            userProject:1,
            "description" : 1,
            "dateLastUpdate" : 1,
            "dateCreation" : 1,
            "size" : 1
        },
        function(err, docs)
        {
            connection.close();
            callback(err, docs);
        }
    );
};

/**
 *
 * @param dataProject
 * @param callback - fn(Err)
 */
Project.addProject = function(dataProject, callback)
{
    console.log("CALL Project.addProject");

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var ProjectModel = connection.model( Project.MODEL_NAME, Project.SCHEMA);
    var SummaryModel = connection.model( Summary.MODEL_NAME, Summary.SCHEMA);

    async.parallel([
        function(next){
            var newProject = new ProjectModel( {
                    projectName: dataProject.project,
                    userProject: dataProject.username,
                    description: dataProject.description
                }
            );
            newProject.save( function(err) { next(err) } );
        },
        function(next){

            var newSummaries = new SummaryModel( {
                projectName: dataProject.project,
                username: dataProject.username,
                lastUpdate: new Date(),
                data: {
                    minDate: new Date(),
                    maxDate: new Date(),
                    syncTags: [],
                    allTags: [],
                    counter: {},
                    countSync: 0,
                    countTot: 0,
                    nations: {}
                }
            });
            newSummaries.save(function(err){
                next(null);
            })
        }
    ], function(err, results){
        connection.close();
        callback(err);
    })
};

/**
 * @param projectName
 * @param callback - { fn(  {status:Number, message:String, deletedCount:Number}  )
 */
Project.delProject = function(projectName, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');

    var Datas = require('../model/Data');

    var projects = connection.model( Project.MODEL_NAME, Project.SCHEMA);
    var summaries = connection.model( Summary.MODEL_NAME, Summary.SCHEMA);
    var datas = connection.model( Datas.MODEL_NAME, Datas.SCHEMA);
    var vocabularies = connection.model( Vocabularies.MODEL_NAME, Vocabularies.SCHEMA);

    async.parallel({

        //rimuovo i dati
        deletedCount: function(parallel) {
            datas.remove( {projectName: projectName},
                function(err, ris) {
                    //{status:0, message:"", deletedCount:
                    if ( err == null )
                        parallel(null, ris.result.n);
                    else
                        parallel(err.toString());
                }
            );
        },

        //rimuovo il progetto
        project: function(parallel) {
            projects.remove({projectName: projectName},
                function(err, ris) {
                    if ( err == null )
                        parallel(null, ris.result.n);
                    else
                        parallel(err.toString());
                }
            );
        },

        //rimuovo la sincronizzazione
        sync: function(parallel)
        {
            summaries.remove(
                {projectName: projectName},
                function(err, ris) {
                    if ( err == null )
                        parallel(null, ris.result.n);
                    else
                        parallel(err.toString());
                }
            );
        },

        vocabulary: function(parallel){
            vocabularies.remove({project: projectName},
                function(err, ris) {
                    if ( err == null ) parallel(null, ris.result.n);
                    else               parallel(err.toString());
                })
        }
    }, function(err, results) {

        if(err == null)
            callback(null, {status:0, message:"", deletedCount: results.deletedCount});
        else
            callback(err, {status:1, message:err, deletedCount: 0});

        connection.close();
    });

};

/**
 *
 * @param arg
 * @param arg.connection
 * @param arg.user
 * @param callback
 */
Project.delUserProjects = function(arg, callback){

    var conn = !arg.connection ? mongoose.createConnection('mongodb://localhost/oim') : arg.connection;
    var projects = conn.model( Project.MODEL_NAME, Project.SCHEMA);

    projects.remove( {userProject:arg.user} , function(err, results){
        callback(err, results);
    });

};

/**
 *
 * @param data
 * @param callback - fn(Err, Data)
 */
Project.editProject = function (data, callback) {

    console.log("CALL: Project.editProject");
    console.log("  data: " + JSON.stringify(data));

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Model = connection.model(Project.MODEL_NAME, Project.SCHEMA);

    Model.findOne( { projectName: data.project } , function(err, doc){
        doc.description = data.description;
        doc.save(function(err){
            connection.close();
            callback(err);
        })
    });

    //Model.findOne(
    //    { projectName: data.projectName },
    //    { $set:{ description: data.description } },
    //    { },
    //    function(err, result){
    //        connection.close();
    //        callback(err, numAffected);
    //    });

    //var conditions = { projectName: data.projectName }
    //    , update = { $set: {
    //        description: data.description,
    //        projectName: data.projectName
    //    }}
    //    , options = { multi: false };

    //Model.update(conditions, update, options, function(err, numAffected){
    //});

};

/**
 * @param projectData - { file: {String} }
 * @param callback - fn({Error}, {Ris})
 */
Project.addData = function (projectData, callback)
{
    var Data = require("../model/Data");

    if( projectData.type == "json-crowdpulse" )
    {
        CrowdPulse.importFromFile(
            projectData,
            function(err, result){
                callback(err, result);
            }
        )
    }else
    {
        Data.importFromFile(
            projectData.type,
            projectData.filePath,
            projectData.project,
            function(err, result){
                callback(err, result);
            }
        );
    }

};

Project.getLastUpdate = function(project , callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var projects = connection.model( Project.MODEL_NAME, Project.SCHEMA);

    projects.findOne(
        {projectName: project },
        {dateLastUpdate: 1, _id:0},
        function (err, doc)
        {
            connection.close();
            callback(err, doc);
        }
    );
};

function divInline(text, divClass ){

    //var div = '<div style="display:inline-block;width: ' + width +'">';
    var div = '<div class="' + divClass + '" style="display:inline-block">';
    div += text;
    div += "</div>";
    return div;
}

/**
 * Crea e salva il documento di stat in summaries
 * @param project
 * @param username
 * @param callback
 */
Project.sync = function(project, username, res, callback)
{
    console.log("CALL: Project.sync");

    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var Utils = require('../controller/nodeUtil');

    Datas = require("../model/Data");

    var summaries   =   connection.model( Summary.MODEL_NAME, Summary.SCHEMA);
    var regions   =     connection.model( Regions.MODEL_NAME, Regions.SCHEMA);
    var datas   =       connection.model( Datas.MODEL_NAME, Datas.SCHEMA);
    var projects   =    connection.model( Project.MODEL_NAME, Project.SCHEMA);
    var countGeo = 0;

    var docSync = {};

    async.waterfall([

        //cancello la precendente sincronizzazione
        function(next)
        {
            res.write("DELETE previous synchronization<br>");
            console.log("     DELETE previous synchronization");

            datas.update(
                { projectName: project } ,
                { $unset: { region:'', nation:'' } },
                {multi:true} ,
                function(err, result){
                    next(null);
                }
            );

        },

        //get regions
        function(next){

            console.log("     FETCH nations");
            res.write("FETCH nations<br>");

            regions.find( {},
                function(err, regions) {
                    next(err, regions);
                }
            );

        },

        //per ogni regione sincronizzo i dati
        function(regions, next){

            console.log("     set regions/nations data - #" + regions.length);
            res.write("FOUND " + regions.length + " nations<br>");

            var cont=0;
            var len = regions.length;

            //uso i driver nativi (bug mongoose)
            MongoClient.connect( url, function (err, db)
            {
                var datas = db.collection('datas');

                async.each(regions,

                    function (region, next) {

                        datas.update({
                                projectName: project,
                                loc: {$geoWithin: {$geometry: region._doc.geometry}}
                            },
                            { $set: {
                                nation: region._doc.properties.NAME_0,
                                region: region._doc.properties.NAME_1
                            }},
                            {multi: true, w: 1},
                            function (err, result) {

                                if(result && result.result && result.result.nModified)
                                {
                                    res.write( divInline(cont + "/" + len, "countRes") +
                                        " - Modified " + divInline(result.result.nModified, "countDocs") +
                                        " docs in " + region._doc.properties.NAME_1 + "@" + region._doc.properties.NAME_0 + "<br>");
                                    countGeo += result.result.nModified;
                                } else
                                    res.write( divInline(cont + "/" + len, "countRes") +
                                        " - Modified " + divInline(0, "countDocs") +
                                        " docs in " + region._doc.properties.NAME_1 + "@" + region._doc.properties.NAME_0 + "<br>");


                                console.log("   fatto " + cont + "/" + len + " - " + region._doc.properties.NAME_0 + ":" + region._doc.properties.NAME_1);
                                cont++;
                                next(null);
                            }
                        );
                    },

                    function (err) {
                        db.close();
                        next(null);
                    }
                )
            });
        },

        //costruisco il docSync dai dati sincronizzati
        function (next)
        {
            console.log("     get new stat filter");
            Summary.getStatFilter( project, username, null, function(err, doc){
                next(null, doc)
            });
        },

        //salvo il nuovo docSync
        function(docSync, next)
        {
            console.log("     save docSync");

            summaries.findOne({projectName:project}, function (err, doc) {

                if(doc!=null)
                {
                    doc.data = docSync.data;
                    doc.lastUpdate = new Date();
                }else
                {
                    docSync.lastUpdate = new Date();
                    doc = new summaries(docSync);
                }

                doc.save(function(err, res){
                    next(err, docSync);
                });

            });
        },

        //aggiorno il lastUpdate e il size del progetto
        function (docSync, next) {
            console.log("     update project");
            Project.updateLastUpdate(projects, project, docSync.lastUpdate, docSync.data.countTot, function(err){
                next(err, docSync);
            });
        }],
        function(err, doc){
            connection.close();
            if(err){
                console.error(JSON.stringify(err));
                callback(err, {});
            }
            else
                callback(err, doc);
        }
    )
};

Project.updateLastUpdate = function(model, project, date, size, callback){

    var edit = {};
    if ( date != null ) edit.dateLastUpdate = date; else edit.dateLastUpdate = new Date();
    if ( size != null ) edit.size = size;

    model.update(
        {projectName: project},
        {$set: edit },
        { w:1 },
        function (err) {
            callback(err);
        }
    )
};


/**
 * Imposta il contatore size del progetto
 * @param arg
 * @param arg.connection
 * @param arg.project
 * @param callback
 */
Project.setSize = function(arg, callback){

    var Datas = require('../model/Data');
    var Project = require('../model/Project');

    var conn =          !arg.connection
                            ? mongoose.createConnection('mongodb://localhost/oim')
                            : arg.connection;
    var projectName =   arg.project;
    var datas =         conn.model(Datas.MODEL_NAME, Datas.SCHEMA);
    var projects =      conn.model(Project.MODEL_NAME, Project.SCHEMA);

    projects.findOne({projectName:projectName}, function(err, project){

        datas.find({projectName:projectName}).count(function(err, cont){

            project.size = cont;
            project.dateLastUpdate = new Date();

            project.save(function(err){
                if(err)console.error(err);
                if(!arg.connection) conn.close();
                callback(err);
            });

        })
    });
};

module.exports = Project;