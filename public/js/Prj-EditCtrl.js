"use strict";

var PrjEditFormatterTag = function(){

    function addElement(value, row, index, suffix, event, isDelete) {
        var $div = $("<div></div>");
        var $a = $("<a></a>").addClass( suffix + index );
        var icon = isDelete ? "glyphicon-remove" : "glyphicon-pencil";

        $div.append(
            $("<div>")
                .text(value)
                .css("float", "left")
                .css("margin-right", "10px")
        ).append(
            $a.append(
                $('<i>')
                    .addClass("glyphicon")
                    .addClass(icon)
                    .css("cursor", "pointer")
            )
        );

        if(isDelete)
        {
            $div.find("i")
                .css("left", "39%")
                .css("right", "40%");
        }

        $(".tag-" + index).off();
        PrjEditFormCtrl.$tableTags
            .off('click', 'a.' + suffix + index)
            .on('click', 'a.' + suffix + index, function(){
                event(row);
            });

        return $div.html();
    };

    this.tag = function(value, row, index){
        return addElement(value, row, index, "tag", PrjEditTableTagAction.tag_click );
    };

    this.vocabulary = function(value, row, index) {
        return addElement(value.join(', '), row, index, "voc", PrjEditTableTagAction.tokens_click );
    };

    this.delete = function(value, row, index)
    {
        return addElement("", row, index, "del", PrjEditTableTagAction.delete_click, true );
    };

};
var prjEditFormatterTag = new PrjEditFormatterTag();

var PrjEditTableTagAction = {

    tag_click : function(row)  {
        bootbox.prompt({
            title: "Edit tag: " + JSON.stringify(row.tag),
            value: row.tag,
            callback: function (result) {
                if (result === null) {
                    console.log("Prompt edit tag dismissed");
                } else {
                    console.log("New tag: " + result);
                    var data = {
                        newTag: result,
                        oldTag: row.tag
                    };
                    $.ajax({
                        url: '/vocabulary/tag',
                        contentType: "application/json; charset=utf-8",
                        type: 'move',
                        async: true,
                        data: JSON.stringify(data),
                        dataType: "json",
                        success: function(html) {
                            PrjEditFormCtrl.updateTableTag();
                        },
                        error: function(xhr, status, error){
                            alert("Error: " + error);
                        }
                    });
                }
            }
        });
    },

    tokens_click: function(row){
        bootbox.prompt({
            title: "Edit vocabulary of tag: " + JSON.stringify(row.tag),
            value: row.tokens,
            callback: function (result) {
                if (result === null) {
                    console.log("Prompt edit vocabulary dismissed");
                } else {
                    console.log("New words: " + result);
                    var data = {
                        tag: row.tag,
                        words: result
                    };
                    $.ajax({
                        url: '/vocabulary/words',
                        contentType: "application/json; charset=utf-8",
                        type: 'PUT',
                        async: false,
                        data: JSON.stringify(data),
                        dataType: "json",
                        success: function(html) {
                            PrjEditFormCtrl.updateTableTag();
                        },
                        error: function(xhr, status, error){
                            alert("Error: " + error);
                        }
                    });
                }
            }
        });
    },

    delete_click: function(row){
        bootbox.confirm("<h4>Are you sure to delete tag: "
        + JSON.stringify(row.tag)
        + "?</h4>",
        function (result) {
            if (result) {
                console.log("User confirmed delete dialog");
                $.ajax({
                    url: '/vocabulary/tag',
                    contentType: "application/json; charset=utf-8",
                    type: 'DELETE',
                    async: false,
                    data: JSON.stringify({tag:row.tag}),
                    dataType: "json",
                    success: function(html) {
                        PrjEditFormCtrl.updateTableTag();
                    },
                    error: function(xhr, status, error){
                        alert("Error: " + error);
                    }
                });
            } else {
                console.log("User declined delete dialog");
            }
        });
    }
};

var PrjEditFormCtrl = {

    $tableTags : $("#tagsTable") ,

    updateTableTag : function()
    {
        this.$tableTags.bootstrapTable('refresh', {silent: true});
    }

};

