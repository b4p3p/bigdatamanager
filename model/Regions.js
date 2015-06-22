/**
 * Created by annarita on 24/05/15.
 */
var fs = require('fs');
var jsonlint = require("jsonlint");
var async = require("async");
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var _ = require("underscore");

var Regions = function (data) {
    this.data = data;
};

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

Regions.importFromFile = function (fileNames, callback) {

    var path = fileNames[0];

    async.each(fileNames, saveFile, function (err) {
        if (err) {
            console.error("EACH ERROR: importFromFile");
            console.error("  " + JSON.stringify(err));
        }
        else {
            console.log("END EACH");
        }

        callback(err);
    });

};

/**
 * @param callback - fn({Err},{Data[]})
 */
Regions.getLightRegions = function (callback) {

    MongoClient.connect(url, function (err, db) {

        var ris = [];
        var regions = db.collection('regions');
        var datas = db.collection('datas');
        var cont = 0;

        regions.find(
            {},
            {"geometry": 1, "properties.NAME_0": 1, "properties.NAME_1": 1}
        ).each (
            function (err, region) {

                if(region == null) return;

                cont ++;

                datas.aggregate(
                {"$match": {loc: {$geoWithin: {$geometry: region.geometry}}}},
                {"$group": {"_id": "$region", "sum": {"$sum": 1}}},
                {
                    "$project": {
                        _id: 0,
                        nation: {$literal: region.properties.NAME_0},
                        region: {$literal: region.properties.NAME_1},
                        sum: "$sum"
                    }
                },
                function (err, doc) {

                    cont--;
                    console.log(doc[0].nation + " " + doc[0].region + " " + doc[0].sum);
                    ris.push(doc[0]);

                    if ( cont == 0)
                    {
                        callback(null, ris);
                    }
                }
            )}
        )
    });


    //    regions.find({},{"geometry":1, "properties.NAME_0":1, "properties.NAME_1":1}).forEach(function (region) {
    //
    //        datas.aggregate(
    //            {"$match":{loc: { $geoWithin: { $geometry: region.geometry } }}},
    //            {"$group":{"_id":"$region", "sumTag":{"$sum":1}}},
    //            {"$project": {
    //                _id: 0 ,
    //                nation: { $literal: region.properties.NAME_0 } ,
    //                nameRegion: { $literal: region.properties.NAME_1 } ,
    //                sumTag: "$sumTag",
    //                sumTot: "$sumTot",
    //                tag: "$_id"
    //            }},
    //            function(err, result)
    //            {
    //
    //                console.log("ciao");
    //
    //                //var cont = 0;
    //                //
    //                //if(result!=null)
    //                //    result.forEach(function(obj){
    //                //        region.properties.counter[obj._id] = obj.sum;
    //                //        cont += obj.sum
    //                //    });
    //                //
    //                //if ( cont > max )  max = cont;
    //                //
    //                //region.properties.sum = cont;
    //                //region.properties.avg = 1;          //TODO calcolare la media
    //                //ris.push(region);
    //                //
    //                //waterfall(null);
    //
    //            }
    //        );
    //    });
    //
    //});

    //db.regions.find({},{"geometry":1}).forEach(function (doc) {
    //    print(doc.geometry);
    //});
    //
    //db.regions.aggregate({
    //    $project :
    //    {
    //        nation: "$properties.NAME_0",
    //        region: "$properties.NAME_1",
    //        sum: "$properties.sum"
    //    }
    //});

};

/**
 * @param callback - fn({Err},{Data[]})
 */
