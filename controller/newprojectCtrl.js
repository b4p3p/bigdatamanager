var async = require('async');
var Project = require("../model/Project");
var Data = require("../model/Data");

var NewprojectCtrl = function() {};

var ERROR = {
    status: 0,
    message: ''
};

NewprojectCtrl.add = function(fileNames, dataProject, callback )
{
    /**
     *   async.waterfall
     *    - con il primo parametro = null, passa all'esecuzione della prossima funzione
     *    -                         !null  richiama la callback (con un parametro in questo caso)
     */

    async.waterfall( [


        function(next) {

            console.log("1) cerco se il progetto esiste");

            Project.getProject(dataProject.projectName,
                function(doc){

                    if ( doc == null)
                        next(null);
                    else
                        callback( {status:1,message: "project already exists"});
                }
            );

        }, // 1) cerco se il progetto esiste")

        function(next) {

            console.log("2) se non esiste lo creo");

            Project.addProject(dataProject,
                function(err)
                {
                    if ( err == null )
                        next(null);
                    else
                        callback(err);
                }
            );
        }, // 2) se non esiste lo creo");

        function(next) {

            console.log("3) aggiungo i dati al progetto creato");

            Data.importFromFile(dataProject.type, fileNames, dataProject.projectName,
                function (err)
                {
                    if ( err == null )
                        next(null);
                    else
                        callback(err);
                }
            );

        }  // 3) aggiungo i dati al progetto creato"
    ],

    function (err) {
        callback(result);
    });

};

module.exports = NewprojectCtrl;