var PrjEditCtrl = function()
{
    var _self = this;

    this.intervalScroll = null;
    this.$btnSyncUserTags = $("#synUserTag");
    this.$btnSyncDataTags = $("#synDataTag");
    this.$btnOverrideDataTokens = $("#overrideDataTokens");

    this.$terminal = $("#terminal");
    this.$tableTag = $('#tagsTable');

    this.optionsPie = {
        title: null,
        pieSliceText: 'label',
        backgroundColor: 'transparent',
        chartArea: {left:0,top:0,bottom: 0, width:"100%",height:"100%"},
        legend:{position:'right', alignment:'start'}
    };

    this.showInsertTag = function () {

        var str;
        $.ajax({
            url: '/views/content/dialogNewTag.html',
            type: 'get',
            async: false,
            success: function(html) {
                str = html;
            }
        });
        bootbox.dialog({
            title: "Insert new tag",
            message: str,
            buttons: {
                OK: {
                    label: 'OK',
                    callback: function () {

                        var tag = $('#newTag').val().trim();
                        var strwords = $('#vocabulary').val();
                        var words = strwords.split(",");

                        _.each(words, function(item, i){
                            words[i] = words[i].trim();
                        });

                        var data = {
                            tag: tag,
                            tokens: words
                        };
                        $.ajax({
                            url: '/vocabulary/vocabulary',
                            contentType: "application/json; charset=utf-8",
                            type: 'put',
                            async: false,
                            data: JSON.stringify(data),
                            dataType: "json",
                            success: function(html) {
                                PrjEditFormCtrl.updateTableTag();
                            },
                            error: function(xhr, status, error){
                                alert("Error: " + error);
                            }
                        });
                    }
                },
                cancel: {
                    label: 'Cancel',
                    callback: function () {
                        console.log("Dialog insert tag dismissed");
                    }
                }
            }
        });

    };

    this.setTableTag = function() {
        this.$tableTag.bootstrapTable('destroy');
        this.$tableTag.bootstrapTable({
            columns: [{

                field: 'tag',
                title: 'Tag',
                //align: 'center',
                //switchable: false,
                sortable: true,
                formatter: operateFormatterTag,
                events:
                {
                    'click .editT': function (e, value, row, index) {
                        console.log(JSON.stringify(row), index);

                        bootbox.prompt({
                            title: "Edit tag: " + JSON.stringify(row.tag),
                            value: row.tag,
                            callback: function (result) {
                                if (result === null) {
                                    console.log("Prompt edit tag dismissed");
                                } else {
                                    console.log("New tag: " + result);
                                    var data = {
                                        newTag: result,
                                        oldTag: row.tag
                                    };
                                    $.ajax({
                                        url: '/vocabulary/tag',
                                        contentType: "application/json; charset=utf-8",
                                        type: 'move',
                                        async: true,
                                        data: JSON.stringify(data),
                                        dataType: "json",
                                        success: function(html) {
                                            DatabaseCtrl.loadTags();
                                        },
                                        error: function(xhr, status, error){
                                            alert("Error: " + error);
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            },
            {
                field: 'words',
                title: 'Vocabulary',
                formatter: operateFormatterVocabulary,
                events:
                {
                    'click .editV': function (e, value, row, index) {
                        console.log(row, index);

                        bootbox.prompt({
                            title: "Edit vocabulary of tag: " + JSON.stringify(row.tag),
                            value: row.words,
                            callback: function (result) {
                                if (result === null) {
                                    console.log("Prompt edit vocabulary dismissed");
                                } else {
                                    console.log("New words: " + result);
                                    var data = {
                                        tag: row.tag,
                                        words: result
                                    };
                                    $.ajax({
                                        url: '/vocabulary/words',
                                        contentType: "application/json; charset=utf-8",
                                        type: 'PUT',
                                        async: false,
                                        data: JSON.stringify(data),
                                        dataType: "json",
                                        success: function(html) {
                                            DatabaseCtrl.loadTags();
                                        },
                                        error: function(xhr, status, error){
                                            alert("Error: " + error);
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            },
            {
                field: 'operate',
                title: 'Delete tag',
                align: 'center',
                formatter: operateFormatterDelete,
                events: {
                    'click .remove': function (e, value, row, index) {
                        console.log(row, index);

                        bootbox.confirm("<h4>Are you sure to delete tag: "
                            + JSON.stringify(row.tag)
                            + "?</h4>",
                            function (result) {
                                if (result) {
                                    console.log("User confirmed delete dialog");
                                    //var data = {
                                    //    type: "tag",
                                    //    data: {
                                    //        tag: row.tag
                                    //    }
                                    //};
                                    $.ajax({
                                        url: '/vocabulary/tag',
                                        contentType: "application/json; charset=utf-8",
                                        type: 'DELETE',
                                        async: false,
                                        data: JSON.stringify({tag:row.tag}),
                                        dataType: "json",
                                        success: function(html) {
                                            DatabaseCtrl.loadTags();
                                        },
                                        error: function(xhr, status, error){
                                            alert("Error: " + error);
                                        }
                                    });
                                } else {
                                    console.log("User declined delete dialog");
                                }
                            });
                    }
                }
            }],
            data: DatabaseCtrl.tags,
            search: true,
            striped: true,
            dataType: 'json',
            smartDisplay: true
        });

    };

    this.loadTags = function () {
        jQuery.ajax({
            type: "GET",
            url: '/vocabulary/vocabulary',
            dataType: 'json',
            async: true,
            success: function (data) {

                console.log("      success GetTagsVocabulary.php");
                DatabaseCtrl.tags = data;
                DatabaseCtrl.setTableTag()
            },
            error: function (data) {
                alert('GetTagsVocabulary fail');
            }
        });
    };

    this.setIntervalScroll = function () {

        clearInterval(prjEditCtrl.intervalScroll);

        prjEditCtrl.intervalScroll = setInterval(function() {

            prjEditCtrl.$terminal.contents().scrollTop(
                prjEditCtrl.$terminal.contents().height() + 200
            );

            prjEditCtrl.$terminal.contents().find("body")
                .css('color','#fff')
                .css('font-family','monospace')
                .css('font-size','15px')
                .css('text-align','left')
                .css('position','static')
                .css('word-wrap','break-word');

        } , 500);

    };

    //click user tag sync
    this.$btnSyncUserTags.click( function(){
        prjEditCtrl.$terminal.attr("src", "/vocabulary/syncUserTags" );
        prjEditCtrl.setIntervalScroll();
    });

    //click data tag sync
    this.$btnSyncDataTags.click( function(){
        prjEditCtrl.$terminal.attr("src", "/vocabulary/syncDataTags" );
        prjEditCtrl.setIntervalScroll();
    });

    //override tokens in data
    this.$btnOverrideDataTokens.click( function(){
        prjEditCtrl.$terminal.attr("src", "/datas/overrideTokensData" );
        prjEditCtrl.setIntervalScroll();
    });

    //cancello l'evento dello scroll
    this.$terminal.on("load", function() {
        prjEditCtrl.$terminal.contents().scrollTop( prjEditCtrl.$terminal.contents().height() + 200);
        clearInterval(prjEditCtrl.intervalScroll);
    });

    //evento della combo
    $('#cmbType').on('change', function () {
        ProjectCtrl.showExample();
    });

    //inizializzo il file input
    $("#upload_input").fileinput( {
        previewFileType: "json",
        allowedFileExtensions: ["json"]
    });

    DataCtrl.getFromUrl(DataCtrl.FIELD.DATANATIONS, null, function(doc){

        var data = [];
        data[0] = ['Nation', 'Count data'];
        _.each(doc, function(row){
            data.push([row.nation, row.sum]);
        });
        var dataTable = google.visualization.arrayToDataTable(data);

        //var dataTable = google.visualization.arrayToDataTable([
        //    ['Task', 'Hours per Day'],
        //    ['Work',     11],
        //    ['Eat',      2],
        //    ['Commute',  2],
        //    ['Watch TV', 2],
        //    ['Sleep',    7]
        //]);

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));

        chart.draw(dataTable, _self.optionsPie);
    });

};
var prjEditCtrl = new PrjEditCtrl();

