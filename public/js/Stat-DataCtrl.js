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
ShowDataCtrl.nations = null;

ShowDataCtrl.getNationsFilter = function()
{
    var result = [];
    var nation;
    _.each(ShowDataCtrl.nations, function (nationObj) {
        {
            if(nationObj.nation == "undefined")
                nation = "Not geolocated";
            else
                nation = nationObj.nation;
            var obj = {
                id: nation,
                label: nation.charAt(0).toUpperCase() + nation.slice(1)
            };
            result.push(obj);
        }
    });
    return result;
};

ShowDataCtrl.getRegionsFilter = function()
{
    var result = [];
    var region;
    _.each(ShowDataCtrl.stat.data.nations, function(nationObj)
    {
        _.each(nationObj.regions, function (regionObj) {
            {
                region = regionObj.name;
                var obj = {
                    id: region,
                    label: region.charAt(0).toUpperCase() + region.slice(1)
                };
                result.push(obj);
            }
        });
    });

    return result;
};

ShowDataCtrl.getTagsFilter = function()
{
    var result = [];
    _.each(ShowDataCtrl.stat.data.allTags, function (tag) {
        {
            var obj = {
                id: tag,
                label: tag.charAt(0).toUpperCase() + tag.slice(1)
            };
            result.push(obj);
        }
    });
    return result;
};

ShowDataCtrl.getUsersFilter = function()
{
    var result = [];
    var count = 1;
    _.each(ShowDataCtrl.users, function (userObj) {
        {
            if(count <= 50)
            {
                var obj = {
                    id: userObj.user,
                    label: userObj.user
                };
                count++;
                result.push(obj);
            }
        }
    });
    return result;
};

//ShowDataCtrl.initGui = function ()
//{
//    ShowDataCtrl.$sliderTimer = $('#slider-bar');
//    ShowDataCtrl.$cmbTags = $('#cmbTags');
//    ShowDataCtrl.$cmbUsers = $('#cmbUsers');
//    ShowDataCtrl.$cmbTerms = $('#cmbTerms');
//    ShowDataCtrl.$filterButton = $('#cmbFilter');
//    ShowDataCtrl.$restoreButton = $('#cmbRestore');
//    ShowDataCtrl.$cmbRegions = $('#cmbRegions');
//    ShowDataCtrl.$cmbNations = $("#cmbNations");
//    ShowDataCtrl.initSlider();
//
//};
//
//ShowDataCtrl.initSlider = function()
//{
//    console.log("CALL: initSlider");
//
//    ShowDataCtrl.$sliderTimer.dateRangeSlider(
//        {
//            enabled : true,
//            bounds: {
//                min: new Date(1950, 1, 1 ) ,
//                max: new Date(2050, 1, 1 )
//            } ,
//            defaultValues:{
//                min: new Date(1950, 1, 1 ),
//                max: new Date(2050, 1, 1 )
//            }
//        });
//};
//
//ShowDataCtrl.handleClick = function ()
//{
//    ShowDataCtrl.$filterButton.removeAttr("disabled");
//};

ShowDataCtrl.updateTable = function ()
{
    ShowDataCtrl.$dataTable.bootstrapTable('refresh', {silent: true});
};

ShowDataCtrl.getData = function (callback)
{
    console.log("CALL: getData");

    async.parallel({
            stat: function(next)
            {
                DataCtrl.getField( function(doc){
                    ShowDataCtrl.stat = doc;
                    next(null, doc);
                }, DataCtrl.FIELD.STAT );
            },
            nations: function(next)
            {
                DataCtrl.getField( function(doc){
                    ShowDataCtrl.nations = doc;
                    next(null, doc);
                }, DataCtrl.FIELD.NATIONS );
            },
            users: function (next)
            {
                DataCtrl.getField( function(doc){
                    ShowDataCtrl.users = doc;
                    next(null, doc);
                }, DataCtrl.FIELD.USERS );
            }},
        function(err, results) {
           callback();
        }
    );
};


