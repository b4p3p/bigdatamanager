const ARG_INDEX = {
    username: '' ,
    project: '',
    page: ''
};

const PAGE = {
  HOME : "home",
  PROJECT : "project"
};

var _USERNAME = "username";
var _IS_AUTH = "isauth";

module.exports = function (app) {

    app.get('/', function (req, res) {
        res.redirect('/login');
    });

    app.get('/login', function (req, res) {
        var message = { error:false, message: '' };
        res.render('../views/pages/login.ejs', message);
    });

    var request;

    app.post('/login', function (req, res) {

        var username = req.body.username;
        var password = req.body.password;
        var message = { error:false, message: '' };

        request = req;

        if ( username == "" || password == "" ) {
            message.error = true;
            message.message = "Username or password missing";
            res.render('../views/pages/login.ejs', message);
            return;
        }

        User = require('../model/User');

        User.getUserPsw(username, password, function(data)
        {
            message.error = true;
            message.message = "User not found";

            if ( data == null )
            {
                res.render('../views/pages/login.ejs', message );
            }
            else
            {
                var sess = request.session;
                sess.username = username;
                res.redirect('/index');
            }

        });

    });

    app.get('/register', function (req, res) {
        var message = { error:false , message: '' };
        res.render('../views/pages/register.ejs', message);
    });

    app.post('/register', function (req, res) {

        var username = req.body.username;
        var password = req.body.password;
        var name = req.body.name;
        var lastname = req.body.lastname;

        User = require("../model/User");

        var newUser = new User(req.body);
        User.save( newUser,
            function(result, message)
            {
                var arg = { error:false, message: '' };

                if ( result >= 0 )
                    res.redirect('/login');
                else
                {
                    arg.message = message;
                    arg.error = true;
                    res.render('../views/pages/register.ejs', arg);
                }
            }
        );
    });

    app.get('/index', function (req, res) {

        var sess = req.session;
        var username = sess.username;
        var arg = ARG_INDEX;

        arg.username = username;

        res.render('../views/pages/index.ejs', arg);
    });

    app.get('/test', function (req, res) {

        var arg = ARG_INDEX;
        arg.username = "pippo";
        arg.project = "test";
        arg.page = PAGE.PROJECT;

        res.render('../views/pages/test.ejs', arg );

    });

    app.get('/home', function (req, res) {

        var arg = ARG_INDEX;
        arg.username = "pippo";
        arg.project = "test";
        arg.page = PAGE.HOME;

        res.render('../views/pages/test.ejs', arg );

    });

    app.get('/project', function (req, res) {

        var arg = ARG_INDEX;
        arg.username = "pippo";
        arg.project = "test";
        arg.page = PAGE.PROJECT;

        res.render('../views/pages/test.ejs', arg );

    });

    //app.post('/newproject', function (req, res) {
    //
    //    if(app.uploaddone == true){
    //        console.log(req.files);
    //        res.end("File uploaded.");
    //    }
    //
    //});

    app.post('/newproject', function (req, res)
        {
            var projectName = req.body.projectName;
            var cmbType = req.body.cmbType;
            var input = req.body.input;

            var sess = req.session;
            var userProject = sess.username;

            req.body.userProject = userProject;

            Project = require("../model/Project");

            var newProject = new Project(req.body);

            Project.save( newProject,
                function(result, message)
                {
                    var arg = { error:false , message: '' };

                    if ( result >= 0 )
                        res.redirect('/index');
                    else
                    {
                        arg.message = message;
                        arg.error = true;
                        res.render('../views/pages/index.ejs', arg);
                    }
                }
            );

            //res.end(projectName+"\n"+input+"\n"+cmbType+"\n"+userProject);


            if(app.uploaddonedone == true){
                console.log(req.files);
                res.write("File uploaded.");
            }

            var fs = require('fs');
            var path = req.files.input.path;

            //fs.readFile(path, function (err, data) {
            //    if (err) {
            //         res.end(err);
            //    }
            //    res.end(data);
            //
            //});
            //
            //var csv = require('csv');
            //csv.parse(csvData, function(err, data){
            //    csv.transform(data, function(data){
            //        return data.map(function(value){return value.toUpperCase()});
            //    }, function(err, data){
            //        csv.stringify(data, function(err, data){
            //            //res.end(data);
            //        });
            //    });
            //});

            //Converter Class
            var Converter = require("csvtojson").core.Converter;
            var csvConverter = new Converter();
            var jsonObject = null;

            csvConverter.on("end_parsed", function(jsonObj){

                jsonObject = jsonObj;
                res.write(JSON.stringify(jsonObj));

                Data = require("../model/Data");

                req.body.data = jsonObject;
                var newData = new Project(jsonObject);
                Data.save( newData,
                    function(result, message)
                    {
                        var arg = { error:false , message: '' };

                        if ( result >= 0 )
                            res.redirect('/index');
                        else
                        {
                            arg.message = message;
                            arg.error = true;
                            res.render('../views/pages/index.ejs', arg);
                        }
                    }
                );

            });

            fs.createReadStream(path).pipe(csvConverter);

            res.end();

        }
    );

    //app.get('/newproject', function (req, res)
    //    {
    //        res.end("ciao get");
    //    }
    //);

};
