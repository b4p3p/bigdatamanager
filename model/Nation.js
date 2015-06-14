/**
 * Created by annarita on 24/05/15.
 */
var fs = require('fs');
var jsonlint = require("jsonlint");
var async = require("async");
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';

var Nation = function (data) {
    this.data = data;
};

/**
 *  Edit JSON parse fn
 */
JSON._parse = JSON.parse;
JSON.parse = function (data) {
    try {
        return JSON._parse(data);
    } catch(e) {
        jsonlint.parse(data);
    }
};

Nation.importFromFile = function(fileNames, callback)
{

    var path = fileNames[0];

    async.each(fileNames, saveFile, function(err)
    {
        if (err)
        {
            console.error("EACH ERROR: importFromFile");
            console.error("  " + JSON.stringify(err));
        }else
        {
            console.log("END EACH");
        }

        callback(err);
    });

};

/**
 * @param file
 * @param cb {Error}
 */
function saveFile(file, cb)
{
    console.log("CALL saveFile " + file);

    async.waterfall([
        function (callback)
        {
            console.log("CALL: read file");

            fs.readFile(file, 'utf8',

                function (err, data) {
                    if (err) {
                        console.error("ERROR: fs.readFile");
                        console.error(JSON.stringify(err));
                        callback({status: 100, message: err.toString()});
                    }
                    else
                    {
                        callback(null, data);
                    }
                }
            );
        },
        saveJson
    ], function (err)
    {
        if (err)
        {
            console.error("WATERFALL ERROR: saveFile");
            console.error("  " + JSON.stringify(err));
        }else
        {
            console.log("END WATERFALL");
        }

        cb(err)
    });
}

/**
 *
 * @param data - file data
 * @param callback({Error})
 */
function saveJson(data, callback)
{
    console.log("CALL: saveFile");

    var nationJson = jsonlint.parse( data.toString() );

    async.each(nationJson.features, saveRegion, function(err)
    {
        if (err)
        {
            console.error("ERROR EACH saveJson ");
            console.error("  " + JSON.stringify(err));
        }else
        {
            console.log("END EACH saveJson");
        }
        callback(err);
    });
}

function saveRegion(features, cb)
{
    MongoClient.connect(url, function(err, db) {

        var regionsCollection = db.collection('regions');
        regionsCollection.update(
            {'properties.NAME_1': features.properties.NAME_1 },
            features,
            { upsert:true },
                function( err, result )
                {
                    console.log(" regione: " + features.properties.NAME_1);
                    db.close();
                    if(err)
                    {
                        console.error("ERROR: saveRegion.insert");
                        console.error(JSON.stringify(err));
                        cb({status: 100, message: err.toString()});
                    }
                    else
                        cb(null);
                });
    });
}

//Nation.addDataArray = function(objJson, callback) {
//
//    try {
//        console.log("CALL: Nation.add DataArray");
//        //console.log(data);
//        var MongoClient = require('mongodb').MongoClient
//            , assert = require('assert');
//
//        // Connection URL
//        var url = 'mongodb://localhost:27017/oim';
//        // Use connect method to connect to the Server
//        MongoClient.connect(url, function(err, db) {
//            assert.equal(null, err);
//            console.log("Connected correctly to server");
//
//                var nationsCollection = db.collection('nations');
//                nationsCollection.insert(objJson, function( err, result )
//                {
//                    db.close();
//                    if(err)
//                    {
//                        console.error("ERROR: nationsCollection.insert");
//                        console.error(JSON.stringify(err));
//                        callback({status: 100, message: err.toString()});
//
//                    }
//                    else
//                        callback(null);
//                });
//            });
//
//    } catch (e) {
//        console.log("ERR: add DataArray");
//        console.log(e);
//    }
//};

module.exports = Nation;