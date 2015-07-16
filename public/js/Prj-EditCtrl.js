"use strict";

var PrjEditFormatterTag = function(){

    function addElement(value, row, index, suffix, event, isDelete)
    {
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

var PrjEditCtrl = {

    showInsertTag: function () {

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

    },

    setTableTag: function() {
        $('#tagsTable').bootstrapTable('destroy');
        $('#tagsTable').bootstrapTable({
            columns: [
                {
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
            //showRefresh: true,
            //minimumCountColumns: 1,
            //showColumns: true,
            //pagination: true,
            //clickToSelect: true
        });

    },
    
    loadTags: function () {

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
    }
};

var PrjEditEventCtrl = function() {

    this.$btnSyncUserTags = $("#synUserTag");
    this.$terminal = $("#terminal");

    this.$btnSyncUserTags.click( function(){
        prjEECtrl.$terminal.attr("src", "/test" );
        setInterval(function(){
            prjEECtrl.$terminal.scrollTop( prjEECtrl.$terminal.contents().height() + 100);
        } , 500);
    });

};
var prjEECtrl = new PrjEditEventCtrl();
