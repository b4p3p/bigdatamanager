/**
 * Created by annarita on 24/05/15.
 */
var Nation = function (data) {
    this.data = data;
};

Nation.importFromFile = function(fileNames, callback)
{
    var fs = require('fs');
    var path = fileNames[0];

    console.log(path);

    fs.readFile(path, 'utf8',
        function (err, data) {
            if (err){
                console.error("ERROR: fs.readFile");
                console.error(JSON.stringify(err));
                callback( {status: 100, message: err.toString()} );
                return;
            }
            else
            {
                console.log("CALL: writeJson");

                var jsonlint = require("jsonlint");

                JSON._parse = JSON.parse;
                JSON.parse = function (data) {
                    try {
                        return JSON._parse(data);
                    } catch(e) {
                        jsonlint.parse(data);
                    }
                };
                var objJson;
                try {
                    objJson = jsonlint.parse( data.toString() );

                    var obj = {};
                    obj['nation'] = objJson.features[0].properties.NAME_0;
                    obj['geojson'] = objJson;

                    console.log(obj);
                    var Nation = require("../model/Nation");
                    Nation.addDataArray( obj, callback );
                }
                catch (e)
                {
                    console.error("ERROR: Nation.importFromFile");
                    console.error(JSON.stringify(e));
                    callback( {status: 100, message: e.toString()} );
                    return;
                }

            }
        }
    );

};

Nation.addDataArray = function(objJson, callback) {

    try {
        console.log("CALL: Nation.addDataArray");
        //console.log(data);
        var MongoClient = require('mongodb').MongoClient
            , assert = require('assert');

        // Connection URL
        var url = 'mongodb://localhost:27017/oim';
        // Use connect method to connect to the Server
        MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            console.log("Connected correctly to server");

                var nationsCollection = db.collection('nations');
                nationsCollection.insert(objJson, function( err, result )
                {
                    db.close();
                    if(err)
                    {
                        console.error("ERROR: nationsCollection.insert");
                        console.error(JSON.stringify(err));
                        callback({status: 100, message: err.toString()});

                    }
                    else
                        callback(null);
                });
            });

    } catch (e) {
        console.log("ERR: addDataArray");
        console.log(e);
    }
};

module.exports = Nation;