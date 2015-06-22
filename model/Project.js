"use strict";

var mongoose = require('mongoose');
var connection = mongoose.createConnection('mongodb://localhost/oim');
var url = 'mongodb://localhost:27017/oim';
var MongoClient = require('mongodb').MongoClient;
var async = require("async");
var request = require("request");

var Project = function (data) {
    this.data = data;
};

Project.MODEL_NAME = "project";

Project.PROJECT_SCHEMA = new mongoose.Schema({
    projectName: {type : String, required : true },
    userProject: { type : String, required : true },
    dateCreation: {type: Date, default: Date.now()},
    dateLastUpdate: {type: Date, default: Date.now()},
    description : {type : String, default:""}
});

Project.prototype.data = {};    //json

/**
 *
 * @param projectName
 * @param callback - fn({Data})
 */
Project.getProject = function (projectName, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Projects = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);

    Projects.findOne( {projectName: projectName },
        function (err, doc)
        {
            console.log("CALL getProject.findOne - foundDoc:" + (doc != null).toString() );
            connection.close();
            callback(doc);
        }
    );
};

Project.getProjects = function(username, callback)
{
    var ProjectModel = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);

    ProjectModel.find()
        .lean()
        .exec( function(err, docs)
    {
        if (err) {
            callback(null);
        }
        else
        {
            callback(docs);
        }
    });


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
    var Model = connection.model( Project.MODEL_NAME, Project.PROJECT_SCHEMA);
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
    MongoClient.connect(url, function(err, db) {
        if(err!=null)
        {
            callback({status:1, message:err.toString(), contDeleted: 0});
        }
        else
        {
            var datas = db.collection('datas');
            var projects = db.collection('projects');

            async.parallel({
                deletedCount: function(parallel){
                    setTimeout(function(){
                        datas.removeMany({projectName: projectName}, function(err, ris)
                        {
                            //{status:0, message:"", deletedCount:
                            if ( err == null )
                                parallel(null, ris.deletedCount);
                            else
                                parallel(err.toString());
                        });
                    }, 1);
                },
                project: function(parallel){
                    setTimeout(function(){
                        projects.removeOne({projectName: projectName}, function(err, ris)
                        {
                            if ( err == null )
                                parallel(null, ris.deletedCount);
                            else
                                parallel(err.toString());
                        });
                    }, 1);
                }
            },

            function(err, results) {

                if(err == null)
                    callback(null, {status:0, message:"", deletedCount: results.deletedCount});
                else
                    callback(err, {status:1, message:err, deletedCount: 0});

                db.close();
            });
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
    var Model = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);

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
 *
 * @param projectData - { file: {String} }
 * @param callback - fn({Error}, {Ris})
 */
Project.addData = function (projectData, sync,  callback){

    var DataModel = require("../model/Data");
    var _result = null;

    async.waterfall( [

        // 1) aggiungo i dati al progetto creato"
        function(next) {

            DataModel.importFromFile(projectData.type, projectData.filePath, projectData.projectName, function(err, result){

                _result = result;
                next(null);

            });
        },

        // 2) sincronizzo i dati
        function(next)
        {
            if(sync)
            {
                Project.synchronize(projectData.serverUrl, projectData.projectName, function(err){
                    next(null);
                });
            }
            else
            {
                next(null);
            }
        }

    ], function(err){

        callback(null, _result);

    });

};

/**
 * @param callback
 */
Project.synchronize = function(url, projectName,  callback)
{
    request({
        uri: "http://" + url + "/synchronize?projectName=" + projectName,
    }, function(error, response, body) {

        console.log("SINCRONIZZAZIONE EFFETTUATA: " + body );

        callback(null);

    });
}

/**
 *
 * @param fileNames
 * @param dataProject
 * @param callback
 */
function addNewProjectWithData(fileNames, dataProject, callback )
{
    /**
     *   async.waterfall
     *    - con il primo parametro = null, passa all'esecuzione della prossima funzione
     *    -                         !null  richiama la callback (con un parametro in questo caso)
     */

    async.waterfall( [

            // 1) cerco se il progetto esiste")
            function(next) {

                console.log("1) cerco se il progetto esiste");

                Project.getProject(dataProject.projectName,
                    function(doc){

                        if ( doc == null)
                            next(null);
                        else
                            next( {status:1,message: "project already exists"});
                    }
                );

            },

            // 2) se non esiste lo creo")
            function(next) {

                console.log("2) se non esiste lo creo");

                Project.addProject(dataProject,
                    function(err)
                    {
                        if ( err == null )
                            next(null);
                        else
                        {
                            for(var k in err.errors){
                                err = projectError(3, err.errors[k].message);
                                break;
                            }
                            next(err);
                        }

                    }
                );
            },

            // 3) aggiungo i dati al progetto creato"
            function(next) {

                console.log("3) aggiungo i dati al progetto creato");

                Data.importFromFile(dataProject.cmbType, fileNames, dataProject.projectName,
                    function (err)
                    {
                        if ( err == null )
                            next(null);
                        else
                        {
                            for(var k in err.errors){
                                err = projectError(3, err.errors[k].message);
                                break;
                            }
                            next(err);
                        }

                    }
                );

            },
            // modifico il progetto creato aggiungendo la dimensione
            function(next) {

                var MongoClient = require('mongodb').MongoClient;
                var url = 'mongodb://localhost:27017/oim';

                MongoClient.connect(url, function(err, db) {

                    if ( err )
                    {
                        next(err);

                    } else {

                        db.collection('datas').count({projectName:dataProject.projectName},
                            function(err, cont) {
                                if ( err ) {
                                    db.close();
                                    next(err);

                                }
                                else {
                                    db.collection('projects').update(
                                        {projectName:dataProject.projectName},
                                        {$set: {size:cont}}, function(err){

                                            if ( err )  {
                                                next(err);
                                            }
                                            else {
                                                next(null);
                                            }
                                            db.close();
                                        });
                                }
                            }
                        );
                    }
                });
            }
        ],

        function (err) {

            if (err)
            {
                console.error("ERROR newprojectCtrl: " + JSON.stringify(err));
                callback(err);
            }
            else
            {
                callback(null);
            }

        });

};

module.exports = Project;