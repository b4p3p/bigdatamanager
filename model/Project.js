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

//Project.prototype.getProjectName = function()
//{
//    return this.data.projectName;
//};

//Project.save = function(project, callback)
//{
//    var connection = mongoose.createConnection('mongodb://localhost/oim');
//    var projectName = project.getProjectName();
//    var projectData = project.data;
//
//    var Model = connection.model(model_name, PROJECT_SCHEMA);
//    var newProject = new Model( project.data );
//
//    newProject.save(
//        function(err) {
//
//            if (err)
//                callback(-1, err ); //error
//            callback(0, "" );       //OK
//
//            connection.close();
//        }
//    );
//};

Project.getProject = function (projectName, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Projects = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);

    Projects.findOne( {projectName: projectName },
        function (err, doc)
        {
            console.log("CALL getProject -> findOne");
            console.log("doc is " + doc);
            connection.close();
            callback(doc);
        }
    );
};

//Project.getUserProj = function (projectName, user , callback)
//{
//    var connection = mongoose.createConnection('mongodb://localhost/oim');
//
//    var Project = connection.model(model_name, PROJECT_SCHEMA);
//
//    Users.findOne({projectName: projectName, user: user }, function (err, doc)
//    {
//        console.log(doc);
//        console.log("CALL getProject -> findOne");
//        callback(doc);
//        connection.close();
//    });
//};

module.exports = Project;