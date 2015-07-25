"use strict";

var bootstrapTableFilter = new BootstrapTableFilter('showdatafilter');

var formatterData = {
    tokens: function(value, row, index){
        if(value)
            return value.join(", ");
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

ShowDataCtrl.$dataTable = null;

ShowDataCtrl.$cmbTags = null;
ShowDataCtrl.$cmbUsers = null;
ShowDataCtrl.$cmbTokens = null;
ShowDataCtrl.$cmbNations = null;
ShowDataCtrl.$cmbRegions = null;
ShowDataCtrl.page = 1;

ShowDataCtrl.selectedRegions = null;
ShowDataCtrl.selectedNations = null;
ShowDataCtrl.selectedTags = null;
ShowDataCtrl.selectedTokens = null;
ShowDataCtrl.selectedUsers = null;

ShowDataCtrl.count = null;
ShowDataCtrl.stat = null;
ShowDataCtrl.users = null;
ShowDataCtrl.tokens = null;

ShowDataCtrl.skip = 0;
ShowDataCtrl.limit = 10;

ShowDataCtrl.getData = function (callback)
{
    console.log("CALL: getData");

    async.parallel({
            stat: function(next)
            {
                DataCtrl.getField( function(doc){
                    ShowDataCtrl.stat = doc;
                    ShowDataCtrl.tags = doc.data.allTags;
                    ShowDataCtrl.count = doc.data.countTot;
                    next(null, doc);
                }, DataCtrl.FIELD.STAT );
            },

            users: function (next)
            {
                DataCtrl.getField( function(doc){
                    ShowDataCtrl.users = doc;
                    next(null, doc);
                }, DataCtrl.FIELD.USERS );
            },

            wordcount: function (next)
            {
                DataCtrl.getField( function(doc)
                {
                    ShowDataCtrl.tokens = doc;
                    next(null, doc);
                }, DataCtrl.FIELD.WORDCOUNT);
            }},

        function(err, results) {
            callback();
        }
    );
};

ShowDataCtrl.initGui = function ()
{
    console.log("CALL: initGui");

    ShowDataCtrl.$cmbNations = $('#cmbNations');
    ShowDataCtrl.$cmbRegions = $('#cmbRegions');
    ShowDataCtrl.$cmbTags = $('#cmbTags');
    ShowDataCtrl.$cmbTokens = $('#cmbTokens');
    ShowDataCtrl.$cmbUsers = $('#cmbUsers');

    ShowDataCtrl.initComboNations();
    ShowDataCtrl.initComboRegions();
    ShowDataCtrl.initComboTags();
    ShowDataCtrl.initComboUsers();
    ShowDataCtrl.initComboTokens();

    bootstrapTableFilter.showFilter();
    $('.selectpicker').selectpicker('refresh');
    ShowDataCtrl.$cmbRegions.multiselect('refresh');

};

ShowDataCtrl.initComboNations = function()
{
    console.log("CALL: initComboNations");

    _.each(ShowDataCtrl.stat.data.nations, function(obj){
        if(obj.count > 0)
            DomUtil.addOptionValue(ShowDataCtrl.$cmbNations, obj.name);
    });
};

ShowDataCtrl.initComboRegions = function()
{
    console.log("CALL: initComboRegions");

    ShowDataCtrl.$cmbRegions.multiselect();
    var optgroups = ShowDataCtrl.setComboRegionsData();
    ShowDataCtrl.$cmbRegions.multiselect( optgroups.length == 0? 'disable' : 'dataprovider', optgroups);
};

ShowDataCtrl.setComboRegionsData = function()
{
    console.log("CALL: setComboRegionsData");

    var ris = [];
    var cont = 0;
    _.each(ShowDataCtrl.stat.data.nations, function(obj){
        if(obj.count > 0) {
            var nation = {
                label: obj.name,
                children: []
            };

            _.each(obj.regions, function (region) {
                if (region.count > 0) {
                    var child = {
                        label: region.name,
                        value: cont++
                    };
                    nation.children.push(child);
                }
            });
            ris.push(nation);
        }
    });
    return ris;
};

ShowDataCtrl.initComboTags = function()
{
    console.log("CALL: initComboTags");

    _.each(ShowDataCtrl.tags, function(obj){
        DomUtil.addOptionValue(ShowDataCtrl.$cmbTags, obj);
    });
};

ShowDataCtrl.initComboUsers = function()
{
    console.log("CALL: initComboUsers");

    var obj = null;
    for (var i = 0; i < 50 && i < ShowDataCtrl.users.length; i++ )
    {
        obj = ShowDataCtrl.users[i];
        DomUtil.addOptionValue(ShowDataCtrl.$cmbUsers, obj.user, obj.sum);
    }
};

ShowDataCtrl.initComboTokens = function()
{
    console.log("CALL: initComboTokens");

    _.each(ShowDataCtrl.tokens.syncDataTags, function (obj, key) {
        var terms = [];
        var count = [];

        _.each(obj, function (row, key) {
            terms.push(row.token);
            count.push(row.count);
        });

        DomUtil.addOptionGroup(ShowDataCtrl.$cmbTokens, key, terms, count);
    });
};

ShowDataCtrl.updateTable = function ()
{
    console.log("CALL: updateTable");
    ShowDataCtrl.$dataTable.bootstrapTable('refresh', {silent: true});
};

ShowDataCtrl.refreshGui = function() {
    ShowDataCtrl.skip = 0;
    ShowDataCtrl.limit = $($('#menuDataNum li.active')[0]).text();
    ShowDataCtrl.refreshTable();
    $('#pagination').bootpag(
        {
            page: 1
        });
    ShowDataCtrl.page = 1;
};

ShowDataCtrl.refreshTable = function ()
{
    console.log("CALL: refreshTable");

    var date = {};
    if( $('#lteCh').is(':checked') && $('#lte').val()!="" )
        date['max'] = $('#lte').val();
    if( $('#gteCh').is(':checked') && $('#gte').val()!="" )
        date['min'] = $('#gte').val();
    if( $('#eqCh').is(':checked') && $('#eq').val()!="" )
        date['eq'] =  $('#eq').val();

    var conditions = new ObjConditions(
        ShowDataCtrl.$cmbNations,
        ShowDataCtrl.$cmbRegions,
        ShowDataCtrl.$cmbTags,
        ShowDataCtrl.$cmbUsers,
        ShowDataCtrl.$cmbTokens,
        date,
        ShowDataCtrl.skip,
        ShowDataCtrl.limit
    );

    var queryString = conditions.getQueryString();

    DataCtrl.getFromUrl(DataCtrl.FIELD.DATAFILTER, queryString, function(doc) {
        ShowDataCtrl.count = doc.count;
        $('#pagination').bootpag(
            {
                total: parseInt(ShowDataCtrl.count / parseInt($($('#menuDataNum li.active')[0]).text())) + 1,
            });
        var value = $($('#menuDataNum li.active')[0]).text();
        $('#dataNum').text("Showing " +  ShowDataCtrl.page + " to "+ value + " of " + doc.count + " rows ");
        $('#data-table').bootstrapTable('load', doc.data);
    });
};

ShowDataCtrl.deselectCombo = function ()
{
    console.log("CALL: deselectCombo");

    DomUtil.deselectAll(ShowDataCtrl.$cmbUsers);
    DomUtil.deselectAll(ShowDataCtrl.$cmbNations);
    DomUtil.deselectAll(ShowDataCtrl.$cmbRegions);
    DomUtil.deselectAll(ShowDataCtrl.$cmbTags);
    DomUtil.deselectAll(ShowDataCtrl.$cmbTokens);
    $('.filter-enabled').prop('checked', false);
    $('.form-control').val('');

    ShowDataCtrl.$cmbRegions.multiselect('refresh');
    $('.selectpicker').selectpicker('refresh');

    ShowDataCtrl.refreshGui();
};

var ObjConditions = function($cmbNations, $cmbRegions, $cmbTags, $cmbUsers, $cmbTokens, date, skip, limit)
{
    this.$cmbNations = $cmbNations;
    this.$cmbRegions = $cmbRegions;
    this.$cmbTags = $cmbTags;
    this.$cmbUsers = $cmbUsers;
    this.$cmbTokens = $cmbTokens;
    this.date = date;
    this.skip = skip;
    this.limit = limit;
    this.queryString = "";
    this.value = {};

    this.create = function() {

        var arrayQueryString = [];
        var regions = DomUtil.getSelectedCombo(this.$cmbRegions);
        var nations = DomUtil.getSelectedCombo(this.$cmbNations);
        var tags = DomUtil.getSelectedCombo(this.$cmbTags);
        var users = DomUtil.getSelectedCombo(this.$cmbUsers);
        var tokens = DomUtil.getSelectedCombo(this.$cmbTokens);

        if(nations.length > 0)
            arrayQueryString.push("nations=" + nations.join(","));

        if(regions.length > 0)
            arrayQueryString.push("regions=" + regions.join(","));

        if(tags.length > 0)
            arrayQueryString.push("tags=" + tags.join(","));

        if(tokens.length > 0)
            arrayQueryString.push("tokens=" + tokens.join(","));

        if(users.length > 0)
            arrayQueryString.push("users=" + users.join(","));

        if(this.date.hasOwnProperty('min'))
            arrayQueryString.push("start=" + this.date['min']);

        if(this.date.hasOwnProperty('max'))
            arrayQueryString.push("end=" + this.date['max']);

        if(this.date.hasOwnProperty('eq'))
            arrayQueryString.push("eq=" + this.date['eq']);

        arrayQueryString.push("limit=" + this.limit);
        arrayQueryString.push("skip=" + this.skip);

        if( arrayQueryString != [] )
            this.queryString = "?" + arrayQueryString.join("&");

        this.value = {
            queryString : this.queryString,
            conditions: {
                nations : nations,
                regions: regions,
                tags: tags,
                users: users,
                tokens: tokens,
                interval: this.date
            }
        };

    };

    this.create();

    this.getQueryString = function()
    {
        return this.value.queryString;
    };

    this.getConditions = function()
    {
        return this.value.conditions;
    };

};