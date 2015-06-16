var ConstantsRouter = require('./constants_router');
var Project = require("../model/Project");
var Data = require("../model/Data");
var async = require('async');
var requestJson = require('request-json');
var urlencode = require('urlencode');

var argContentProjects = function(data){

    if (!data) data = {};

    return {
        projects: JSON.stringify(data)
    }
};

var projectError = function(status, message)
{
    if(!status) status = 1;
    if(!message) message = 'error';

    return{
        status: status,
        message: message
    }
};

function sendProjectError(request, response, message, status)
{
    console.log("CALL: sendProjectError");

    var err = projectError(status, message);
    var arg = ConstantsRouter.argIndex();

    arg.error = err;

    arg.page = ConstantsRouter.PAGE.NEW_PROJECT;
    arg.error = err;

    request.session.arg = arg;
    response.redirect("/project");
}

module.exports = function (router) {

    //app.get('/project', function (req, res)
    //{
    //    //TODO debug
    //    if ( req.session.userProject == null)
    //        req.session.userProject = 'oim';
    //
    //    //controllo se ho un errore
    //    var arg = ConstantsRouter.argIndex();
    //    var Project = require("../model/Project");
    //
    //    if (req.session.arg)                    // uso  i paramenti presenti nella variabile di sessione
    //    {
    //        arg = req.session.arg;
    //        req.session.arg = null;
    //    }
    //    else                                    // mi costruisco la variabile usando le variabili di sessione
    //    {
    //        arg.userProject = req.session.userProject;
    //        arg.projectName = req.session.projectName;
    //        arg.page = ConstantsRouter.PAGE.PROJECT;
    //        arg.tab =  ConstantsRouter.TAB.OPENPROJECT;
    //    }
    //
    //    Project.getProjects(arg.userProject, function(data, err)
    //    {
    //        if(err) {
    //
    //        }
    //
    //        arg.content = argContentProjects( data );
    //        res.render('../views/pages/index.ejs', arg );
    //
    //    });
    //
    //});

    router.get('/newproject', function (req, res) {
        var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.NEW_PROJECT);
        res.render('../views/pages/index.ejs', arg );
    });

    router.post('/newproject', function (req, res) {

        try {

            // Controlla che tutti i file siano stati upload-ati

            if (app.isUploadDone() == false) return;

            console.log("PAGE: /newproject");

            // reset variable upload
            var fileNames = app.fileNames;
            app.resetVariableUpload();

            var dataProject = {
                projectName: req.body.projectName,
                userProject: req.session.userProject,
                cmbType: req.body.cmbType
            };

            addNewProjectWithData(fileNames, dataProject,
                function (err) {
                    if (err) {
                        sendProjectError(req, res, err.message, err.status);
                    }
                    else {
                        res.redirect("/openproject");

                        var URLProjectName = urlencode(req.body.projectName);
                        res.redirect("/openproject");
                        sincronizazzioneBatch(urlencode(URLProjectName));
                    }
                }
            );
        } catch (e)
        {
            console.error("EXCEPTION newproject");
            console.error(e);
            console.error(e.stack);
        }
    });

    router.get('/editproject', function (req, res) {
        var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.EDIT_PROJECT);
        res.render('../views/pages/index.ejs', arg );
    });

    router.get('/openproject', function (req, res)
    {
        //TODO debug
        if ( req.session.userProject == null)
            req.session.userProject = 'oim';

        //controllo se ho un errore
        var arg = ConstantsRouter.argIndex();
        var Project = require("../model/Project");

        if (req.session.arg)                    // uso  i paramenti presenti nella variabile di sessione
        {
            arg = req.session.arg;
            req.session.arg = null;
        }
        else                                    // mi costruisco la variabile usando le variabili di sessione
        {
            arg.userProject = req.session.userProject;
            arg.projectName = req.session.projectName;
            arg.page = ConstantsRouter.PAGE.OPEN_PROJECT;
        }

        Project.getProjects(arg.userProject, function(data, err)
        {
            if(err) {

            }

            arg.content = argContentProjects( data );
            res.render('../views/pages/index.ejs', arg );

        });

    });

    router.post('/delproject', function (req, res) {

        var projectName = req.body.projectName;
        Project.delProject(projectName, function(err, ris)
        {
            res.json( ris );
        });

    });

    /**
     *  Method: POST
     *  @param  POST: req.body.projectName - username da settare
     *  @return {{}}
     */
    router.post('/setproject', function (req, res) {

        req.session.projectName = req.body.projectName;

        var arg = ConstantsRouter.argIndex();

        arg.userProject =   req.session.userProject;
        arg.projectName =   req.session.projectName;
        arg.page =          ConstantsRouter.PAGE.HOME;

        res.setHeader("Content-Type", "text/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end( JSON.stringify({status: 200}) );

    });

};

/**
 *  Richiesta di sincronizzazione in batch
 */
function sincronizazzioneBatch(projectName)
{
    var client = requestJson.createClient('http://localhost:8080');
    client.get('synchronize?projectName=' + projectName, function(err, res, body) {

        console.log( "Sincronizzazione effettuata:" + body.message);
    });
}

/**
 *
 * @param fileNames
 * @param dataProject
 * @param callback
 */
var addNewProjectWithData = function(fileNames, dataProject, callback )
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