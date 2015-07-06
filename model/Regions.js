"use strict";

var fs = require('fs');
var jsonlint = require("jsonlint");
var async = require("async");
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var _ = require("underscore");
var Datas = require("../model/Data");
var iconvlite = require('iconv-lite');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var SchemaData = require("../model/Data").SCHEMA;

/**
 *  Edit JSON parse fn
 */
JSON._parse = JSON.parse;
JSON.parse = function (data) {
    try {
        return JSON._parse(data);
    } catch (e) {
        jsonlint.parse(data);
    }
};

var Regions = function (data) {
    this.data = data;
};

Regions.SCHEMA = new mongoose.Schema({any: Schema.Types.Mixed});
Regions.MODEL_NAME = "region";

/**
 *
 * @param fileNames
 * @param callback - fn(err, { keyfile: {insert:{Number}, discard:{Number} }
 */
Regions.importFromFile = function (fileNames, callback) {
    var ris = {};

    MongoClient.connect(url, function (err, db) {

        var regions = db.collection('regions');

        async.each(fileNames,

            //save file
            function (file, cb) {
                console.log("CALL saveFile " + file.path);

                var path = file.path;
                var contDiscard = 0;
                var contInsert = 0;

                async.waterfall(
                    [

                        //read file
                        function (callback) {

                            console.log("CALL: read file");

                            // "utf-8",

                            fs.readFile(path,

                                function (err, data) {

                                    data = iconvlite.decode(data, "ISO-8859-1");

                                    if (err) {
                                        console.error("ERROR: fs.readFile");
                                        console.error(JSON.stringify(err));
                                        callback({status: 100, message: err.toString()});
                                    }
                                    else {
                                        callback(null, data);
                                    }
                                }
                            );
                        },

                        //saveFile
                        function (data, callback) {
                            console.log("CALL: saveFile");

                            var nationJson = jsonlint.parse(data.toString());

                            //salvo ciascuna regione del file
                            async.each(nationJson.features,

                                function (features, cb) {
                                    regions.save(features, function (err) {
                                        err ? contDiscard++ : contInsert++;
                                        cb(null);
                                    });

                                },

                                //end each save
                                function (err) {
                                    if (err) {
                                        console.error("ERROR EACH saveJson ");
                                        console.error("  " + JSON.stringify(err));
                                    }
                                    else
                                        console.log("END EACH saveJson");

                                    ris[file.originalname] = {success: contInsert, fail: contDiscard};

                                    fs.unlinkSync(file.path);

                                    callback(err);
                                }
                            );
                        }

                    ],

                    //end waterfall file
                    function (err) {
                        if (err) {
                            console.error("WATERFALL ERROR: saveFile");
                            console.error("  " + JSON.stringify(err));
                        }
                        else {
                            console.log("END WATERFALL");
                        }

                        cb(err);
                    }
                );
            },

            //end each file
            function (err) {
                if (err) {
                    console.error("EACH ERROR: importFromFile");
                    console.error("  " + JSON.stringify(err));
                }
                else {
                    console.log("END EACH");
                }

                db.close();
                callback(err, ris);
            }
        );

    });

};

/**
 * @param callback  - fn({Err},{Data[]})
 */
Regions.getLightNations = function (callback) {
    console.log("CALL: Regions.getLightNations");

    MongoClient.connect(url, function (err, db) {
            var regions = db.collection('regions');
            var datas = db.collection('datas');
            var cont = 0;
            var ris = {};
            var first = true;

            regions.find(
                {},
                {"geometry": 1, "properties.NAME_0": 1, "properties.NAME_1": 1}
            ).each(
                function (err, region) {

                    if (!region && cont == 0 && first)  //non ci sono regioni
                    {
                        callback(null, {});
                        return;
                    }

                    first = false;

                    if (!region) return;

                    cont++;

                    datas.aggregate(
                        {"$match": {loc: {$geoWithin: {$geometry: region.geometry}}}},
                        {"$group": {"_id": "$nation", "sum": {"$sum": 1}}},
                        {
                            "$project": {
                                _id: 0,
                                nation: {$literal: region.properties.NAME_0},
                                region: {$literal: region.properties.NAME_1},
                                sum: "$sum"
                            }
                        },
                        function (err, doc) {
                            if (!doc || doc.length == 0) {

                                cont--;

                                if (cont == 0) {
                                    var keys = _.keys(ris);
                                    ris = _.map(keys, function (k) {
                                        return {nation: ris[k].nation, sum: ris[k].sum}
                                    });
                                    db.close();
                                    callback(null, ris);
                                }

                                return;
                            }

                            cont--;
                            //console.log(doc[0].nation + " " + doc[0].nation + " " + doc[0].sum);

                            if (!ris[doc[0].nation])
                                ris[doc[0].nation] = {nation: doc[0].nation, sum: doc[0].sum};
                            else
                                ris[doc[0].nation].sum += doc[0].sum;

                            if (cont == 0) {
                                console.log("FINE");
                                var keys = _.keys(ris);
                                ris = _.map(keys, function (k) {
                                    return {nation: ris[k].nation, sum: ris[k].sum}
                                });
                                db.close();
                                callback(null, ris);
                            }
                        }
                    )
                }
            )
        }
    );
};

/**
 * @param region    - {String}
 * @param callback  - fn({Err},{Data[]})
 */
Regions.removeNation = function (nation, callback) {
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Regions = connection.model("regions", Regions.SCHEMA);
    var Datas = connection.model("datas", SchemaData);
    var ris = {
        deletedRegion: 0,
        updatedData: 0
    };

    async.waterfall(
        [
            //rimuovo le regioni della nazione selezionata
            function (next) {
                Regions.remove({"properties.NAME_0": nation}, function (err, result) {
                    ris.deletedRegion = result.result.n;
                    next(null);
                });
            },


            //rimuovo dai dati il riferimento delle regioni
            function (next) {

                Datas.update(
                    {nation: nation},
                    {$unset: {nation: true, region: true}},
                    {multi: true, safe: false},
                    function (err, result) {
                        ris.updatedData = result.n;
                        next(null);
                    }
                );

            }

        ],

        function (err) {
            callback(err, ris);
        }
    );

};

/**
 *
 * @param callback
 */
Regions.getRegions = function (arg_nations, isLight, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var regions = connection.model("regions", Regions.SCHEMA);
    var datas = connection.model("datas", Datas.SCHEMA);

    var queryNations = arg_nations.length > 0 ? {"properties.NAME_0": {$in: arg_nations}} : {};
    var projection = {_id:0};

    if(isLight) {
        projection["geometry"] = 0;
        projection["properties.ID_0"] = 0;
        projection["properties.ISO"] = 0;
        projection["properties.ISO2"] = 0;
    }

    regions.find(
        queryNations,
        projection,
        function (err, regions) {
            console.log("CALL: Region.getRegion - #regions %s", regions.length);
            callback(null, regions);
        }
    );
};

module.exports = Regions;

//Regions.getRegions_bak = function (projectName, arg_nations, arg_tags, isLight, callback)

