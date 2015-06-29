"use strict";

var DataCtrl = new function(){

    this.FIELD = {
        LAST_UPDATE : {
            KEY: "lastUpdate",
            URL: "/project/lastUpdate"
        },
        STAT: {
            KEY: "stat",
            URL: "/project/stat"
        },
        REGIONSJSON: {
            KEY: "regionsjson",
            URL: "/regions/regions"
        }
    };

    /**
     *
     * @returns {{result: boolean, lastUpdate: Date}}
     */
    this.requireRefresh = function()
    {
        var result = null;
        var lastUpdate = this.getFromUrl( DataCtrl.FIELD.LAST_UPDATE).dateLastUpdate;
        var lastUpdateStorage = localStorage.getItem(DataCtrl.FIELD.LAST_UPDATE.KEY);

        if(lastUpdateStorage == null)
            result = {
                result: true,
                lastUpdate: lastUpdate
            };
        else
        {
            result = {
                result: lastUpdate > lastUpdateStorage,
                lastUpdate: lastUpdate
            };
        }

        if( result.result )
            console.log("require refresh!");
        else
            console.log("no refresh");

        return result;

    };

    this.getFromUrl = function(field)
    {
        console.log("CALL: DataCtrl.getFromUrl\n" +
                    "      url: " + field.URL + " key: " + field.KEY );

        var result = null;

        $.ajax({
            type: "get",
            url: field.URL,
            async: false,

            success: function(data){
                console.log("     success");
                result = data;
            },

            error:function(status, error){
                console.log("     error");
            }

        });

        return result;

    };

    /**
     *
     * @param field {DataCtrl.FIELD}
     */
    this.getField = function(field){

        //localStorage.clear();

        console.log("CALL: getField - key:" + field.KEY);

        var data = null;
        var req = this.requireRefresh();

        if(req.result == true)
        {
            console.log("set new data");

            data = this.getFromUrl(field);
            localStorage.setItem( field.KEY, JSON.stringify(data));
            localStorage.setItem( DataCtrl.FIELD.LAST_UPDATE.KEY, req.lastUpdate);
        }
        else
        {
            data = JSON.parse(localStorage.getItem( field.KEY ));
        }

        return data;

    };

};
