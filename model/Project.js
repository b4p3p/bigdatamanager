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








//function getProjectEnd(doc) {
//
//    console.log("CALL getProjectEnd");
//
//    var Project = require("../model/Project");
//
//    if ( doc == null ) {
//
//        /* non esiste un progetto con lo stesso nome */
//        var connection = require('mongoose').createConnection('mongodb://localhost/oim');
//        var Model = connection.model(Project.MODEL_NAME, Project.PROJECT_SCHEMA);
//        var modelProject = new Model(newProject.data);
//
//        modelProject.save(
//            function(err)
//            {
//                connection.close();
//                projectSaveEnd(err);
//            }
//        );
//
//    }
//    else
//    {
//        //restituisco errore
//        var err = extend({}, ERROR);
//        err.message = "Project already exists";
//        err.status = -1;
//
//        var arg = extend({}, ARG_INDEX);
//        arg.error = err;
//        arg.tab = TAB.NEWPROJECT;
//        arg.page = PAGE.PROJECT;
//
//        request.session.arg = arg;
//
//        response.redirect("/project");
//    }
//}


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

module.exports = Project;