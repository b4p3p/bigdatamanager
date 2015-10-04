"use strict";

var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var mongoose = require('mongoose');
var converter = require('../controller/converterCtrl');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/oim';
var tm = require("text-miner");
var Util = require("../controller/nodeUtil");
var Project = require("../model/Project");

/**
 * Model data
 * @param {SCHEMA[]} data
 * @constructor
 */
var Data = function (data) {
    this.data = data;
};

Data.ResultFile = {
    success: 0,
    fail: 0
};

var MODEL_NAME = "datas";
Data.MODEL_NAME = MODEL_NAME;

var SCHEMA = new mongoose.Schema({
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
    region: String,
    tokens: [String]
},{
    strict: false
});
Data.SCHEMA = SCHEMA;

//Data.SCHEMA.index({ loc: '2dsphere' });

Data.projectName = null;

/**
 * JSON of Data object
 * @type {{}}
 */
Data.prototype.data = {};

/**
 *
 * @param type {String} - "csv" || "json"
 * @param file - name
 * @param projectName {String}
 * @param cb_ris - callback({Error},{Result})
 */
Data.importFromFile = function (type, file, projectName, cb_ris) {

    async.waterfall( [

            // 1) leggo il file
            function (cb_wf)        {

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
            function (data, cb_wf)  {

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

                console.log("  3) salvo il json: length: " + jsonData.length);

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
            },

            // 4) aggiorno il contatore dei dati
            function(resultInsert, next) {

                Project.setSize({project: projectName}, function(err){
                    next(err, resultInsert);
                });

            }

        ],

        // Funzione di errore di waterfall
        function (err, result) {

            var ris = {
                success: result.success.length,
                fail: result.fail.length
            };

            if (err)
            {
                console.log("ERROR WATERFALL Data");
                console.log("   Err: " + err);
                cb_ris(err, null);
            }
            else
            {
                cb_ris(null, ris);
            }
        }
    );

};

/**
 * Restituisce tutti i dati memorizzati del progetto selezionato
 * @param projectName
 * @param query:{Object} - query da passare al componente di mongo
 * @param callback
 */
Data.getDatas = function (projectName, query, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var exec = datas.find({projectName: projectName});

    exec = Util.addWhereClause(exec, query);

    exec.exec(function (err, docs) {

        _.each(docs, function(doc){
            if(doc["nation"] == null) {
                doc["nation"] = "-";
                doc["region"] = "-";
            }
            delete doc._doc["_id"];
        });

        callback(err, docs);
        connection.close();
    });
};

/**
 * Restituisce tutti i dati memorizzati del progetto selezionato
 * @param projectName
 * @param query:{Object} - query da passare al componente di mongo
 * @param callback
 */
Data.getDataFilter = function (projectName, query, callback) {

    //TODO: è possibile ottimizzare usando un aggregate

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    async.parallel({

        //prende i dati
        data: function(next)
        {
            var exec = datas.find({projectName: projectName});
            exec = Util.addWhereClause(exec, query);
            exec.exec(function (err, docs) {
                _.each(docs, function(doc){
                    if(doc["nation"] == null) {
                        doc["nation"] = "-";
                        doc["region"] = "-";
                    }
                    delete doc._doc["_id"];
                });
                next(null, docs);
            });
        },
        //calcola una count sui dati
        count: function(next)
        {
            var exec = datas.find({projectName: projectName});
            exec = Util.addWhereClause(exec, query);
            exec.count(function(err, count){
                next(null, count);
            });
        }

    },function(err, result){
        connection.close();
        callback(err, {
            count: result.count,
            data: result.data
        });
    });

};

/**
 * Restituisce i tag utilizzati nei dati
 * @param projectName {String}
 * @param callback {function(ERROR, Array)} callback - The callback that handles the response
 */
Data.loadTags = function (projectName, callback) {
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

/**
 * Restituisce gli utenti presenti nei dati
 * @param projectName
 * @param arg
 * @param arg.sort:{String}     - campo che si vuole ordinare
 * @param arg.order:{String}    - (opzionale) 'desc' per effettuare un prdinamento descrescente
 * @param callback
 */
Data.getUsers = function(projectName, arg, callback) {

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);
    if(!arg) arg = {};

    var query = datas.aggregate()
        .match({
            projectName: projectName
        })
        .group({
            "_id": {
                u:"$user",
                t:"$tag",
                isGeo: {$gt:["$latitude", null] }
            },
            "sum": {"$sum": 1}
        })
        .group({
            _id: { u:"$_id.u", t:"$_id.t" },
            sum: { $sum:"$sum"},
            counter: { $push:{ isGeo: "$_id.isGeo", sum: "$sum" }}
        })
        .project({
            _id:0,
            user:"$_id.u",
            counter:1,
            sum: 1
        });

    // ordinamento di default
    if( !arg.sort ){
        arg.sort = "sum";
        arg.order = "desc";
    }

    var sort = arg.sort;
    if(arg.order)
        sort = arg.order == "desc" ? "-" + sort : sort;

    query.sort(sort);

    if( arg.limit )
        query.limit( parseInt(arg.limit) );

    query.exec( function(err, docs){
        connection.close();
        callback(err, docs);
    });
};

/**
 * Restituisce le informazioni sui dati degli utenti specificati
 * - Intervallo temporale
 * - Wordcount dei dati
 * @param project
 * @param query
 * @param query.users
 * @param callback
 */
Data.getUserData = function( project , query, callback){

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var users = [];
    if(query.users != null) users = query.users.split(',');

    async.parallel({

        data:function(next)
        {
            getUserData_data(datas, project, users,
                function(err, result){
                    next(err, result)
                })
        },

        wordcount: function(next){
            getUserData_wordcount(datas, project, users,
                function(err, result)
                {
                    next(err, result)
                })
        }

    }, function(err, results){
        connection.close();
        results.data.wordcount = results.wordcount;
        callback(err, results.data );
    });
};

/**
 * Restituisce l'intervallo temporale dei dati appartenenti agli utenti selezionati
 * @param datas:{Collection}
 * @param project
 * @param users:[string]
 * @param callback
 */
function getUserData_data(datas, project, users, callback) {
    datas.aggregate()
        .match({projectName: project, user: {$in:users}})
        .group({
            _id:"$user",
            minDate:{$min:"$date"}, maxDate:{$max:"$date"},
            data:{ $push:{
                text:"$text",  date:"$date",
                tag:"$tag", tokens:"$tokens",
                latitude:"$latitude", longitude:"$longitude"
            }}
        })
        .project({minDate:1, maxDate:1, data:1, _id:0, user:"$_id"})
        .exec(function(err, results){

            if(results.length==0) {
                callback(err, results);
                connection.close();
                return;
            }

            var minDate = results[0].minDate;
            var maxDate = results[0].maxDate;
            _.each(results, function(doc){
                if(doc.minDate < minDate) minDate = doc.minDate;
                if(doc.maxDate > minDate) maxDate = doc.maxDate;
            });

            callback(err, {
                properties:{
                    maxDate:maxDate,
                    minDate:minDate
                },
                data:results
            });
        });
}

/**
 * Calcola il wordcount degli utenti selezionati
 * @param datas
 * @param project
 * @param users
 * @param callback
 */
function getUserData_wordcount(datas, project, users, callback) {

    datas.aggregate()
        .match({projectName: project, user: {$in:users}})
        .unwind("tokens")
        .group({
            _id: {token: "$tokens", user: "$user"},
            size: { $sum : 1 }
        })
        .sort("-size")
        .project({_id:0, user:"$_id.user", token:"$_id.token", size:1})

        .exec(function(err, results){

            var dict = {};
            var dictArr = [];
            async.each(results, function(item, next){

                if( dict[item.token] == null )
                    dict[item.token] = {
                        size:0,
                        users:{}
                    };

                if( dict[item.token].users[item.user] == null )
                    dict[item.token].users[item.user] = item.size;
                else
                    dict[item.token][item.user] = "oooooops";

                dict[item.token].size += item.size;

                next(null);
            }, function(err){
                //_.each(dict, function(value, key){
                //    dictArr.push({ text: key, size: value })
                //});
                callback(err, dict );
            });
        })
}

/**
 *
 * @param arrayData
 * @param projectName
 * @param callback({Error},{Result})
 */
function addDataArray(arrayData, projectName, callback) {

    try {

        //var connection = mongoose.createConnection('mongodb://localhost/oim');
        //var DataModel = connection.model(Data.MODEL_NAME, Data.SCHEMA);
        var cont = 0;
        var url = 'mongodb://localhost:27017/oim';
        MongoClient.connect(url, function (err, db)
        {
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
                    db.close();
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

function getSteps(steps, tot){
    var ris = [];
    for(var i = 1; i <= steps; i++) {
        ris.push( Math.ceil(tot * (i / steps)) )
    }
    return ris;
}

/**
 * Funzione per sovrascrivere i token nei dati
 * La funzione è asincrona, quindi verrà restituito lo status 200 immediatamente
 * Tutta la comunicazione è gestita con socket.io
 * - overrideDataTokens_msg: manda un messaggio generico
 * - overrideDataTokens_end: avvisa della fine
 */
Data.overrideTokensData = function (project, app, callback) {

    /**
     * Sincronizzo il vocabolario con i token inseriti dall'utente e i token
     * calcolati automaticamente (datas.tokens)
     */

    //var connection = mongoose.createConnection('mongodb://localhost/oim');
    //var datas = connection.model(Data.MODEL_NAME, Data.SCHEMA);

    var contSave = 0;
    var contStem = 0;
    var tot = 0;
    var steps = [];
    var fine = false;

    app.io.emit("overrideDataTokens_msg",'GET data');
    console.log("GET data");

    MongoClient.connect( url, function (err, db)
    {
        var datas = db.collection('datas');

        datas.find({projectName:project}).toArray(function(err, docs){

            tot = docs.length;
            steps = getSteps(50, tot);
            console.log("FOUND " + tot + " documents");
            app.io.emit("overrideDataTokens_msg","FILTER " + tot + " documents");

            async.each(docs, function(doc, next){

                var text = Data.cleanText(doc.text);
                var corpus = new tm.Corpus(text);

                corpus.toLower()
                    .removeNewlines()
                    .removeDigits()
                    .removeInvalidCharacters()
                    .removeInterpunctuation()
                    .removeWords(tm.STOPWORDS.IT)
                    .clean();

                var terms = _.filter( tm.Terms(corpus).vocabulary, function(item){

                    //return true;
                    //if( /^rt$/  .test(item) ) return false;
                    if( /^http/ .test(item) ) return false;
                    if( /^@/    .test(item) ) return false;
                    if( /^co\//    .test(item) ) return false;
                    if( /^&quot/    .test(item) ) return false;
                    if( /^\/\//    .test(item) ) return false;
                    if( /^.$/    .test(item) ) return false;
                    return item.length > 2;

                });

                contStem++;
                printPercentage( steps, contStem, app );

                datas.update(
                    { _id: doc._id },
                    {$set:{tokens:terms}},
                    function(err, result){
                        contSave++;
                        printPercentage( steps, contSave, app );
                        next(null);
                    }
                );

            }, function(err){
                callback(null);
            });
        });
    });

    //datas.find({projectName:project}, function(err, docs){
    //
    //    tot = docs.length;
    //    steps = getSteps(50, tot);
    //
    //    app.io.emit("overrideDataTokens_msg","FILTER " + tot + " documents");
    //    console.log("FILTER " + tot + " documents");
    //
    //    async.each(docs, function(doc, next){
    //
    //        var text = Data.cleanText(doc.text);
    //
    //        var corpus = new tm.Corpus(text);
    //
    //        corpus.toLower()
    //            .removeNewlines()
    //            .removeDigits()
    //            .removeInvalidCharacters()
    //            .removeInterpunctuation()
    //            .removeWords(tm.STOPWORDS.IT)
    //            .clean();
    //
    //        var terms = _.filter( tm.Terms(corpus).vocabulary, function(item){
    //
    //            //return true;
    //            //if( /^rt$/  .test(item) ) return false;
    //            if( /^http/ .test(item) ) return false;
    //            if( /^@/    .test(item) ) return false;
    //            if( /^co\//    .test(item) ) return false;
    //            if( /^&quot/    .test(item) ) return false;
    //            if( /^\/\//    .test(item) ) return false;
    //            if( /^.$/    .test(item) ) return false;
    //            return item.length > 2;
    //
    //        });
    //
    //        contStem++;
    //        printPercentage( steps, contStem, app );
    //
    //        doc.update({$set:{tokens:terms}}, function(err){
    //
    //            contSave++;
    //            printPercentage( steps, contSave, app );
    //
    //            next(null);
    //        });
    //
    //    }, function(err){
    //        connection.close();
    //        callback(err);
    //    });
    //});

    function printPercentage(steps, cont, app)
    {
        if( steps.indexOf(cont) == -1 ) return;

        var tot = steps[ steps.length -1 ];
        var percentage = Math.ceil( cont / tot * 100 ); //[1-100]
        var width = 50;
        var limit = Math.ceil(width * percentage / 100 );
        var strProgress = '';
        var strConsole = '';
        var i;

        //progress
        for(i = 0; i < limit; i++)
        {
            strProgress+="#";
            strConsole+="#";
        }

        //padding
        for(i = limit; i < width; i++)
        {
            strConsole+=" ";
            strProgress+="&nbsp;";
        }

        console.log(strConsole + " " + percentage + "%");
        app.io.emit("overrideDataTokens_msg", strProgress + "&nbsp;" + percentage + "%");
    }

};

Data.cleanText = function(text){
    text = text.replace(/'/g, ' ');
    text = text.replace(/&quot;/g, '');
    text = text.replace(/:/g, ' ');
    text = text.replace(/\^/g, ' ');
    text = text.replace(/`/g, ' ');
    text = text.replace(/’/g, ' ');
    return text;
};

/**
 * Restituisce la lista delle sole nazioni presenti nei dati selezionati
 * @param project
 * @param callback
 */
Data.getNations = function (project, callback) {

    console.log("CALL: Data.getNations");

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model("datas", Data.SCHEMA);

    datas.aggregate([
        {$match: {projectName: project}},
        {$group: {
                _id: "$nation",
                sum: {$sum: 1}
            }},
        {$project: {
                _id: 0,
                nation: {$ifNull: ["$_id", "undefined"]},
                sum: 1
            }}
    ], function (err, doc) {
        connection.close();
        callback(err, doc)
    });

};

/**
 * Effettua un count dei dati, raggruppando per giorno/settimana/mese
 * @param project
 * @param query
 * @param query.type:{string} - tipo di raggruppamento
 * @param callback
 */
Data.dateByDate = function(project, query, callback){

    var type = query.type || "day";
    type = (type == "day" || type == "week" || type == "month" ) ? type : "day";

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var datas = connection.model("datas", Data.SCHEMA);
    var exec = datas.aggregate();

    exec.match({projectName: project});

    Util.addMatchClause(exec, query);

    Date.dateByDate_group(exec, type);

    exec.sort("ts");

    Date.dateByDate_project(exec, type);

    exec.exec(function(err, result){
        connection.close();
        callback(err, result);
    });

};

Date.dateByDate_group = function(exec, type) {
    switch(type){
        case "day":
            exec.group({ _id: {
                day: { $dayOfMonth: "$date" },
                month: { $month: "$date" },
                year: { $year: "$date" }
            },
                ts: {$max:"$date"}, count:{$sum:1}
            });
            break;
        case "week":
            exec.group({
                _id: { week: { $week: "$date" },
                        year: { $year: "$date" } },
                ts: {$max:"$date"},
                count:{$sum:1}
            });
            break;
        case "month":
            exec.group({
                _id: {  month: { $month: "$date" },
                        year: { $year: "$date" } },
                ts: {$max:"$date"},
                count:{$sum:1}
            });
            break;
        default:    //anno
            exec.group({
                _id: { year: { $year: "$date" } },
                ts: {$min:"$date"},
                count:{$sum:1}
            });
    }
};

/**
 * Cancella tutti i dati del progetto selezionato
 * @param arg
 * @param arg.connection
 * @param arg.project
 * @param callback
 */
Data.delData = function(arg, callback){
    var connection = arg.connection == null ? mongoose.createConnection('mongodb://localhost/oim') : arg.connection;
    var datas = connection.model("datas", Data.SCHEMA);

    async.parallel({

        //cancello tutti i dati
        deleteData : function(next){
            datas.remove({projectName: arg.project}, function(err, result){
                next(null, result);
            });
        },

        //azzero il contatore
        cont : function(next){
            Project.setSize({
                connection: connection,
                project:arg.project
            }, function(err, res){
                next(err, res);
            })
        }
    }, function(err, res){
        if(arg.connection != null )  arg.connection.close();
        callback(err, res.deleteData)
    })
};

/**
 * Calcola i contatori dei dati
 * - max: data massima
 * - min: data minima
 * - countTot: numero totale dei dati memorizzati
 * - countGeo: numero dei dati che hanno una geolocalizzazione (anche non sincronizzata)
 * @param arg
 * @param arg.connection
 * @param arg.query
 * @param callback
 */
Data.getInfoCount = function(arg, callback){

    var conn = arg.connection ? mongoose.createConnection('mongodb://localhost/oim') : arg.connection;
    var datas = conn.model(Data.MODEL_NAME, Data.SCHEMA);

    var exec = datas.aggregate();

    //filtro con le condizioni specificate
    Util.addMatchClause(exec, arg.query);

    //i dati che non hanno un tag li tratto come se avessero tag undefined
    exec.project({
        date: 1,
        latitude: 1,
        nation: 1,
        tag: { $ifNull: [ "$tag", "undefined" ] }
    });

    //trovo la data minima e massima dei dati filtrati
    exec.group({
        _id:null,
        min: {$min: "$date" },
        max: {$max: "$date" },

        //contatore totale
        countTot: {$sum:1},

        //contatore dei dati che hanno almeno una latitudine
        countGeo: {$sum: {
            "$cond": [ { "$ifNull": ["$latitude", false] }, 1, 0 ]
        }},

        //contatore dei dati che sono stati inseriti all'interno di una regione (sincronizzati)
        countSync: {$sum: {
            "$cond": [ { "$ifNull": ["$nation", false] }, 1, 0 ]
        }},

        //array dei tag
        allTags: {$addToSet: "$tag"},

        geoTags: {$addToSet: {
            "$cond": [ { "$ifNull": ["$latitude", false] }, "$tag", null ]
        }},

        syncTags: {$addToSet: {
            "$cond": [ { "$ifNull": ["$nation", false] }, "$tag", null ]
        }}

    });

    exec.exec(function(err, result){
        if(arg.connection == null) conn.close();

        if( result && result.length > 0 )
        {
            var index = result[0].geoTags.indexOf(null);
            if (index > -1)
                result[0].geoTags.splice(index, 1);

            index = result[0].syncTags.indexOf(null);
            if (index > -1)
                result[0].syncTags.splice(index, 1);

            callback(err, result[0]);
        }
        else
        {
            callback(err, {
                allTags: ["undefined"],
                countTot: 0,
                countGeo: 0,
                countSync: 0,
                min: null,
                max: null
            });
        }

        //se non ho trovato nessun tag, ne aggiungo uno di default
        //if( !result.allTags || result.allTags.length == 0 )
        //    result.allTags = ["undefined"];
        //callback(err, result);
    });

};

/**
 * Calcola il numero dei token distinti nei dati del progetto
 * @param project
 * @param callback
 */
Data.getInfo = function(project, callback){

    var conn = mongoose.createConnection('mongodb://localhost/oim');
    var datas = conn.model(Data.MODEL_NAME, Data.SCHEMA);

    async.parallel({
        countTokens: function(next){
            datas.distinct('tokens', {projectName:project}, function(err, docs){
                next(null, docs.length);
            });
        }
    }, function(err, result){
        conn.close();
        callback(err, result)
    });

};

/**
 * Restituisce solo il numero dei documenti
 * @param arg
 * @param arg.project
 * @param callback
 */
Data.getSize = function(arg, callback){

    var conn = mongoose.createConnection('mongodb://localhost/oim');
    var datas =      conn.model(MODEL_NAME, SCHEMA);

    datas.find({projectName: arg.project}).count(function(err, result){
        callback(err, result)
    });
};

/**
 * Restituisce l'analisi dei bigrammi con la parola trovata
 * @param arg
 * @param arg.word
 * @param arg.project
 * @param callback
 */
Data.getBigram = function(arg, callback){

    var conn = mongoose.createConnection('mongodb://localhost/oim');
    var datas =      conn.model(MODEL_NAME, SCHEMA);

    //richiede solo quei dati che hanno almeno la parola all'interno dei token
    datas.aggregate()
        .match({
            projectName: arg.project,
            tokens: {$in:[ arg.word ]}
        })
        .unwind("tokens")
        .match({tokens: {$ne: arg.word}})
        .project({ _id:0,  tokens:1 })
        .group({
            "_id": "$tokens",
            "size": {"$sum": 1}
        })
        .project({ _id:0, text:'$_id', size:1 })
        .sort({'size':-1})
        .exec(function(err, results)
        {
            conn.close();
            callback(err, results);
        });
};


module.exports = Data;



//
//async.waterfall([
//
//    //prendo tutti i testi
//    function (next)
//    {
//
//        //{ $limit: 100 },
//
//        datas.aggregate(
//
//            { $match: { projectName: project } },
//
//            { $group: {
//                _id: "$tag" ,
//                count: {"$sum": 1} ,
//                documents:{ $push:{ text:"$text" } }
//            }},
//
//            { $project: {
//                _id:0,
//                tag:"$_id",
//                count: 1,
//                documents: 1
//            }}
//
//        ).exec (
//            function (err, doc)
//            {
//                next(null, doc);
//            }
//        );
//    },
//
//    //tokenizzo
//    function(docs, next)
//    {
//        // x ogni tag
//        async.each(docs, function(obj, nextDoc)
//            {
//                var docTag = {
//                    tag: obj.tag,
//                    tags: []
//                };
//
//                // x ogni documento nel tag
//                async.each(obj.documents,
//
//                    function (obj, innerNext)
//                    {
//                        var corpus = new textMiner.Corpus([ obj.text ]);
//
//                        var wordArr = corpus
//                            .clean()
//                            .trim()
//                            .toLower().removeWords(textMiner.STOPWORDS.IT)
//                            .clean().documents.map(function(x){
//                                return x;
//                            });
//
//                        wordArr = wordArr[0].split(' ');
//
//                        async.each(wordArr,
//
//                            function(wa, next){
//
//                                if( wa[0] == '@' )           { next(null); return; }
//                                if(wa.startsWith('rt'))      { next(null); return; }
//                                if(wa.startsWith('http'))      { next(null); return; }
//                                if(docTag.tags[wa] != null ) { next(null); return; }
//
//                                docTag.tags[wa] = true;
//                                next(null);
//                            },
//
//                            function (err) {
//                                innerNext(null)
//                            }
//                        )
//                    },
//
//                    function (err)
//                    {
//                        console.log("elaborato tag " + docTag.tag);
//                        docTag.tags = _.keys(docTag.tags);
//                        docSync.tags.push(docTag);
//                        nextDoc(null);
//                    }
//                );
//
//            },
//
//            function(err)
//            {
//                next(null) ; //next waterfall
//            });
//    },
//
//    //salvo il file
//    function (next) {
//        vocabularies.update(
//            {username:username, project: project},
//            docSync,
//            { upsert:true, w:1 },
//            function (err, result) {
//                next(null);
//            }
//        )
//    }
//
//], function(err, result){
//
//    connection.close();
//    callback(null, docSync);
//
//});
