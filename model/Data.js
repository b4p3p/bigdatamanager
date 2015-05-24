var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var converter = require('../controller/converterCtrl');

const ERROR = {
    status: 0,
    message: ''
};

var Data = function (data)
{
    this.data = data;
};

var model_name = "data";

const DATA_SCHEMA = new mongoose.Schema({
    projectName: { type : String, required : true },
    id: { type : Number, required : true },
    date: Date,
    latitude: Number,
    longitude: Number,
    source: String,
    text: { type : String, required : true },
    user: String,
    tag: String
});

Data.projectName = null;

Data.prototype.data = {};    //json

Data.importFromFile = function(type, fileNames, projectName, cb_ris)
{
    console.log("### START each ### ");

    async.each(fileNames, function(file, cb_each) {

        async.waterfall(
            [
            // 1) leggo il file
            function (cb_wf) {

                console.log("  1) leggo il file " + file);

                fs.readFile(file, 'utf8', function (err, data) {

                    if ( err ) {
                        cb_wf(err);

                    } else {
                        cb_wf(null, data);

                    }
                });

            },

            // 2) converto il file
            function (data, cb_wf) {

                console.log("  2) controllo il tipo di " + file + " in json");
                console.log("     fileLenght: " + data.length);

                if (type == "csv") {
                    console.log("     converto il file in json");

                    converter.csvToJson(data, function (jsonData) {
                        if (jsonData)
                            cb_wf(null, jsonData);
                        else
                            cb_wf({status:2,message: "Invalid json"});
                    });
                }

                else
                    cb_wf(null, JSON.parse(data));

            },

            // 3) salvo il file json
            function (jsonData, cb_wf){
                console.log("  3) salvo il json: length" + jsonData.length );

                addDataArray(jsonData, projectName, function(err)
                {
                    if(err) {
                        console.log("     errore salvataggio file: " + file );
                        console.log("     err: " + err );
                        cb_wf(err);

                    }else{
                        cb_wf(null);
                    }

                });
            }
            ],

            // Funzione di errore di waterfall
            function (err)
            {
                if (err)
                {
                    console.log("ERROR WATERFALL Data");
                    console.log("   Err: " + err);
                    cb_each(err);
                }
                else
                {
                    cb_each(null);
                }
            }
        );
    //Funzione di errore each
    },

        function(err) {
            console.log("### END each ### ");

            if (err)
            {
                console.log("    Status: ERROR ### ");
                console.log("    Error : " + err);
            }
            else
            {
                console.log("    Status: OK");
                console.log("###############");
            }
            cb_ris(err);

        }
    );

};

function addDataArray(arrayData, projectName, callback) {

    try {

        var connection = mongoose.createConnection('mongodb://localhost/oim');
        var DataModel = connection.model(model_name, DATA_SCHEMA);
        var cont = 0;

        console.log("START EACH addDataArray" );

        async.forEach(arrayData, function(data, cb_each)
        {
            cont++;

            //applico il lower case a tutte le chiavi
            var keys = Object.keys(data);
            for(var k = 0; k < keys.length; k ++) {
                var key = keys[k];
                if(key != key.toLowerCase())
                {
                    data[key.toLowerCase()] = data[key];
                    delete data[key];
                }
            }

            //aggiungo il project name
            data.projectName = projectName;

            var newData = new DataModel(data);
            newData.save(function (err)
            {
                if (err)
                    cb_each(err);

                else
                    cb_each(null);
            });
        },
        function(err) {
            if (err)
            {
                console.error("ERROR addDataArray at row: " + cont);
                console.error(JSON.stringify(err));
                callback(err);
            }
            else
            {
                console.log("END EACH addDataArray - cont=" + cont );
                callback(null);
            }
        });

        //for (var i in data) {
        //
        //    data[i].projectName = projectName;
        //    var newData = new DataModel(data[i]);
        //    newData.save(function (err) {
        //
        //    };
        //
        //    continue;
        //
        //}

            ////TODO controllare che cosa sta memorizzando
            ////
            //
            //data[i]['projectName'] = Data.projectName;
            //
            //var d = new Model(data[i]);
            //
            //d.save(function (err) {
            //
            //    cont++;
            //
            //    if (err && !error) {
            //
            //        console.log("CALL: addDataArray - uscita ERR");
            //
            //        connection.close();
            //        error = true;
            //
            //        var msg = "";
            //        for(var e in err.errors)
            //        {
            //            var errMongo = err.errors[e];
            //            msg = errMongo.message;
            //        }
            //
            //        callback(200, msg );        //error
            //
            //        return
            //    }
            //
            //    if (cont == data.length && !error) {
            //
            //        console.log("CALL: addDataArray - uscita OK");
            //
            //        connection.close();
            //        callback(0, "");       //OK
            //
            //        return
            //    }
            //});
    } catch (e)
    {
        console.error("EXCEPTION: addDataArray");
        console.error(   e);
    }
}












