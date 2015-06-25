/**
 * Created by annarita on 24/05/15.
 */
var fs = require('fs');
var jsonlint = require("jsonlint");
var async = require("async");
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var _ = require("underscore");

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Any = new mongoose.Schema({ any: Schema.Types.Mixed });
var SchemaData = require("../model/Data").DATA_SCHEMA;

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

/**
 *
 * @param fileNames
 * @param callback - fn(err, { keyfile: {insert:{Number}, discard:{Number} }
 */
Regions.importFromFile = function (fileNames, callback)
{
    var ris = {};

    MongoClient.connect(url, function (err, db) {

        var regions = db.collection('regions');

        async.each( fileNames,

            //save file
            function (file, cb)
            {
                console.log("CALL saveFile " + file.path);

                var path = file.path;
                var contDiscard = 0;
                var contInsert = 0;

                async.waterfall(

                    [

                        //read file
                        function (callback)
                        {

                            console.log("CALL: read file");

                            fs.readFile(path , "utf-8",

                                function (err, data) {
                                    if (err) {
                                        console.error("ERROR: fs.readFile");
                                        console.error(JSON.stringify(err));
                                        callback( {status: 100, message: err.toString() });
                                    }
                                    else {
                                        callback(null, data);
                                    }
                                }
                            );
                        },

                        //saveFile
                        function (data, callback)
                        {
                            console.log("CALL: saveFile");

                            var nationJson = jsonlint.parse(data.toString());

                            //salvo ciascuna regione del file
                            async.each( nationJson.features,

                                function(features, cb)
                                {
                                    regions.save( features, function (err)
                                    {
                                        err ? contDiscard++ : contInsert++;
                                        cb(null);
                                    });

                                },

                                //end each save
                                function (err)
                                {
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
                    function (err)
                    {
                        if (err)
                        {
                            console.error("WATERFALL ERROR: saveFile");
                            console.error("  " + JSON.stringify(err));
                        }
                        else
                        {
                            console.log("END WATERFALL");
                        }

                        cb(err);
                    }

                );
            },

            //end each file
            function (err)
            {
                if (err) {
                    console.error("EACH ERROR: importFromFile");
                    console.error("  " + JSON.stringify(err));
                }
                else
                {
                    console.log("END EACH");
                }

                db.close();
                callback(err, ris);
            }
        );

    });

};

/**
 * @param callback - fn({Err},{Data[]})
 */
Regions.getLightRegions = function (callback)
{

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
};

/**
 * @param callback  - fn({Err},{Data[]})
 */
Regions.getLightNations = function (callback)
{
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
        ).each (
            function (err, region)
            {
                if(!region && cont==0 && first)  //non ci sono regioni
                {
                    callback(null, {} );
                    return;
                }

                first = false;

                if(!region) return;

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
                    function (err, doc)
                    {
                        if(!doc || doc.length == 0){

                            cont--;

                            if ( cont == 0)
                            {
                                var keys = _.keys(ris);
                                ris = _.map(keys, function(k) {
                                    return { nation: ris[k].nation, sum: ris[k].sum }
                                });
                                db.close();
                                callback(null, ris);
                            }

                            return;
                        }

                        cont--;
                        //console.log(doc[0].nation + " " + doc[0].nation + " " + doc[0].sum);

                        if( !ris[doc[0].nation] )
                            ris[doc[0].nation] = { nation: doc[0].nation, sum: doc[0].sum};
                        else
                            ris[doc[0].nation].sum += doc[0].sum;

                        if ( cont == 0)
                        {
                            console.log("FINE");
                            var keys = _.keys(ris);
                            ris = _.map(keys, function(k) {
                                return { nation: ris[k].nation, sum: ris[k].sum }
                            });
                            db.close();
                            callback(null, ris);
                        }
                    }
                )}
        )
    }
    );
};

/**
 * @param region    - {String}
 * @param callback  - fn({Err},{Data[]})
 */
