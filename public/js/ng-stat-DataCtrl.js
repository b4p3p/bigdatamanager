"use strict";

var bootstrapTableFilter = null;

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

function ShowDataCtrl() {}

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

//ShowDataCtrl.getData = function (callback)
//{
//    console.log("CALL: getData");
//
//    async.parallel( {
//            stat: function(next)
//            {
//                DataCtrl.getField( function(doc){
//                    ShowDataCtrl.stat = doc;
//                    ShowDataCtrl.tags = doc.data.allTags;
//                    ShowDataCtrl.count = doc.data.countTot;
//                    next(null, doc);
//                }, DataCtrl.FIELD.STAT );
//            },
//
//            users: function (next)
//            {
//                DataCtrl.getField( function(doc){
//                    ShowDataCtrl.users = doc;
//                    next(null, doc);
//                }, DataCtrl.FIELD.USERS );
//            },
//
//            wordcount: function (next)
//            {
//                DataCtrl.getField( function(doc)
//                {
//                    ShowDataCtrl.tokens = doc;
//                    next(null, doc);
//                }, DataCtrl.FIELD.WORDCOUNT);
//            }},
//        function(err, results) {
//            callback();
//        }
//    );
//};

ShowDataCtrl.initGui = function () {
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

ShowDataCtrl.initComboNations = function() {
    console.log("CALL: initComboNations");

    _.each(ShowDataCtrl.stat.data.nations, function(obj){
        if(obj.count > 0)
            DomUtil.addOptionValue(ShowDataCtrl.$cmbNations, obj.name);
    });
};

ShowDataCtrl.initComboRegions = function() {
    console.log("CALL: initComboRegions");

    ShowDataCtrl.$cmbRegions.multiselect({
        nonSelectedText: 'Regions'
    });
    var optgroups = ShowDataCtrl.setComboRegionsData();
    ShowDataCtrl.$cmbRegions.multiselect( optgroups.length == 0 ? 'disable' : 'dataprovider', optgroups);
};

ShowDataCtrl.setComboRegionsData = function() {
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

ShowDataCtrl.initComboTags = function() {
    console.log("CALL: initComboTags");

    _.each(ShowDataCtrl.tags, function(obj){
        DomUtil.addOptionValue(ShowDataCtrl.$cmbTags, obj);
    });
};

ShowDataCtrl.initComboUsers = function() {
    console.log("CALL: initComboUsers");

    var obj = null;
    for (var i = 0; i < 50 && i < ShowDataCtrl.users.length; i++ )
    {
        obj = ShowDataCtrl.users[i];
        DomUtil.addOptionValue(ShowDataCtrl.$cmbUsers, obj.user, obj.sum);
    }
};

ShowDataCtrl.initComboTokens = function() {
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

/**
 *  Funzione chiamata anche dal click sul filtro
 */
ShowDataCtrl.refreshTable = function (noCondictions) {

    console.log("CALL: refreshTable - noCondictions=" + noCondictions);

    var queryString = "";

    if( !noCondictions )
    {
        var date = {};
        if( $('#lteCh').is(':checked') && $('#lte').val()!="" )
            date['max'] = $('#lte').val();
        if( $('#gteCh').is(':checked') && $('#gte').val()!="" )
            date['min'] = $('#gte').val();
        if( $('#eqCh').is(':checked') && $('#eq').val()!="" )
            date['eq'] =  $('#eq').val();

        var conditions = new ShowDataCtrl.ObjConditions(
            ShowDataCtrl.$cmbNations,
            ShowDataCtrl.$cmbRegions,
            ShowDataCtrl.$cmbTags,
            ShowDataCtrl.$cmbUsers,
            ShowDataCtrl.$cmbTokens,
            date,
            ShowDataCtrl.skip,
            ShowDataCtrl.limit,
            $('#txtText').val()
        );
        queryString = conditions.getQueryString();
    }else{

        var conditions = new ShowDataCtrl.ObjConditions(
            null,
            null,
            null,
            null,
            null,
            null,
            ShowDataCtrl.skip,
            ShowDataCtrl.limit,
            null
        );
        queryString = conditions.getQueryString();
    }

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

ShowDataCtrl.deselectCombo = function () {
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

ShowDataCtrl.ObjConditions = function(
    $cmbNations, $cmbRegions, $cmbTags, $cmbUsers,
    $cmbTokens, date, skip, limit, text) {

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

        if( this.date )
        {
            if(this.date.hasOwnProperty('min'))
                arrayQueryString.push("start=" + this.date['min']);

            if(this.date.hasOwnProperty('max'))
                arrayQueryString.push("end=" + this.date['max']);

            if(this.date.hasOwnProperty('eq'))
                arrayQueryString.push("eq=" + this.date['eq']);
        }

        if(text != null && text != '' )
            arrayQueryString.push("text=" + encodeURIComponent( text ) );

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
                interval: this.date,
                text: text
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

ngApp.controller('ngStatDataCtrl', ['$scope', function($scope) {

    var bootPagOpt = {
        total: parseInt(ShowDataCtrl.count / parseInt($($('#menuDataNum li.active')[0]).text()))+1,
        page: 1,
        maxVisible: 5,
        leaps: true,
        firstLastUse: true,
        first: '‹',
        last: '›',
        wrapClass: 'pagination',
        activeClass: 'active',
        disabledClass: 'disabled',
        nextClass: 'next',
        prevClass: 'prev',
        lastClass: 'last',
        firstClass: 'first'
    };

    var $table = $('#data-table');
    var $btnLoad = $('#load');
    var $container = $('#container');
    var $spinner = $("#spinner");
    var $msgproject = $("#msgProject");
    var $removeFilter = $("#removeFilters");

    function showTable (){
        $table.removeClass("hidden");
        $btnLoad.removeClass("hidden");
    }

    function getData (callback) {

        console.log("CALL: getData");

        async.parallel( {

                stat: function(next) {
                    DataCtrl.getField( function(doc){
                        try {
                            ShowDataCtrl.stat = doc;
                            ShowDataCtrl.tags = doc.data.allTags;
                            ShowDataCtrl.count = doc.data.countTot;
                            next(null, doc);
                        } catch (e) {
                            next(e, null);
                        }
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
                    DataCtrl.getField( function(doc) {
                        ShowDataCtrl.tokens = doc;
                        next(null, doc);
                    }, DataCtrl.FIELD.WORDCOUNT);
                }},

            function(err, results) {
                $spinner.hide();
                callback(err, results);
            }
        );
    }

    function initGUI () {

        $container.show();

        showTable();

        bootstrapTableFilter = new BootstrapTableFilter('showdatafilter');

        $('.selectpicker').selectpicker({
            width: '90px'
        });

        ShowDataCtrl.initGui();
        $btnLoad.hide();

        ShowDataCtrl.refreshTable();

        $('#paginationTable').removeClass('hidden');

        $('#dataNum').text("Showing 1 to 10 of " + ShowDataCtrl.stat.data.countTot + " rows ");

        $('#pagination').bootpag( bootPagOpt ).on("page", function(event, num){

            var numForPag = $($('#menuDataNum li.active')[0]).text();

            ShowDataCtrl.page = num;
            ShowDataCtrl.skip = num*numForPag-numForPag;
            ShowDataCtrl.limit = numForPag;

            console.log("skip: " + ShowDataCtrl.skip + " limit: " + ShowDataCtrl.limit);

            ShowDataCtrl.refreshTable();
        });

    }

    function showErrorProject(){
        $spinner.hide();
        $msgproject.show();
    }

    $(document).ready( function () {

        if( !window.PROJECT || window.PROJECT == "" ) {
            showErrorProject();
        } else
            getData(function(err, results){
                if(err)
                    alert(JSON.stringify(err));
                else
                    initGUI();
            })
    })

}]);