/**
 * Save an instance of Data.
 *
 * @constructor
 * @this {Data}
 * @param {IstanceOf Data} data The istance of Data to save.
 * @param {callback} callback Callback with err result.
 */
//Data.loadData = function(data, callback)
//{
//    var connection = mongoose.createConnection('mongodb://localhost/oim');
//    var Model = connection.model(model_name, DATA_SCHEMA);
//    var newData = new Model( data.data );
//
//    newData.save( function(err) {
//        if (err)
//            callback(-2, err ); //error
//        callback(0, "" );       //OK
//
//        connection.close();
//    });
//};



/**
 * Save an json array of data.
 *
 * @constructor
 * @this {Data}
 * @param {json array of data} data Json array.
 * @param {callback} callback Callback with err result.
 *                   - null:  no error
 *                   - !null: error
 */
//Data.addDataArray = function(data, callback) {
//
//    try {
//        console.log("CALL: Data.addDataArray");
//        //console.log(data);
//
//        var error = false;
//        var cont = 0;
//
//        var connection = mongoose.createConnection('mongodb://localhost/oim');
//        var Model = connection.model(model_name, DATA_SCHEMA);
//
//        for (var i in data) {
//
//            //TODO controllare che cosa sta memorizzando
//            //
//
//            data[i]['projectName'] = Data.projectName;
//
//            var d = new Model(data[i]);
//
//            d.save(function (err) {
//
//                cont++;
//
//                if (err && !error) {
//
//                    console.log("CALL: addDataArray - uscita ERR");
//
//                    connection.close();
//                    error = true;
//
//                    var msg = "";
//                    for(var e in err.errors)
//                    {
//                        var errMongo = err.errors[e];
//                        msg = errMongo.message;
//                    }
//
//                    callback(200, msg );        //error
//
//                    return
//                }
//
//                if (cont == data.length && !error) {
//
//                    console.log("CALL: addDataArray - uscita OK");
//
//                    connection.close();
//                    callback(0, "");       //OK
//
//                    return
//                }
//            });
//        }
//    } catch (e) {
//        console.log("ERR: addDataArray");
//        console.log(e);
//    }
//};



//var contExit = 0;
//var contFile = 0;
//var error = false;
//var exitCallback = null;

//Data.importFromFile = function(type, fileNames, projectName, callback)
//{
//    Data.projectName = projectName;
//    var fs = require('fs');
//    var util = require('util');
//
//    exitCallback = callback;
//    error = false;
//    contExit = 0;
//    contFile = fileNames.length;
//
//    for(var i = 0; i < fileNames.length; i++) {
//        var path = fileNames[i];
//
//        console.log(path);
//
//        fs.readFile(path,
//            function (err, data) {
//                if (err){
//                    callback(getSampleError( 100, "Read file error" ));
//                    error = true;
//                    return;
//                }
//                else {
//                    if (type == "csv")
//                        convertData(checkLast, data);
//                    else
//                        writeJson(checkLast, data);
//
//                }
//            }
//        );
//    }
//};

