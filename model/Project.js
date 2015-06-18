"use strict";

var mongoose = require('mongoose');
var connection = mongoose.createConnection('mongodb://localhost/oim');
var url = 'mongodb://localhost:27017/oim';
var MongoClient = require('mongodb').MongoClient;
var async = require("async");

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
            console.log("CALL getProject -> findOne ( doc is " + doc +")");
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

module.exports = Project;