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
Regions.getRegions = function (projectName, arg_nations, arg_tags, isLight, callback) {
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var regions = connection.model("regions", Regions.SCHEMA);
    var datas = connection.model("datas", Datas.SCHEMA);

    var queryNations = arg_nations.length > 0 ? {"properties.NAME_0": {$in: arg_nations}} : {};
    var queryTags = arg_tags.length > 0 ? {"_id.t": {$in: arg_tags}} : {_id: {$exists: true}};

    var maxSum = 0;
    var totRegions = 0;
    var cont = 0;
    var ris = [];
    var dict = {};
    var tags = [];

    async.waterfall(
        [

            //prendo la maggior parte dei dati
            function (next)
            {
                regions.find(queryNations, function (err, regions)
                {
                    console.log("CALL: Region.getRegion - #regions %s", regions.length);

                    if (regions.length == 0) {
                        callback(null, {});
                        return;
                    }

                    totRegions = regions.length;

                    _.each(regions, function (region, i) {

                        var nation = regions[i]._doc.properties.NAME_0;
                        var region = regions[i]._doc.properties.NAME_1;
                        var geometry = regions[i]._doc.geometry;
                        var id = regions[i]._doc._id.id;

                        delete regions[i]._doc._id;

                        if (isLight) {
                            //delete regions[i]._doc._id;
                            delete regions[i]._doc.properties;
                            delete regions[i]._doc.type;
                            delete regions[i]._doc.geometry;
                            regions[i]._doc.properties = {};
                            regions[i]._doc.properties.NAME_0 = nation;
                            regions[i]._doc.properties.NAME_1 = region;
                        }

                        ris.push(regions[i]._doc);
                        dict[id] = i;

                        datas.aggregate(
                            {
                                "$match": {
                                    projectName: projectName,
                                    loc: {$geoWithin: {$geometry: geometry}}
                                }
                            },

                            {
                                "$group": {
                                    "_id": {t: "$tag", r: "$properties.NAME_0"},
                                    "subtotal": {"$sum": 1}
                                }
                            },

                            {"$match": queryTags},

                            {
                                $group: {
                                    _id: "$_id.r",
                                    counter: {$push: {tag: "$_id.t", subtotal: "$subtotal"}},
                                    sum: {$sum: "$subtotal"}
                                }
                            },

                            {
                                "$project": {
                                    _id: 1,
                                    geometry: 1,
                                    counter: 1,
                                    nation: {$literal: nation},
                                    region: {$literal: region},
                                    IDregion: {$literal: id},
                                    sum: "$sum"
                                }
                            },

                            function (err, risGroup) {

                                cont++;

                                if (risGroup && risGroup[0]) {
                                    //console.log("%d) %s - %s - %d",cont, risGroup[0].nation, risGroup[0].region, risGroup[0].sum);

                                    var index = dict[risGroup[0].IDregion];
                                    ris[index].properties.sum = risGroup[0].sum;

                                    maxSum = Math.max(risGroup[0].sum, maxSum);

                                    var counter = {};
                                    _.each(risGroup[0].counter, function(obj, i){
                                        counter[risGroup[0].counter[i].tag] = risGroup[0].counter[i].subtotal;
                                    })

                                    ris[index].properties.counter = counter;
                                }
                                else {
                                    //console.log("%d) ND", cont);
                                }


                                if (cont == totRegions) {
                                    //console.log("##(1)## end group by tag ####");
                                    next(null);
                                }
                            }
                        );
                    });
                });
            },

            //completo con i dati mancanti
            function (next)
            {
                _.each(ris, function(obj, i){
                    if (!ris[i].properties.counter)
                        ris[i].properties.counter = {};
                    if (!ris[i].properties.sum)
                        ris[i].properties.sum = 0;
                    ris[i].properties.avg = ris[i].properties.sum / maxSum;
                });

                next(null);

            }

        ],

        function (err) {

            connection.close();
            callback(null, ris);
        }
    );

};

module.exports = Regions;

