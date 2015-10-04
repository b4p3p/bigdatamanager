var ConstantsRouter = require('./constants_router');
var StatisticsCtrl = require("../controller/statisticsCtrl");
var MongoClient = require('mongodb').MongoClient;
var async = require('async');
var Data = require("../model/Data");
var _ = require('underscore');

var argContentStatistics = function(datas){

    if (!datas) datas = {};

    return {
        datas: JSON.stringify(datas),
        test: "test"
    };
};

var statisticsError = function(status, message)
{
    if(!status) status = 1;
    if(!message) message = 'error';

    return{
        status: status,
        message: message
    }
};

var _project = null;
var setproject = function(req)
{
    _project = req.session.project;

    //TODO debug
    if(_project == null)
        _project = "oim";
};

function getFilter(req)
{
    var ris = {};

    ris.project = req.session.project;

    if( req.query.nations != null )
        ris.nation = {$in: req.query.nations.split(",")};

    if( req.query.tags != null )
        ris.tag = {$in: req.query.tags.split(",")};

    if( req.query.min != null && req.query.max != null)
        ris.date = {$gt: new Date(req.query.min), $lt: new Date(req.query.max)};

    if(_.keys(ris).length == 0 )
        return null;

    return ris;
}

module.exports = function (app) {

    /**
     * Restituisce statistiche basi dell'utente selezionato
     */
    app.get('/getdata', function (req, res)
    {
        try {
            if (req.session.project == null)
            {
                res.json({});
            }
            else
            {
                var url = 'mongodb://localhost:27017/oim';
                MongoClient.connect(url, function (err, db) {

                    if (err) {
                        callback(err);
                        res.json({});
                        return;
                    }

                    var datas = db.collection('datas');
                    var regions = db.collection('regions');
                    var query = getFilter(req);

                    async.parallel(
                    {
                        data: function (callbackP)
                        {
                            setTimeout(function () {
                                datas.find(query).toArray(function (err, data) {
                                    callbackP(err, data);
                                });
                            }, 1);
                        },

                        minmax: function (callbackP)
                        {
                            var keys = _.keys(query);
                            var values = _.map(keys, function(k) {
                                var obj = {};
                                obj[k] = query[k];
                                return obj;
                            });
                            console.log(values);
                            setTimeout(function () {

                                var match = query ? {$and: values} : {};

                                datas.aggregate(
                                    {
                                        $match: match
                                    },
                                    {
                                        $group: {
                                            _id:"$name",
                                            date_min: {$min: "$date"},
                                            date_max: {$max: "$date"}
                                        }
                                    },
                                    function (err, data) {
                                        if (err)
                                            callbackP(err, null);
                                        else {
                                            var ris = data[0];
                                            callbackP(null, ris);
                                        }
                                    });
                            }, 2); //end timeout
                        },

                        tags: function (callbackP)
                        {
                            setTimeout(function () {

                                datas.distinct("tag", query,
                                    function (err, data) {
                                        if (err)
                                            callbackP(err, null);
                                        else
                                            callbackP(null, data);
                                    });
                            }, 3); //end timeout
                        },

                        otherTag: function (callbackP)
                        {
                            setTimeout(function () {

                                var tmpQuery = query ? _.clone(query) : {};
                                tmpQuery.tag = {$exists: false};

                                datas.find(tmpQuery)
                                    .limit(1)
                                    .count(function (err, data) {
                                        if (err)
                                            callbackP(err, null);
                                        else
                                            callbackP(null, data);
                                    });
                            }, 4); //end timeout
                        },

                        nations: function (callbackP)
                        {
                            setTimeout(function () {
                                datas.distinct("nation", query,
                                    function (err, data) {

                                        if(!err)
                                            data.sort();

                                        if (err)
                                            callbackP(err, null);
                                        else
                                            callbackP(null, data);
                                    });

                            }, 5); //end timeout
                        }

                    },
                        function (err, results)
                        {
                            var obj = {};

                            if (results.minmax) {
                                obj.dateMin = results.minmax.date_min;
                                obj.dateMax = results.minmax.date_max;
                            }

                            obj.tags = results.tags;
                            obj.otherTag = results.otherTag == 1;
                            obj.nations = results.nations;
                            obj.data = results.data;

                            db.close();
                            res.json(obj);
                        }
                    );
                });
            }
        } catch (e) {
            console.error(e);
            console.error(e.stack);
        }
    });

    /**
     * Restituisce i tag utilizzati nei dati
     */
    app.get('/gettags', function (req, res)
    {
        var project = req.session.project;
        if(project == null)
            res.json({status:1,error:"you MUST select a project first"});
        else
        {
            Data.loadTags(project, function(err, array){
                if(err)
                    res.json(JSON.stringify(err));
                else
                    res.json(array);
            });
        }
    });

    /**
     * Effettua un conteggio dei dati raggruppandoli per giorno
     */
    app.get('/gettimeline', function (req, res)
    {
        console.log("GET: /gettimeline");

        var url = 'mongodb://localhost:27017/oim';
        MongoClient.connect(url, function (err, db) {
            var datas = db.collection('datas');
            datas.aggregate({
                $group : {
                    _id: {
                        year : {$year : "$date"},
                        month : {$month : "$date"},
                        day : {$dayOfMonth : "$date"}
                    },
                    count: { $sum: 1 }
                }
            },{
                $sort: {"_id.year":1, "_id.month":1, "_id.day":1 }
            },{
                $project: {
                    _id: 0,
                    date: {
                        $concat: [
                            {"$substr": [ "$_id.year", 0, 4 ] },
                            "-",
                            {"$substr": [ "$_id.month", 0, 2 ] },
                            "-",
                            {"$substr": [ "$_id.day", 0, 2 ] }
                        ]
                    },
                    count: "$count"
                }
            },
            function(err, data){
                if(err || data == null )
                {
                    res.json({status:1, error: err.toString()});
                }
                else
                {
                    var ris = {
                        properties: {
                            first: data[0].date,
                            last: data[ data.length-1 ].date,
                            lenght: data.length
                        },
                        data: {}
                    };
                    for(var i = 0; i < data.length; i++)
                        ris.data[data[i].date] = data[i].count;
                    res.json(ris);
                }
            });
        });
    });

};