Regions.getLightNations = function (callback) {



    MongoClient.connect(url, function (err, db) {

        var regions = db.collection('regions');
        var datas = db.collection('datas');
        var cont = 0;
        var ris = {};

        regions.find(
            {},
            {"geometry": 1, "properties.NAME_0": 1, "properties.NAME_1": 1}
        ).each (
            function (err, region) {

                if(region == null) return;

                cont ++;

                datas.aggregate(
                    {"$match": {loc: {$geoWithin: {$geometry: region.geometry}}}},
                    {"$group": {"_id": "$nation", "sum": {"$sum": 1}}},
                    {"$project": {
                        _id: 0,
                        nation: {$literal: region.properties.NAME_0},
                        region: {$literal: region.properties.NAME_1},
                        sum: "$sum"
                    }},
                    function (err, doc) {

                        cont--;
                        console.log(doc[0].nation + " " + doc[0].nation + " " + doc[0].sum);

                        if( !ris[doc[0].nation] )
                            ris[doc[0].nation] = { nation: doc[0].nation, sum: doc[0].sum};
                        else
                            ris[doc[0].nation].sum += doc[0].sum;

                        if ( cont == 0)
                        {
                            var keys = _.keys(ris);
                            ris = _.map(keys, function(k) {
                                return { nation: ris[k].nation, sum: ris[k].sum }
                            });
                            callback(null, ris);
                        }
                    }
                )}
        )
    });


    //    regions.find({},{"geometry":1, "properties.NAME_0":1, "properties.NAME_1":1}).forEach(function (region) {
    //
    //        datas.aggregate(
    //            {"$match":{loc: { $geoWithin: { $geometry: region.geometry } }}},
    //            {"$group":{"_id":"$region", "sumTag":{"$sum":1}}},
    //            {"$project": {
    //                _id: 0 ,
    //                nation: { $literal: region.properties.NAME_0 } ,
    //                nameRegion: { $literal: region.properties.NAME_1 } ,
    //                sumTag: "$sumTag",
    //                sumTot: "$sumTot",
    //                tag: "$_id"
    //            }},
    //            function(err, result)
    //            {
    //
    //                console.log("ciao");
    //
    //                //var cont = 0;
    //                //
    //                //if(result!=null)
    //                //    result.forEach(function(obj){
    //                //        region.properties.counter[obj._id] = obj.sum;
    //                //        cont += obj.sum
    //                //    });
    //                //
    //                //if ( cont > max )  max = cont;
    //                //
    //                //region.properties.sum = cont;
    //                //region.properties.avg = 1;          //TODO calcolare la media
    //                //ris.push(region);
    //                //
    //                //waterfall(null);
    //
    //            }
    //        );
    //    });
    //
    //});

    //db.regions.find({},{"geometry":1}).forEach(function (doc) {
    //    print(doc.geometry);
    //});
    //
    //db.regions.aggregate({
    //    $project :
    //    {
    //        nation: "$properties.NAME_0",
    //        region: "$properties.NAME_1",
    //        sum: "$properties.sum"
    //    }
    //});

};

/**
 * @param file
 * @param cb {Error}
 */
function saveFile(file, cb) {
    console.log("CALL saveFile " + file);

    async.waterfall([
        function (callback) {
            console.log("CALL: read file");

            fs.readFile(file, 'utf8',

                function (err, data) {
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
        saveJson
    ], function (err) {
        if (err) {
            console.error("WATERFALL ERROR: saveFile");
            console.error("  " + JSON.stringify(err));
        } else {
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
function saveJson(data, callback) {
    console.log("CALL: saveFile");

    var nationJson = jsonlint.parse(data.toString());

    async.each(nationJson.features, saveRegion, function (err) {
        if (err) {
            console.error("ERROR EACH saveJson ");
            console.error("  " + JSON.stringify(err));
        } else {
            console.log("END EACH saveJson");
        }
        callback(err);
    });
}

function saveRegion(features, cb) {
    MongoClient.connect(url, function (err, db) {

        var regionsCollection = db.collection('regions');
        regionsCollection.update(
            {'properties.NAME_1': features.properties.NAME_1},
            features,
            {upsert: true},
            function (err, result) {
                console.log(" regione: " + features.properties.NAME_1);
                db.close();
                if (err) {
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