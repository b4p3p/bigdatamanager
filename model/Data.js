"use strict";

var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var converter = require('../controller/converterCtrl');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';

//var ERROR = function() {
//    return {
//        status: 0,
//        message: ''
//    };
//};

/**
 * Model data
 * @param {DATA_SCHEMA[]} data
 * @constructor
 */
var Data = function (data) {
    this.data = data;
};

Data.MODEL_NAME = "datas";

Data.DATA_SCHEMA = new Schema(
    {
        projectName: {type: String, required: true},
        id: {type: String, required: true},
        date: Date,
        latitude: Number,
        longitude: Number,
        loc: {
            type: String,
            coordinates: []
        },
        source: String,
        text: {type: String, required: true},
        user: String,
        tag: String,
        nation : String,
        region: String
    },
    { strict: false }
);
//Data.DATA_SCHEMA.index({ loc: '2dsphere' });

Data.projectName = null;

/**
 * JSON of Data object
 * @type {{}}
 */
Data.prototype.data = {};

/**
 *
 * @param type {String} - "csv" || "json"
 * @param fileNames {Array} - names array
 * @param projectName {String}
 * @param cb_ris - callback({Error},{Result})
 */
Data.importFromFiles = function (type, fileNames, projectName, cb_ris) {
    console.log("### START each ### ");

    var Result = {
        success: [],
        fail: []
    };

    async.each(fileNames, function (file, cb_each) {

            Data.importFromFile(type, file, projectName, function (err, result) {

                cb_each(err);

            });
        },

        //Funzione di errore each
        function (err) {
            console.log("### END each ### ");

            if (err) {
                console.log("    Status: ERROR ### ");
                console.log("    Error : " + err);
            }
            else {
                console.log("    Status: OK");
                console.log("###############");
            }
            cb_ris(err, Result);

        });

};

/**
 *
 * @param type {String} - "csv" || "json"
 * @param fileName - name
 * @param projectName {String}
 * @param cb_ris - callback({Error},{Result})
 */
Data.importFromFile = function (type, file, projectName, cb_ris)
{
    async.waterfall([
            // 1) leggo il file
            function (cb_wf) {

                console.log("  1) leggo il file " + file);

                fs.readFile(file,'utf8',  function (err, data) {

                    if (err) {
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
                            cb_wf({status: 2, message: "Invalid json"});
                    });
                }

                else
                    cb_wf(null, JSON.parse(data));

            },

            // 3) salvo il file json
            function (jsonData, cb_wf) {

                console.log("  3) salvo il json: length" + jsonData.length);

                addDataArray(jsonData, projectName, function (err, result) {
                    //non da mai errore, ma result
                    if (err) {
                        console.log("     errore salvataggio file: " + file);
                        console.log("     err: " + err);
                        cb_wf(err);

                    } else {
                        cb_wf(null, result);
                    }

                });
            }],

        // Funzione di errore di waterfall
        function (err, result) {

            var ris = {
                success: result.success.length,
                fail: result.fail.length
            }

            if (err) {
                console.log("ERROR WATERFALL Data");
                console.log("   Err: " + err);
                cb_ris(err, null);
            }
            else {
                cb_ris(null, ris);
            }
        }
    );

};

/**
 * Get data from datas.
 * @param {String} projectName - project name.
 * @param {function(ERROR, Array)} callback - The callback that handles the response.
 */
Data.loadData = function (projectName, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var DataModel = connection.model(Data.MODEL_NAME, Data.DATA_SCHEMA);

    DataModel.find({projectName: projectName})
        .lean()
        .exec(function (err, docs) {
            if (err) {
                callback(err, {});
            } else {
                callback(null, docs);
            }
            connection.close();
        });
};

/**
 *
 * @param projectName {String}
 * @param callback {function(ERROR, Array)} callback - The callback that handles the response
 */
Data.loadTags = function (projectName, callback)
{
    MongoClient.connect(url, function (err, db) {
        var datas = db.collection('datas');
        datas.distinct("tag", {projectName: projectName}, function (err, array) {
            db.close();
            if (err)
                callback(err, null);
            else
                callback(null, array);
        });
    });
};

Data.getUsers = function(projectName, par, callback)
{

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.DATA_SCHEMA);
    if(!par) par = {};

    //sort=name&order=desc&limit=10&offset=0&_=1435244766146

    var query = datas.aggregate()
        .match({ projectName: projectName})
        .group({
            "_id": {  u:"$user", t:"$tag" } ,
            "subtotal": {"$sum": 1} })
        .group({
            _id:"$_id.u",
            counter:{ $push:{tag:"$_id.t", subtotal:"$subtotal"} },
            sum:{ $sum:"$subtotal"}})
        .project({
            _id:0,
            "user":"$_id",
            counter:1,
            sum: 1});


    // ordinamento di default
    if( !par.sort ){ par.sort = "sum"; par.order = "desc"; }

    var sort = par.sort;
    if(par.order)
        sort = par.order == "desc" ? "-" + sort : sort;
    query.sort(sort);

    if( par.limit )
        query.limit( parseInt(par.limit) );

    query.exec( function(err, docs){
            connection.close();
            callback(err, docs);
    });
};

/**
 *
 * @param arrayData
 * @param projectName
 * @param callback({Error},{Result})
 */
function addDataArray(arrayData, projectName, callback) {

    try {

        //var connection = mongoose.createConnection('mongodb://localhost/oim');
        //var DataModel = connection.model(Data.MODEL_NAME, Data.DATA_SCHEMA);
        var cont = 0;
        var url = 'mongodb://localhost:27017/oim';
        MongoClient.connect(url, function (err, db) {
            if (err != null) {
                callback(err);
                return;
            }

            console.log("START EACH addDataArray");

            var dataCollection = db.collection('datas');
            var result =
            {
                success: [],
                fail: []
            };

            async.forEach(arrayData,

                function (data, cb_each) {

                    cont++;

                    //applico il lower case a tutte le chiavi
                    var keys = Object.keys(data);
                    for (var k = 0; k < keys.length; k++) {
                        var key = keys[k];
                        if (key != key.toLowerCase()) {
                            data[key.toLowerCase()] = data[key];
                            delete data[key];
                        }
                    }

                    //aggiungo il project name
                    data.projectName = projectName;
                    data.id = data.id.toString();

                    //data.loc = {
                    //    type: "Point",
                    //    coordinates:[data.longitude, data.latitude]
                    //};
                    data.loc = {
                        type: "Point",
                        coordinates: [data.longitude, data.latitude]
                    };

                    data.date = new Date(data.date);

                    dataCollection.save(data,
                        function (err) {
                            if (err)
                                result.fail.push(err);

                            else
                                result.success.push(true);

                            cb_each(null);
                        }
                    );
                },

                function (err) {
                    if (err) {
                        console.error("ERROR addDataArray at row: " + cont);
                        console.error(JSON.stringify(err));
                        callback(err, result);
                    }
                    else {
                        console.log("END EACH addDataArray - cont=" + cont);
                        callback(null, result);
                    }
                }
            );

        });
    }
    catch (e) {
        console.error("Data EXCEPTION: add DataArray");
        console.error(e);
        console.error(e.stack);
    }
}


module.exports = Data;