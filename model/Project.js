var Project = function (data) {
    this.data = data;
};

Project.MODEL_NAME = "project";

var mongoose = require('mongoose');

Project.PROJECT_SCHEMA = new mongoose.Schema({
    projectName: String,
    userProject: String,
    dateCreation: {type: Date, default: Date.now()},
    dateLastUpdate: {type: Date, default: Date.now()}
});

Project.prototype.data = {};    //json

Project.getProject = function (projectName, callback)
{
    //TODO debug - cancellare questa porzione di codice
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Model = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);
    Model.find({ userProject:'oim' }).remove().exec();
    connection.close();

    connection = mongoose.createConnection('mongodb://localhost/oim');
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

Project.addProject = function(dataProject, callback)
{
    var Project = require("../model/Project");
    var mongoose = require('mongoose');

    console.log("CALL Project.addProject");

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    Model = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);
    var newProject = new Model(dataProject);

    newProject.save(
        function(err)
        {
            connection.close();
            callback(err);
        }
    );

};

module.exports = Project;