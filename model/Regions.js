/**
 * Created by annarita on 24/05/15.
 */
var fs = require('fs');
var jsonlint = require("jsonlint");
var async = require("async");
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';

var Regions = function (data)
{
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

Regions.importFromFile = function(fileNames, callback)
{

    var path = fileNames[0];

    async.each(fileNames, saveFile, function(err)
    {
        if (err)
        {
            console.error("EACH ERROR: importFromFile");
            console.error("  " + JSON.stringify(err));
        }
        else
        {
            console.log("END EACH");
        }

        callback(err);
    });

};

/**
 * @param callback - fn({Err},{Data})
 */
Regions.getLightRegions = function(callback){

    MongoClient.connect(url, function (err, db) {

        var regions = db.collection('regions');
        regions.find({},{"properties.NAME_0":1, "properties.NAME_1":1}).toArray( function(err, data){
            callback(err, data);
        });
    });

    db.regions.aggregate({
        $project :
        {
            nation: "$properties.NAME_0",
            region: "$properties.NAME_1",
            sum: "$properties.sum"
        }
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

module.exports = Regions;