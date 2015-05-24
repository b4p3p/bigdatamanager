var async = require('async');
var Project = require("../model/Project");
var Data = require("../model/Data");

var NewprojectCtrl = function() {};

const ERROR = {
    status: 0,
    message: ''
};

var createError = function(status, message)
{
    var err = ERROR;
    err.status = status;
    err.message = message;
    return err;
};

NewprojectCtrl.add = function(fileNames, dataProject, callback )
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
                            err = createError(3, err.errors[k].message);
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

            Data.importFromFile(dataProject.type, fileNames, dataProject.projectName,
                function (err)
                {
                    if ( err == null )
                        next(null);
                    else
                    {
                        for(var k in err.errors){
                            err = createError(3, err.errors[k].message);
                            break;
                        }
                        next(err);
                    }

                }
            );

        },
        // modifico il progetto creato aggiungendo la dimensione
        function(next, ris) {

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

module.exports = NewprojectCtrl;