//function checkLast(arg_ERROR)
//{
//    contExit++;
//
//    console.log("CALL: checkLast arg_ERROR.status: " + arg_ERROR.status);
//    console.log("      contFile:" + contFile + " contExit:" + contExit);
//
//    if(error)
//    {
//        console.log("END: checkLast error");
//        return;
//    }
//
//    //controllo l'errore
//    if(arg_ERROR.status > 0)
//    {
//        console.log("END: checkLast - first error");
//        error = true;
//        exitCallback(arg_ERROR);
//        return;
//    }
//
//    if( contExit < contFile )
//    {
//        console.log("END: checkLast - contExit < contFile")
//        return;
//    }
//
//    console.log("END: checkLast - callback");
//
//    exitCallback(arg_ERROR);
//
//}
//
//function getSampleError( status, message )
//{
//    var arg = ERROR;
//    if( status == null || message == null )
//    {
//        arg.status = 0;
//        arg.message = "";
//    }
//    else
//    {
//        arg.status = status;
//        arg.message = message;
//    }
//    return arg;
//}

//function writeJson(callback, jsonData)
//{
//    console.log("CALL: writeJson");
//
//    var jsonlint = require("jsonlint");
//
//    JSON._parse = JSON.parse;
//    JSON.parse = function (json) {
//        try {
//            return JSON._parse(json);
//        } catch(e) {
//            jsonlint.parse(json);
//        }
//    };
//
//    var objJson;
//    try {
//        objJson = jsonlint.parse( jsonData.toString() );
//    }
//    catch (e)
//    {
//        callback( getSampleError( 200, e.message ) );
//        return;
//    }
//
//    for(var i = 0; i < objJson.length; i ++) {
//        var obj = objJson[i];
//        var keys = Object.keys(obj);
//        for(var k = 0; k < keys.length; k ++) {
//            var key = keys[k];
//            obj[key.toLowerCase()] = obj[key];
//        }
//    }
//
//    saveJson(callback, objJson);
//}

//function convertData(callback, csvData)
//{
//    var csv = require('csv');
//    var cont = 0;
//    csv.parse(csvData, function (err, data) {
//        csv.transform(data,
//            function (data) {
//
//                cont++;
//
//                return data.map(
//                    function (value) {
//
//                        if (cont == 1)
//                            return value.toLowerCase();
//                        else
//                            return value;
//                    }
//                );
//
//            },
//            function (err, data)
//            {
//                if(err) return callback(getSampleError( 200, err ));
//
//                csv.stringify(data, function (err, data) {
//
//                    if ( err ) return callback(getSampleError( 200, err ));
//
//                    _convertCsvToJson(callback, data);
//                });
//            });
//    });
//}

//function _convertCsvToJson(callback, data)
//{
//    //Converter Class
//    var Converter = require("csvtojson").core.Converter;
//    var csvConverter = new Converter();
//
//    csvConverter.on("end_parsed", function(jsonObj) {
//        saveJson(callback, jsonObj);
//    });
//
//    csvConverter.fromString(data, function(jsonObj){
//        //if (jsonObj == null)
//        //    return;
//        //return saveJson(callback, jsonObj);
//    });
//}

//function saveJson(callback, jsonObj)
//{
//    console.log("CALL: saveJson");
//
//    var Data = require("../model/Data");
//    Data.addDataArray( jsonObj,
//        function(result, message){
//            saveCallback(callback, result, message)
//        }
//    );
//
//}
//
//function saveCallback(callback, result, message)
//{
//    console.log("CALL: saveCallback");
//
//    var arg = ERROR;
//
//    if ( result <= 0 )
//    {
//        arg.status = 0;
//        arg.message = "";
//    }
//    else
//    {
//        arg.status = result;
//        arg.message = message;
//    }
//    callback(arg);
//}

module.exports = Data;