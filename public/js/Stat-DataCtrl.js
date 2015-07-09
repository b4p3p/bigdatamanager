"use strict";

var formatterData = {
    tokens: function(value, row, index){
        if(value)
            return value.toString();
    },

    date: function(value, row, index){
        var date = new Date(value);
        return date.yyyymmdd();
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

ShowDataCtrl.updateTable = function ()
{
    ShowDataCtrl.$dataTable.bootstrapTable('refresh', {silent: true});
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

ShowDataCtrl.init = function ()
{
    ShowDataCtrl.$dataTable = $("#data-table");
};

ShowDataCtrl.handleClick = function ()
{
    ShowDataCtrl.$filterButton.removeAttr("disabled");
};
