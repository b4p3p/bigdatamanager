"use strict";

var DataCtrl = function(){};

var desiredCapacity = 125 * 1024 * 1024;

DataCtrl.storageIsReady = false;
DataCtrl.storage = new LargeLocalStorage({size: desiredCapacity, name: 'myDb'});

DataCtrl.storage.initialized.then(function(grantedCapacity) {
    // Check to see how much space the user authorized us to actually use.
    // Some browsers don't indicate how much space was granted in which case
    // grantedCapacity will be 1.
    if (grantedCapacity != -1 && grantedCapacity != desiredCapacity) {
        console.log("storage inizializzato");
        DataCtrl.storageIsReady = true;
    }
});

DataCtrl.FIELD = {
    LASTUPDATE : {
        KEY: "lastUpdate",
        URL: "/project/lastUpdate",
    },
    STAT: {
        KEY: "stat",
        URL: "/project/stat",
        LASTUPDATE: "stat-lastupdate"
    },
    DATA: {
        KEY: "data",
        URL: "/datas/datas",
        LASTUPDATE: "data-lastupdate"
    },
    REGIONSJSON: {
        KEY: "regionsjson",
        URL: "/regions/regions",
        LASTUPDATE: "regionsjson-lastupdate"
    },
    USERS: {
        KEY: "users",
        URL: "/datas/users",
        LASTUPDATE: "users-lastupdate"
    },
    WORDCOUNT: {
        KEY: "wordcount",
        URL: "/vocabulary/wordcount",
        LASTUPDATE: "wordcount-lastupdate"
    }
};

/**
 *
 * @param field: @instance {DataCtrl.FIELD.}
 * @param callback
 */
DataCtrl.requireRefresh = function(field, callback)
{
    async.parallel(
        {
            dbLstUpd : function(next){

                console.log("CALL: DataCtrl.requireRefresh - " + field.KEY);

                DataCtrl.storage
                    .getContents(field.LASTUPDATE)
                    .then( function(value)
                    {
                        console.log("    storage lastupdate - key: " + field.LASTUPDATE + " value: " + value);
                        next(null, value);
                    }
                );
            },

            urlLstUpd: function (next) {
                DataCtrl.getFromUrl( DataCtrl.FIELD.LASTUPDATE, null, function(data)
                {
                    next(null, data);
                });
            }

        },

        function(err, result)
        {

            var lastUpdate = result.urlLstUpd.dateLastUpdate;

            if(result.dbLstUpd == null || result.dbLstUpd == "undefined")
            {
                console.log("    require refresh: true (first time)");
                callback({
                    result: true,
                    lastUpdate: lastUpdate
                });
            }else
            {
                var dUrl = new Date(result.urlLstUpd.dateLastUpdate);
                var dDb =  new Date(result.dbLstUpd);
                var result = dUrl > dDb;
                console.log("    require refresh: " + result);
                callback({
                    result: result,
                    lastUpdate: lastUpdate
                });
            }
        }
    );
};

DataCtrl.getFromUrl = function(field, queryString,  callback)
{

    if( !queryString ) queryString = "";

    console.log("CALL: DataCtrl.getFromUrl\n" +
        "      url: " + field.URL + queryString + " key: " + field.KEY );

    $.ajax({
        type: "get",
        url: field.URL + queryString,
        timeout: 1000 * 60, //1m

        success: function(data){
            //console.log("    success");
            callback(data);

        },

        error:function(error){
            console.error("error getFromUrl:\n", error);
            callback(null);
        }

    });
};

DataCtrl.getField = function(callback, field, limit){

    //controllo che sia inizializzato
    if( !DataCtrl.storageIsReady)
    {
        console.log("wait storage...");
        setTimeout( function() {
            DataCtrl.getField(callback, field, limit);
        }, 200);
        return;
    }

    console.log("CALL: getField - key:" + field.KEY);

    DataCtrl.requireRefresh( field, function(result){

        if(result.result == true)
        {
            console.log("set new data");

            async.waterfall([

                //prendo i dati
                function(next){
                    DataCtrl.getFromUrl(field, null, function(data) {
                        next(null, data);
                    });
                },

                //salvo i dati ricevuti
                function(data, next){

                    DataCtrl.storage.setContents(
                        field.KEY, JSON.stringify(data)).then(function()
                        {
                            var lenght = JSON.stringify(data).length;
                            lenght = lenght /  1024 / 1024;
                            lenght = parseFloat(lenght).toFixed(2);
                            console.log("Scritti: " + lenght + " MB - " + field.KEY);
                            next(null, data);
                        }
                    );
                },

                //salvo la data di lettura
                function(data, next){

                    DataCtrl.storage.setContents(
                        field.LASTUPDATE, result.lastUpdate).then(function()
                        {
                            console.log("    set lastupdate at " + result.lastUpdate);
                            next(null, data);
                        }
                    );
                }

            ], function(err, data){
                callback(data);
            })
        }
        else
        {
            //leggo il contenuto memorizzato
            DataCtrl.storage.getContents(
                field.KEY).then(function(contents)
                {
                    var lenght = parseFloat(contents.length / 1024 / 1024).toFixed(2);
                    console.log("Letti: " + lenght + " MB - " + field.KEY);
                    callback(JSON.parse(contents));
                }
            );
        }
    });
};

/**
 *
 * @param field - {KEY:string, URL:string}
 */

