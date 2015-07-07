"use strict";

var mongoose = require('mongoose');
var url = 'mongodb://localhost:27017/oim';
var MongoClient = require('mongodb').MongoClient;
var async = require("async");
var request = require("request");
var Summary = require("../model/Summary");
var Regions = require("../model/Regions");
var Datas = require("../model/Data");
var CrowdPulse = require("../model/CrowdPulse");

var Project = function (data) {
    this.data = data;
};

Project.MODEL_NAME = "project";

Project.SCHEMA = new mongoose.Schema({
    projectName: {type : String, required : true },
    userProject: { type : String, required : true },
    dateCreation: {type: Date, default: Date.now()},
    dateLastUpdate: {type: Date, default: Date.now()},
    description : {type : String, default:""} ,
    size : Number
});

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
    var Model = connection.model( Project.MODEL_NAME, Project.SCHEMA);

    dataProject = {
        projectName: dataProject.project,
        userProject: dataProject.username,
        description: dataProject.description
    };

    var newProject = new Model(dataProject);

    newProject.save(
        function(err)
        {
            connection.close();
            callback(err);
        }
    );

};

/**
 * @param projectName
 * @param callback - { fn(  {status:Number, message:String, deletedCount:Number}  )
 */
Project.delProject = function(projectName, callback)
{
    MongoClient.connect(url, function(err, db)
    {
        if(err!=null)
        {
            callback(
                {
                    status:1,
                    message:err.toString(),
                    contDeleted: 0
                }
            );
        }
        else
        {
            var datas = db.collection('datas');
            var projects = db.collection('projects');
            var summaries = db.collection('summaries');

            async.parallel({

                //rimuovo i dati
                deletedCount: function(parallel)
                {
                    setTimeout(function()
                    {
                        datas.removeMany(
                            {projectName: projectName},
                            function(err, ris)
                            {
                                //{status:0, message:"", deletedCount:
                                if ( err == null )
                                    parallel(null, ris.deletedCount);
                                else
                                    parallel(err.toString());
                            }
                        );
                    }, 1);
                },

                //rimuovo il progetto
                project: function(parallel)
                {
                    setTimeout(function()
                    {
                        projects.removeOne(
                            {projectName: projectName},
                            function(err, ris)
                            {
                                if ( err == null )
                                    parallel(null, ris.deletedCount);
                                else
                                    parallel(err.toString());
                            }
                        );
                    }, 1);
                },

                //rimuovo la sincronizzazione
                sync: function(parallel)
                {
                    setTimeout(function()
                    {
                        summaries.removeOne(
                            {project: projectName},
                            function(err, ris)
                            {
                                if ( err == null )
                                    parallel(null, ris.deletedCount);
                                else
                                    parallel(err.toString());
                            }
                        );
                    }, 1);
                }
            },

            function(err, results)
            {

                if(err == null)
                    callback(null, {status:0, message:"", deletedCount: results.deletedCount});
                else
                    callback(err, {status:1, message:err, deletedCount: 0});

                db.close();
            }
            );
        }
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

    var conditions = { projectName: data.projectName }
        , update = { $set: {
            description: data.description,
            projectName: data.projectName
        }}
        , options = { multi: false };

    Model.update(conditions, update, options, function(err, numAffected){

        connection.close();
        callback(err, numAffected);

    });

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
            projectData.filePath,
            projectData.project,
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

/**
 * Crea e salva il documento di stat in summaries
 * @param project
 * @param username
 * @param callback
 */
Project.sync = function(project, username, callback)
{

    console.log("CALL: Project.sync");

    var connection  = mongoose.createConnection('mongodb://localhost/oim');
    var summaries   = connection.model( Summary.MODEL_NAME, Summary.SCHEMA);
    var regions   = connection.model( Regions.MODEL_NAME, Regions.SCHEMA);
    var datas   = connection.model( Datas.MODEL_NAME, Datas.SCHEMA);
    var projects   = connection.model( Project.MODEL_NAME, Project.SCHEMA);
    var docSync = {};

    async.waterfall([

            //cancello la precendente sincronizzazione
            function(next)
            {

                console.log("     cancello la precedente sincronizzazione");

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

                console.log("     get regions");

                regions.find( {},
                    function(err, regions) {
                        next(err, regions);
                    }
                );

            },

            //per ogni regione sincronizzo i dati
            function(regions, next){

                console.log("     set regions/nations data - #" + regions.length);
                var cont=0;
                var len = regions.length;

                //uso i driver nativi (bug mongoose)
                MongoClient.connect( url, function (err, db)
                {
                    var datas = db.collection('datas');

                    async.each(regions,

                        function (region, next) {

                            datas.update(
                                {
                                    projectName: project,
                                    loc: {$geoWithin: {$geometry: region._doc.geometry}}
                                },
                                {
                                    $set:
                                    {
                                        nation: region._doc.properties.NAME_0,
                                        region: region._doc.properties.NAME_1
                                    }
                                },
                                {multi: true, w: 1},
                                function (err, result) {
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

                docSync.lastUpdate = new Date();

                summaries.update(
                    { project : project, username: username } ,
                    docSync,
                    { upsert:true, w:1 },
                    function (err)
                    {
                        next(err, docSync);
                    }
                );
            },

            //aggiorno il lastUpdate e il size del progetto
            function (docSync, next) {

                console.log("     update project");

                projects.update(
                    {projectName: project},
                    {$set: {
                        dateLastUpdate: docSync.lastUpdate,
                        size: docSync.data.countTot
                    }},
                    { w:1 },
                    function (err, result)
                    {
                        next(null, docSync);
                    }
                )
            }
        ],
        function(err, doc){
            connection
                .close();
            if(err){
                console.error(JSON.stringify(err));
                callback(err, {});
            }
            else
                callback(err, doc);
        }
    )
};


module.exports = Project;

///**
// *
// * @param fileNames
// * @param dataProject
// * @param callback
// */
//function addNewProjectWithData(fileNames, dataProject, callback )
//{
//    /**
//     *   async.waterfall
//     *    - con il primo parametro = null, passa all'esecuzione della prossima funzione
//     *    -                         !null  richiama la callback (con un parametro in questo caso)
//     */
//
//    async.waterfall( [
//
//            // 1) cerco se il progetto esiste")
//            function(next) {
//
//                console.log("1) cerco se il progetto esiste");
//
//                Project.getProject(dataProject.projectName,
//                    function(doc){
//
//                        if ( doc == null)
//                            next(null);
//                        else
//                            next( {status:1,message: "project already exists"});
//                    }
//                );
//
//            },
//
//            // 2) se non esiste lo creo")
//            function(next) {
//
//                console.log("2) se non esiste lo creo");
//
//                Project.addProject(dataProject,
//                    function(err)
//                    {
//                        if ( err == null )
//                            next(null);
//                        else
//                        {
//                            for(var k in err.errors){
//                                err = projectError(3, err.errors[k].message);
//                                break;
//                            }
//                            next(err);
//                        }
//
//                    }
//                );
//            },
//
//            // 3) aggiungo i dati al progetto creato"
//            function(next) {
//
//                console.log("3) aggiungo i dati al progetto creato");
//
//                Data.importFromFile(dataProject.cmbType, fileNames, dataProject.projectName,
//                    function (err)
//                    {
//                        if ( err == null )
//                            next(null);
//                        else
//                        {
//                            for(var k in err.errors){
//                                err = projectError(3, err.errors[k].message);
//                                break;
//                            }
//                            next(err);
//                        }
//
//                    }
//                );
//
//            },
//
//            // modifico il progetto creato aggiungendo la dimensione
//            function(next) {
//
//                var MongoClient = require('mongodb').MongoClient;
//                var url = 'mongodb://localhost:27017/oim';
//
//                MongoClient.connect(url, function(err, db) {
//
//                    if ( err )
//                    {
//                        next(err);
//
//                    } else {
//
//                        db.collection('datas').count({projectName:dataProject.projectName},
//                            function(err, cont) {
//                                if ( err ) {
//                                    db.close();
//                                    next(err);
//
//                                }
//                                else {
//                                    db.collection('projects').update(
//                                        {projectName:dataProject.projectName},
//                                        {$set: {size:cont}}, function(err){
//
//                                            if ( err )  {
//                                                next(err);
//                                            }
//                                            else {
//                                                next(null);
//                                            }
//                                            db.close();
//                                        });
//                                }
//                            }
//                        );
//                    }
//                });
//            }
//        ],
//
//        function (err) {
//
//            if (err)
//            {
//                console.error("ERROR newprojectCtrl: " + JSON.stringify(err));
//                callback(err);
//            }
//            else
//            {
//                callback(null);
//            }
//
//        }
//    );
//
//};