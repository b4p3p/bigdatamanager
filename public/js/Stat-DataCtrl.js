"use strict";

var formatterData = {
    tokens: function(value, row, index){
        if(value)
            return value.toString();
    },

    date: function(value, row, index){
        var date = new Date(value);
        return date.yyyymmdd();
    },

    nation: function(value, row, index){
        if(value)
            return value;
        else
            return "-";
    }
};


function ShowDataCtrl() {};

ShowDataCtrl.$sliderTimer = null;
ShowDataCtrl.$dataTable = null;
ShowDataCtrl.$cmbTags = null;
ShowDataCtrl.$cmbUsers = null;
ShowDataCtrl.$cmbTerms = null;
ShowDataCtrl.$filterButton = null;
ShowDataCtrl.$restoreButton = null;

ShowDataCtrl.$cmbNations = null;
ShowDataCtrl.$cmbRegions = null;

ShowDataCtrl.data = null;
ShowDataCtrl.filteredData = null;
ShowDataCtrl.stat = null;
ShowDataCtrl.filteredStat = null;
ShowDataCtrl.regions = null;
ShowDataCtrl.filteredRegions = null;
ShowDataCtrl.users = null;
ShowDataCtrl.terms = null;
ShowDataCtrl.bt = null;

ShowDataCtrl.getNationsFilter = function()
{
    var result = [];
    _.each(ShowDataCtrl.stat.data.allTags, function (tag) {
        {
            var obj = {
                id: tag,
                label: tag
            };
            result.push(obj);
        }
    });
    return result;
};

ShowDataCtrl.getRegionsFilter = function()
{
    return [{id: 'Spain', label: 'Spain'}, {id: 'United Kingdom', label: 'United Kingdom'}, {id: null, label: "nongeo"}];
};

ShowDataCtrl.getTagsFilter = function()
{
    var result = [];
    _.each(ShowDataCtrl.stat.data.allTags, function (tag) {
        {
            var obj = {
                id: tag,
                label: tag
            };
            result.push(obj);
        }
    });
    return result;
};

ShowDataCtrl.getUsersFilter = function()
{
    var result = [];
    _.each(ShowDataCtrl.users, function (userObj) {
        {
            var obj = {
                id: userObj.user,
                label: userObj.user
            };
            result.push(obj);
        }
    });
    return result;
};

ShowDataCtrl.initGui = function ()
{
    ShowDataCtrl.$sliderTimer = $('#slider-bar');
    ShowDataCtrl.$cmbTags = $('#cmbTags');
    ShowDataCtrl.$cmbUsers = $('#cmbUsers');
    ShowDataCtrl.$cmbTerms = $('#cmbTerms');
    ShowDataCtrl.$filterButton = $('#cmbFilter');
    ShowDataCtrl.$restoreButton = $('#cmbRestore');
    ShowDataCtrl.$cmbRegions = $('#cmbRegions');
    ShowDataCtrl.$cmbNations = $("#cmbNations");
    ShowDataCtrl.initSlider();

};

ShowDataCtrl.initSlider = function()
{
    console.log("CALL: initSlider");

    ShowDataCtrl.$sliderTimer.dateRangeSlider(
        {
            enabled : true,
            bounds: {
                min: new Date(1950, 1, 1 ) ,
                max: new Date(2050, 1, 1 )
            } ,
            defaultValues:{
                min: new Date(1950, 1, 1 ),
                max: new Date(2050, 1, 1 )
            }
        });
};

ShowDataCtrl.handleClick = function ()
{
    ShowDataCtrl.$filterButton.removeAttr("disabled");
};

ShowDataCtrl.updateTable = function ()
{
    ShowDataCtrl.$dataTable.bootstrapTable('refresh', {silent: true});
};

ShowDataCtrl.getData = function (callback)
{
    console.log("CALL: getData");

    async.parallel({
            //data: function(next)
            //{
            //    DataCtrl.getField( function(doc){
            //
            //        ShowDataCtrl.data = doc;
            //        ShowDataCtrl.filteredData = doc;
            //        next(null, doc);
            //    }, DataCtrl.FIELD.DATA);
            //},
            stat: function(next)
            {
                DataCtrl.getField( function(doc){
                    ShowDataCtrl.stat = doc;
                    next(null, doc);
                }, DataCtrl.FIELD.STAT );
            },
            //
            //regions: function (next)
            //{
            //    DataCtrl.getField(
            //        function(doc)
            //        {
            //            ShowDataCtrl.regions = doc;
            //            ShowDataCtrl.filteredRegions = doc;
            //            next(null, doc);
            //        },
            //        DataCtrl.FIELD.REGIONSJSON
            //    );
            //},
            //
            users: function (next)
            {
                DataCtrl.getField( function(doc){
                    ShowDataCtrl.users = doc;
                    next(null, doc);
                }, DataCtrl.FIELD.USERS, 50);
            //},
            //
            //wordcount: function (next)
            //{
            //    DataCtrl.getField( function(doc)
            //    {
            //        ShowDataCtrl.terms = doc;
            //        next(null, doc);
            //    }, DataCtrl.FIELD.WORDCOUNT);
            }},
        function(err, results) {
           callback();
        }
    );
};


