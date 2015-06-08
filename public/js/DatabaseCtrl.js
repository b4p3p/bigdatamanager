"use strict";

var DatabaseCtrl = {

    tags : {},

    showInsertTag: function () {

        var str;
        $.ajax({
            url: 'views/content/dialogNewTag.html',
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
                        for(var w in words)
                            words[w] = words[w].trim();

                        var data = {
                            tag: tag,
                            words: words
                        };
                        $.ajax({
                            url: '/vocabulary/vocabulary',
                            contentType: "application/json; charset=utf-8",
                            type: 'put',
                            async: false,
                            data: JSON.stringify(data),
                            dataType: "json",
                            success: function(html) {
                                console.log("CALL: getEditTagsAsync");
                                DatabaseCtrl.loadTags();
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

    setTableTag: function()
    {
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
    },

    refreshCounter: function()
    {
        jQuery.ajax({
            type: "GET",
            url: '/vocabulary/refresh',
            dataType: 'json',
            async: true,
            success: function (data) {
                alert("Done!");
                DatabaseCtrl.loadTags();
            },
            error: function (data) {
                alert('GetTagsVocabulary fail');
            }
        });
    }
};

function operateFormatterTag(value, row, index) {
    return [
        value +
        '<a class="editT ml10" href="javascript:void(0)" title="Edit tag">',
        '<i class="glyphicon glyphicon-pencil"></i>',
        '</a>'
    ].join(' ');
}

function operateFormatterVocabulary(value, row, index) {
    return [
        value +
        '<a class="editV ml10" href="javascript:void(0)" title="Edit vocabulary">',
        '<i class="glyphicon glyphicon-pencil"></i>',
        '</a>'
    ].join(' ');
}

function operateFormatterDelete(value, row, index) {
    return [
        '<a class="remove ml10" href="javascript:void(0)" title="Delete">',
        '<i class="glyphicon glyphicon-remove"></i>',
        '</a>'
    ].join(' ');
}