Regions.removeNation = function(nation, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Regions = connection.model("regions", Any);
    var Datas = connection.model("datas", SchemaData );
    var ris = {
        deletedRegion: 0,
        updatedData: 0
    };

    async.waterfall(
        [
            //rimuovo le regioni della nazione selezionata
            function(next)
            {
                Regions.remove({"properties.NAME_0": nation}, function(err, result)
                {
                    ris.deletedRegion = result.result.n;
                    next(null);
                });
            },


            //rimuovo dai dati il riferimento delle regioni
            function(next){

                Datas.update(
                    {nation:nation},
                    {$unset: { nation: true, region: true } },
                    {multi: true, safe: false} ,
                    function(err, result){
                        ris.updatedData = result.n;
                        next(null);
                    }
                );

            }

        ],

        function(err){
            callback(err, ris);
        }
    );

};

/**
 *
 * @param callback
 */
Regions.getRegions = function(projectName, arg_nations, arg_tags,  callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Regions = connection.model("regions", Any);
    var Datas = connection.model("datas", Any);

    var queryNations = arg_nations.length > 0 ? { "properties.NAME_0": {$in: arg_nations } } : {};
    var queryTags = arg_tags.length > 0 ? { "_id.t" : { $in: arg_tags } } : { _id: { $exists: true } };

    var maxSum = 0;
    var totRegions = 0;
    var cont = 0;
    var ris = [];
    var dict = {};
    var tags = [];

    async.waterfall(
        [

            //prendo la maggior parte dei dati
            function(next){

                Regions.find(queryNations, function (err, regions) {

                    console.log("CALL: Region.getRegion - #regions %s" , regions.length);

                    if( regions.length == 0 )
                    {
                        callback(null, {});
                        return;
                    }

                    totRegions = regions.length;

                    for(var i in regions)
                    {
                        var region = regions[i]._doc;
                        ris.push(region);
                        dict[region._id.id] = i;

                        //{$geoWithin: {$geometry: region.geometry} };
                        //{tag: { $in: arg_tags } };

                        //var cond = [];
                        //cond.push ( {$geoWithin: {$geometry: region.geometry} } );
                        //cond.push ( {tag: { $in: arg_tags } } );

                        //queryTags["loc"] = {$geoWithin: {$geometry: region.geometry} };

                        Datas.aggregate(

                            { "$match": {
                                projectName: projectName,
                                loc: { $geoWithin: { $geometry: region.geometry} } }
                            },

                            {"$group": {
                                "_id": { t:"$tag", r:"$properties.NAME_0" } ,
                                "subtotal": {"$sum": 1}}},

                            { "$match": queryTags } ,

                            { $group:  {
                                _id:"$_id.r",
                                counter:{ $push:{tag:"$_id.t", subtotal:"$subtotal"} },
                                sum:{ $sum:"$subtotal"}}},

                            {"$project": {
                                _id: 1,
                                counter: 1,
                                nation: { $literal: region.properties.NAME_0 },
                                region: { $literal: region.properties.NAME_1 },
                                IDregion: { $literal: region._id.id },
                                sum: "$sum" }},
                            function(err, risGroup){

                                //if(cont==0)
                                //    console.log("##(1)##  group by tag ####");

                                cont++;

                                if(risGroup && risGroup[0]){
                                    //console.log("%d) %s - %s - %d",cont, risGroup[0].nation, risGroup[0].region, risGroup[0].sum);

                                    var index = dict[risGroup[0].IDregion];
                                    ris[index].properties.sum = risGroup[0].sum;

                                    maxSum = Math.max(risGroup[0].sum, maxSum);

                                    var counter = {};
                                    for( var i in risGroup[0].counter )
                                        counter[risGroup[0].counter[i].tag] = risGroup[0].counter[i].subtotal;

                                    ris[index].properties.counter = counter;
                                }
                                else{
                                    //console.log("%d) ND", cont);
                                }


                                if(cont == totRegions)
                                {
                                    //console.log("##(1)## end group by tag ####");
                                    next(null);
                                }
                            }
                        );
                    }
                });

            }

            ////prendo tutti i tag
            //,function(next){
            //    Datas.distinct("tag", function(err, distinctTags){
            //
            //        tags = _.invert(distinctTags);
            //        for(var k in tags){ tags[k] = 0 }
            //
            //        next(null);
            //    })
            //}

            //completo con i dati mancanti
            ,function(next){

                for( var i in ris )
                {
                    if(!ris[i].properties.counter) ris[i].properties.counter = {}
                    if(!ris[i].properties.sum) ris[i].properties.sum = 0
                    ris[i].properties.avg = ris[i].properties.sum / maxSum;
                }

                next(null);

            }
        ],

        function(err){

            connection.close();
            callback(null, ris);
        }

    );



    //MongoClient.connect(url, function (err, db) {
    //
    //    var regions = db.collection('regions');
    //    var datas = db.collection('datas');
    //    var tot = 0;
    //    var contCount = 0;
    //    var contAgg = 0;
    //    var ris = [];
    //    var dict = {};
    //
    //    regions.find().each ( function( err, region ) {
    //
    //        if(!region) return;
    //
    //        var tmp = "ciao";
    //
    //        ris.push(region);
    //        dict[region.properties.NAME_1] = tot;
    //        tot++;
    //
    //        datas.find({ loc: {$geoWithin: {$geometry: region.geometry}}}).count( function(err, count){
    //
    //            ris[contCount].properties.sum = count;
    //
    //            console.log(ris[contCount].properties.NAME_1 + " " + ris[contCount].properties.sum)
    //
    //            contCount++;
    //
    //            if(contCount == tot){
    //                db.close();
    //                callback(null, ris);
    //            }
    //
    //        });
    //
    //    });


        //
        //datas.aggregate(
        //    {"$match": { loc: {$geoWithin: {$geometry: region.geometry}}}},
        //    {"$group": {
        //        "_id": null ,
        //        "sum": {"$sum": 1}}},
        //    {"$project": {
        //        _id: 1,
        //        nation: region.properties.NAME_0,
        //        sum: "$sum" }}
        //).each ( function( err, result ) {
        //
        //    contAgg++;
        //
        //    if(contAgg == cont){
        //        callback(null, ris);
        //        db.close();
        //        return;
        //    }
        //
        //    if(result)
        //    {
        //        console.log(result.sum);
        //        //var index = dict[result._id];
        //        //console.log( ris[index].properties.NAME_0 + " - " + ris[index].properties.NAME_1 + " - " + result.sum );
        //    }
        //    else
        //        console.log("ND");
        //});

        //regions.find({},{"geometry":1, "properties.NAME_0":1, "properties.NAME_1":1} ).each(
        //    function (err, region)
        //{
        //    if( region == null ) return;
        //
        //    cont++;
        //
        //    datas.aggregate(
        //        {
        //            "$match":{ loc: { $geoWithin: { $geometry: region.geometry } }}
        //        },
        //        {
        //            "$group":{
        //            "_id":null ,
        //            "sum":{"$sum":1}}
        //        },
        //        {
        //            "$project": {
        //                _id: 1 ,
        //                nation:     { $literal: region.properties.NAME_0 } ,
        //                nameRegion: { $literal: region.properties.NAME_1 } ,
        //                sum:        { $ifNull: [ "$description", 0 ] }
        //            }
        //        },
        //        function(err, result) {
        //
        //            if ( result.length == 0)
        //            {
        //                console.log("niente...");
        //            }
        //            else
        //            {
        //                ris.push(result[0].nation);
        //                console.log(result[0].nation);
        //            }
        //        }
        //    );
        //});
    //});
};

module.exports = Regions;