/**
 // *  output:
 // *  [
 // *      {
    // *          name: {String}
    // *          geometry: {[]}
    // *          count: {Number}
    // *      } ,
 // *      {...}
 // *  ]
 // */
//app.get('/getregions', function (req, res)
//{
//    var url = 'mongodb://localhost:27017/oim';
//    var coll_datas      = null;
//    var coll_regions    = null;
//    var db              = null;
//    var ris = [];
//    var max = 0;
//    var nations = [];
//
//    if( req.query.nations != null )
//        nations = req.query.nations.split(",");
//
//    console.log(nations);
//
//    setproject(req);
//
//    async.waterfall(
//        [
//            connect,
//            getRegions,
//            processRegions,
//            setAVG
//        ],
//        function(err){
//
//            console.log(" end each");
//
//            if(err)
//            {
//                res.json(JSON.stringify(ris));
//            }
//            else
//            {
//                if(req.query.DEBUG)
//                    for(var i = 0; i < ris.length; i++)
//                        delete ris[i].geometry;
//
//                res.json(ris);
//            }
//        }
//    );
//
//    // connessione al db
//    function connect(next)
//    {
//        console.log("CALL: connect");
//        MongoClient.connect(url, function (err, _db) {
//            coll_datas      = _db.collection('datas');
//            coll_regions    = _db.collection('regions');
//            db = _db;
//            next(null);
//        });
//    }
//
//    //prendo le regioni
//    function getRegions(next)
//    {
//        if( nations.length == 0 )
//        {
//            coll_regions.find({},
//                ["type", "properties", "geometry"])
//                .toArray(function (err, regions) {
//                    console.log(" found: " + regions.length + " regions");
//
//                    next(null, regions);
//                });
//        }
//        else
//        {
//            coll_regions.find( { "properties.NAME_0" : { $in: nations }},
//                ["type","properties", "geometry"])
//                .toArray( function(err, regions ) {
//                    console.log(" found: " + regions.length + " regions");
//
//                    next(null, regions);
//                });
//        }
//    }
//
//    //ciclo sulle regioni
//    function processRegions(regions, next)
//    {
//        console.log(" start each");
//        async.each(regions, makeCounter, function (err) {
//            if(err) next(err); else next(null);
//        });
//    }
//
//    function makeCounter(region, next)
//    {
//        async.waterfall([
//
//            function(waterfall)
//            {
//                region.properties.counter = {};
//
//                Data.loadTags(_project, function(err, array){
//
//                    if(err)
//                        waterfall(err);
//                    else
//                    {
//                        for(var tag in array)
//                            region.properties.counter[array[tag]] = 0;
//                        waterfall(null, region)
//                    }
//
//                });
//            },
//
//            function(region, waterfall)
//            {
//                coll_datas.aggregate(
//                    {"$match":{loc: { $geoWithin: { $geometry: region.geometry } }}},
//                    {"$group":{"_id":"$tag", "sum":{"$sum":1}}}
//                    , function(err, result)
//                    {
//                        var cont = 0;
//
//                        if(result!=null)
//                            result.forEach(function(obj)
//                            {
//                                region.properties.counter[obj._id] = obj.sum;
//                                cont += obj.sum
//                            });
//
//                        if ( cont > max )  max = cont;
//
//                        region.properties.sum = cont;
//                        region.properties.avg = 1;          //TODO calcolare la media
//                        ris.push(region);
//
//                        waterfall(null);
//
//                });
//            }
//
//        ], function(err){
//            if(err) next(err); else next(null);
//        })
//    }
//
//    function setAVG(next)
//    {
//        for(var i = 0; i<ris.length; i++)
//            ris[i].properties.avg = ris[i].properties.sum / max;
//
//        next(null);
//    }
//
//});

