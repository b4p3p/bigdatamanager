/**
 * Created by annarita on 12/05/15.
 */
const ERROR = {
    status: 0,
    message: ''
};

var Data = function (data)
{
    this.data = data;
};

var model_name = "data";

var mongoose = require('mongoose');

const DATA_SCHEMA = new mongoose.Schema({
    projectName: String, //TODO inserire projectName come key
    id: { type : Number, required : true },
    date: Date,
    latitude: Number,
    longitude: Number,
    source: String,
    text: { type : String, required : true },
    user: String,
    tag: String
});

Data.prototype.data = {};    //json

/**
 * Save an instance of Data.
 *
 * @constructor
 * @this {Data}
 * @param {IstanceOf Data} data The istance of Data to save.
 * @param {callback} callback Callback with err result.
 */
Data.loadData = function(data, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Model = connection.model(model_name, DATA_SCHEMA);
    var newData = new Model( data.data );

    newData.save( function(err) {
        if (err)
            callback(-2, err ); //error
        callback(0, "" );       //OK

        connection.close();
    });
};

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
Data.addDataArray = function(data, callback)
{
    console.log("CALL: Data.addDataArray");
    //console.log(data);

    var error = false;
    var cont = 0;

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Model = connection.model(model_name, DATA_SCHEMA);

    for(var i in data)
    {
        var d = new Model( data[i] );
        d.save( function(err) {

            cont++;

            if (err && !error)
            {
                connection.close();
                error = true;
                callback( 200, err.errors.text.message ); //error
                return
            }

            if (cont == data.length && !error)
            {
                connection.close();
                callback(0, "" );       //OK
                //return
            }
        });
    }
};

Data.importFromFile = function(type, fileNames, callback)
{
    var fs = require('fs');
    var util = require('util');
    var error = false;
    for(var i = 0; i < fileNames.length; i++) {
        var path = fileNames[i];

        console.log(path);

        fs.readFile(path,
            function (err, data) {
                if (err){
                    callback(getSampleError( 100, "Read file error" ));
                    error = true;
                    return;
                }
                else {
                    if (type == "csv")
                        convertData(checkLast, data);
                    else
                        writeJson(checkLast, data);

                }
            }
        );
        function checkLast(arg_ERROR)
        {
            if(error) return;

            if( arg_ERROR.status > 0)
            {
                error = true;
                callback(arg_ERROR);
                return;
            }

            if( i == fileNames.length)
            {
                callback(arg_ERROR);
                return;
            }
        }
    }
};

function getSampleError( status, message )
{
    var arg = ERROR;
    if( status == null || message == null )
    {
        arg.status = 0;
        arg.message = "";
    }
    else
    {
        arg.status = status;
        arg.message = message;
    }
    return arg;
}

function writeJson(callback, jsonData)
{
    var jsonlint = require("jsonlint");

    JSON._parse = JSON.parse;
    JSON.parse = function (json) {
        try {
            return JSON._parse(json);
        } catch(e) {
            jsonlint.parse(json);
        }
    };

    var objJson;
    try {
        objJson = jsonlint.parse( jsonData.toString() );
    }
    catch (e)
    {
        callback(getSampleError( 200, e.message ));
        return;
    }
    for(var i = 0; i < objJson.length; i ++) {
        var obj = objJson[i];
        var keys = Object.keys(obj);
        for(var k = 0; k < keys.length; k ++) {
            var key = keys[k];
            obj[key.toLowerCase()] = obj[key];
        }
    }
    saveJson(callback, objJson);
}

function convertData(callback, csvData)
{
    var csv = require('csv');
    var cont = 0;
    csv.parse(csvData, function (err, data) {
        csv.transform(data,
            function (data) {

                cont++;

                return data.map(
                    function (value) {

                        if (cont == 1)
                            return value.toLowerCase();
                        else
                            return value;
                    }
                );

            },
            function (err, data)
            {
                if(err) return callback(getSampleError( 200, err ));

                csv.stringify(data, function (err, data) {

                    if ( err ) return callback(getSampleError( 200, err ));

                    _convertCsvToJson(callback, data);
                });
            });
    });
}

function _convertCsvToJson(callback, data)
{
    //Converter Class
    var Converter = require("csvtojson").core.Converter;
    var csvConverter = new Converter();

    csvConverter.on("end_parsed", function(jsonObj) {
        saveJson(callback, jsonObj);
    });

    csvConverter.fromString(data, function(jsonObj){
        //if (jsonObj == null)
        //    return;
        //return saveJson(callback, jsonObj);
    });
}

function saveJson(callback, jsonObj)
{
    var Data = require("../model/Data");
    Data.addDataArray( jsonObj, function(result, message){
        saveCallback(callback, result, message)
    });

}

function saveCallback(callback, result, message)
{
    var arg = ERROR;

    if ( result <= 0 )
    {
        arg.status = 0;
        arg.message = "";
    }
    else
    {
        arg.status = result;
        arg.message = message;
    }
    callback(arg);
}

module.exports = Data;