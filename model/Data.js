var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var converter = require('../controller/converterCtrl');

const ERROR = {
    status: 0,
    message: ''
};

/**
 * Model data
 * @param {DATA_SCHEMA[]} data
 * @constructor
 */
var Data = function (data)
{
    this.data = data;
};

Data.MODEL_NAME = "data";

Data.DATA_SCHEMA = new mongoose.Schema({
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


/**
 * JSON of Data object
 * @type {{}}
 */
Data.prototype.data = {};

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
                        cb_wf(null, jsonData.length);
                    }

                });
            } ],

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
    },

    //Funzione di errore each
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

    });

};

/**
 * Get data from datas.
 * @param {String} projectName - project name.
 * @param {function(ERROR, Array)} callback - The callback that handles the response.
 */

Data.getData = function(projectName, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var DataModel = connection.model(Data.MODEL_NAME, Data.DATA_SCHEMA);

    DataModel.find({projectName:projectName})
        .lean()
        .exec( function(err, docs)
        {
            if (err)
            {
                callback(err, {});
            }else{
                callback(null, docs);
            }
            connection.close();
        });
};

function addDataArray(arrayData, projectName, callback) {

    try {

        var connection = mongoose.createConnection('mongodb://localhost/oim');
        var DataModel = connection.model(Data.MODEL_NAME, Data.DATA_SCHEMA);
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

    } catch (e)
    {
        console.error("Data EXCEPTION: addDataArray");
        console.error(e);
    }
}

module.exports = Data;