/**
 * Created by annarita on 12/05/15.
 */

var Data = function (data) {
    this.data = data;
};

var model_name = "data";

var mongoose = require('mongoose');

const DATA_SCHEMA = new mongoose.Schema({
    project_Name: String,
    id: Number,
    Date: Date,
    Latitude: Number,
    Longitude: Number,
    Source: { type: String, lowercase: true },
    Text: { type: String, lowercase: true },
    User: { type: String, lowercase: true },
    Tag: { type: String, lowercase: true }
});

Data.prototype.data = {};    //json

Data.save = function(data, callback)
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

Data.saveArray = function(data, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Model = connection.model(model_name, DATA_SCHEMA);
    var newData = new Model( data );

    newData.save( function(err) {
        if (err)
            callback(-2, err ); //error
        callback(0, "" );       //OK

        connection.close();
    });

};

Data.importFromFile = function(type, fileNames, callback)
{
    var fs = require('fs');
    var path = fileNames[0]; //TODO implementare il salvataggio di piu file

    fs.readFile(path,
        function (err, data) {
            if (err)
                callback(err);
            else
                convertData(callback, data);
        }
    );
};

function convertData(callback, csvData) {
    var csv = require('csv');
    var cont = 0;
    csv.parse(csvData, function (err, data) {
        csv.transform(data, function (data)
            {
                // senza questa funzione, function (err, data) mi restituisce un elemento per volta
                return data.map(
                    function (value)
                    {
                        cont++;
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
    var jsonObject = null;

    csvConverter.on("end_parsed", function(jsonObj) {
        csvConverter_end_parsed(callback, jsonObj);
    });

    csvConverter.fromString(data, function(jsonObj){

        //if (jsonObj == null)
        //    return;

        //return csvConverter_end_parsed(callback, jsonObj);
    });
}

function csvConverter_end_parsed(callback, jsonObj)
{
    var Data = require("../model/Data");
    var newData = new Data(jsonObj);

    console.log(JSON.stringify(newData));
    console.log(JSON.stringify(jsonObj));

    Data.saveArray( newData, function(result, message){
        saveCallback(callback, result, message)
    });

}

function saveCallback(callback, result, message)
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


module.exports = Data;