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
    projectName: String,
    id: Number,
    date: Date,
    latitude: Number,
    longitude: Number,
    source: String,
    text: String,
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
                callback(err.code, err ); //error
            }

            if (cont == data.length && !error)
            {
                connection.close();
                callback(0, "" );       //OK
            }
        });
    }
};

Data.importFromFile = function(type, fileNames, callback)
{
    var fs = require('fs');
    var util = require('util');
    for(var i = 0; i < fileNames.length; i++) {
        var path = fileNames[i];

        console.log(path);

        fs.readFile(path,
            function (err, data) {
                if (err){
                    callback(err);
                    return;
                }
                else {
                    if (type == "csv")
                        convertData(callback, data);
                    else
                        writeJson(callback, data);

                }
            }
        );
    }
};

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
    catch (e) {
        var test = e.toString();
        var arg = ERROR;
        arg.status = 200;
        arg.message = e;
        callback(arg);
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
                if(err) return callback(err);

                csv.stringify(data, function (err, data) {

                    if ( err ) return callback(err);

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
   //var jsonObject = null;

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
    var newData = new Data(jsonObj);

    //console.log(JSON.stringify(newData));
    //console.log(JSON.stringify(jsonObj));

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
        arg.status = message.code;
        arg.message = message.message;
    }
    callback(arg);
}

module.exports = Data;