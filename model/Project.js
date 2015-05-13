/**
 * Created by annarita on 12/05/15.
 */

var Project = function (data) {
    this.data = data;
};

var model_name = "project";

var mongoose = require('mongoose');

var PROJECT_SCHEMA = new mongoose.Schema({
    projectName: String,
    userProject: String,
    dateCreation: {type: Date, default: Date.now()},
    dateLastUpdate: {type: Date, default: Date.now()},
    input: String
});

Project.prototype.data = {};    //json

Project.prototype.getProjectName = function()
{
    return this.data.projectName;
};

//Project.prototype.getUserProject = function()
//{
//    return this.data.userProject;
//};

Project.save = function(project, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var projectName = project.getProjectName();
    var projectData = project.data;

    Project.getProject( projectName,
        function (data) {
            if (data != null)
            {
                callback(-1 , "Project already exists" );
                connection.close();
            }
            else
            {
                //var conn = mongoose.createConnection('mongodb://localhost/oim');
                var Model = connection.model(model_name, PROJECT_SCHEMA);
                var newProject = new Model( project.data );

                newProject.save( function(err) {
                    if (err)
                        callback(-2, err ); //error
                    callback(0, "" );       //OK

                    connection.close();
                });
            }
        });

};

Project.getProject = function (projectName, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');

    var Projects = connection.model(model_name, PROJECT_SCHEMA);

    Projects.findOne( {projectName: projectName}, function (err, doc)
    {
        console.log(doc);
        console.log("CALL getProject -> findOne");
        callback(doc);
        connection.close();
    });
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