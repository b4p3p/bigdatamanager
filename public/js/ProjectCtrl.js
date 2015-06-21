"use strict";

/**
 * Controller per l'upload di file sul server
 */

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
};

Date.prototype.toStringDate = function()
{
    return [
            (this.getMonth() + 1).padLeft(),
            this.getDate().padLeft(),
            this.getFullYear()
        ].join('/') + ' ' +
        [
            this.getHours().padLeft(),
            this.getMinutes().padLeft(),
            this.getSeconds().padLeft()
        ].join(':');
};

var socket = null;
var siofu = null;

document.addEventListener("DOMContentLoaded", function(){

    socket = io.connect();
    siofu = new SocketIOFileUpload(socket);

    //evento generato al click sull'upload
    siofu.addEventListener("choose", function(event){
        ProjectCtrl.initProgress(event.files);
    });

    // 1 evento per file
    siofu.addEventListener("start", function(event){
        event.file.meta.username = ProjectCtrl.username;
        event.file.meta.projectName = ProjectCtrl.projectName;
        event.file.meta.type = ProjectCtrl.type;
        event.file.meta.method = "editproject";

        console.log("progress " + event.file.name + ": " + event.bytesLoaded / event.file.size);
    });

    siofu.addEventListener("progress", function(event){

        var p = ProjectCtrl.progress[event.file.name];
        var value =  Math.floor( (event.bytesLoaded / event.file.size) * 100).toString();

        var obj = $(p).find(".progress-bar")[0];
        $(obj).text(progressCaption(value, event.file.name));
        $(obj).attr("aria-valuenow", value);
        $(obj).css("width", value + "%");

    });

    /**
     *  event.detail.result - { fail:{Number}, success:{Number} }
     */
    siofu.addEventListener("complete", function(event){

        console.log("CALL: complete upload - success:" + event.success);

        ProjectCtrl.setResultProgress(event.detail.result, event.file.name);

    });

});

function progressCaption(value, name){

    return  value + "% - " + name;

}

function createProgress(name) {

    var html = '<div class="progress-object"> \
                    <div class="progress"> \
                        <div class="progress-bar progress-bar-success progress-bar-striped" \
                             role="progressbar" \
                             aria-valuenow="50" \
                             aria-valuemin="0" \
                             aria-valuemax="100" \
                             style="width:50%;text-align:left;color:black;padding-left:10px;"> \
                        </div> \
                    </div> \
                    <div class="progress-result hidden"> \
                    </div> \
                </div>';

    //Added: 100 - Discard: 5

    var d = $(html);

    $("#progress-container").append(d);

    return d;

}

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

var ProjectCtrl =
{
    tags: [],
    files: {},
    progress: {},
    username: null,
    projectName: null,
    type: "",

    init: function(username, projectName)
    {
        console.log("SET " + username + " " + projectName);
        ProjectCtrl.username = username;
        ProjectCtrl.projectName = projectName;
        ProjectCtrl.setTableTag();
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
                                                ProjectCtrl.getTags();
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
                                                ProjectCtrl.getTags();
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
                                                ProjectCtrl.getTags();
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
            data: ProjectCtrl.tags,
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

    loadData : function (content) {
        var json = JSON.parse(content);
        var $table = $('#tableProjects');
        $table.bootstrapTable('load', json);
    },

    /**
     *
     * @param projectName
     * @param callback - fn({Data})
     */
    getProject: function(callback)
    {
        console.log("CALL: getProject - pn=" + ProjectCtrl.projectName);
        jQuery.ajax({
            type: "GET",
            url: '/project/getproject?pn=' + ProjectCtrl.projectName,
            dataType: 'json',
            async: true,
            success: function (data) {
                callback(data)
            },
            error: function (data) {
                alert('getProject fail');
            }
        });
    },

    getTags: function () {
        jQuery.ajax({
            type: "GET",
            url: '/vocabulary/vocabulary',
            dataType: 'json',
            async: true,
            success: function (data) {

                console.log("      success GetTagsVocabulary.php");
                ProjectCtrl.tags = data;
                ProjectCtrl.setTableTag()
            },
            error: function (data) {
                alert('GetTagsVocabulary fail');
            }
        });
    },

    /**
     *
     * @param value
     * @param row - riga del json passato come parametro
     *              - row.projectName: nome del progetto
     *              - row.userProject: utente proprietario del progetto
     * @returns {string} - Html da inserire nella cella
     */
    openColumnFormatter : function (value, row)
    {

        //'id="' + row.projectName +'">' +

        return '<button type="button" class="btn btn-success btn-open">' +
            '<span class="glyphicon glyphicon-ok selectProj" aria-hidden="true" ' +
                  'project="' + row.projectName + '"' +
            'onclick="ProjectCtrl.openProject_Click(\'' + row.projectName + '\')"/>' +
            '</button>';

    },

    deleteColumnFormatter : function (value, row) {
        return '<button type="button" class="btn btn-danger btn-delete">' +
            '<span class="glyphicon glyphicon-remove img-delete" aria-hidden="true" ' +
            'project="' + row.projectName + '"' +
            'onclick="ProjectCtrl.deleteProject_Click(\'' + row.projectName + '\')"/>' +
            '</button>';
    },

    dateCreationFormatter : function (value, row) {
        var d = new Date(value);
        return d.toStringDate();
    },

    dateLastUpdateFormatter : function (value, row) {
        var d = new Date(value);
        return d.toStringDate();
    },

    deleteProject_Click : function (projectName)
    {

        bootbox.confirm("Are you sure?", function(result) {
            if(result)
                ProjectCtrl.deleteProject(projectName);
        });
    },

    deleteProject : function(projectName)
    {
        /**
         *      success message:
         *      {
         *          status: 0 | >0   0:OK  >0:Error
         *          message: info
         *      }
         */

        var html = "";

        $.ajax({
            type: "POST",
            crossDomain:true,
            dataType: "json",
            url: "http://localhost:8080/project/delproject",
            data: { projectName: projectName } ,
            success: function(msg)
            {
                if(msg.status == 0)
                {
                    html =
                        '<div class="alert alert-success">' +
                            "Project has been removed" + '<br>' +
                            'Deleted: ' + msg.deletedCount + " items" +
                        '</div>';

                        bootbox.alert(html, function() {
                            window.location.reload();
                        });
                }
                else
                {
                    html = '<div class="alert alert-danger">' + msg.message + '</div>';
                    bootbox.alert(html, function() {
                        window.location.reload();
                    });
                }
            },
            error: function(xhr, status, error)
            {
                console.error("ERR: openProject_Click: " + status + " " + xhr.status + "\n" + error);
                window.location.reload();
            }
        });
    },

    openProject_Click : function (projectName)
    {

        $.ajax({
            type: "POST",
            crossDomain:true,
            dataType: "json",
            url: "http://localhost:8080/project/setproject",
            data: { projectName: projectName } ,
            success: function(msg)
            {
                if(msg.status == 200)
                {
                    location.replace("/home");
                }
            },
            error: function(xhr, status, error)
            {
                console.error("ERR: openProject_Click: " + status + " " + xhr.status + "\n" + error);
            }
        });
    },



    loadEditForm: function(data)
    {

        console.log("CALL: loadEditForm");

        $("#projectName").val(data.projectName);
        $("#description").val(data.description);

    },

    showExample:function()
    {
        var cmbType = $('#cmbType');
        var divCode = $('#examplecode');
        var selected = cmbType.find("option:selected").val();
        ProjectCtrl.type = selected;
        if (selected == "csv")
            divCode.html(
                "<pre>id,[date],[latitude],[longitude],[source],text,[user],[tag]\n" +
                "'&lt;unique_id&gt;'," +
                "['&lt;AAAA-MM-GG&gt;']," +
                "[&lt;float&gt;]," +
                "[&lt;float&gt;]," +
                "['&lt;source&gt;]'," +
                "'&lt;text&gt;'," +
                "['&lt;user&gt;]'," +
                "['&lt;tag&gt;]'\n" +
                "'&lt;unique_id&gt;'," +
                "['&lt;AAAA-MM-GG&gt;']," +
                "[&lt;float&gt;]," +
                "[&lt;float&gt;]," +
                "['&lt;source&gt;]'," +
                "'&lt;text&gt;'," +
                "['&lt;user&gt;]'," +
                "['&lt;tag&gt;]'\n" +
                "...\n" +
                "</pre>");
        else
            divCode.html(
                "<pre>[\n" +
                "  {\n" +
                "    id: '&lt;unique_id&gt;',\n" +
                "    [date: '&lt;AAAA-MM-GG&gt;'],\n" +
                "    [latitude: &lt;float&gt;],\n" +
                "    [longitude: &lt;float&gt;],\n" +
                "    [source: '&lt;source&gt;]',\n" +
                "    text: '&lt;text&gt;',\n" +
                "    [user: '&lt;user&gt;]',\n" +
                "    [tag: '&lt;tag&gt;]'\n" +
                "  },{\n" +
                "    id: '&lt;unique_id&gt;',\n" +
                "    [date: '&lt;AAAA-MM-GG&gt;'],\n" +
                "    [latitude: &lt;float&gt;],\n" +
                "    [longitude: &lt;float&gt;],\n" +
                "    [source: '&lt;source&gt;]',\n" +
                "    text: '&lt;text&gt;',\n" +
                "    [user: '&lt;user&gt;]',\n" +
                "    [tag: '&lt;tag&gt;]'\n" +
                "  },\n" +
                "  ...\n" +
                "]</pre>");

    },

    sendFiles: function ()
    {
        siofu.useText = true;
        siofu.submitFiles(ProjectCtrl.getSelectedFiles());
    },

    sendFilesEnd: function (err, result)
    {

    },

    getSelectedFiles: function()
    {
        console.log("CALL: getSelectedFiles");
        var fileInput = document.getElementById("upload_input");
        return fileInput.files;
    },

    /**
     * Crea delle progress bar vuote
     * @param files
     */
    initProgress: function(files)
    {
        ProjectCtrl.files = {};
        ProjectCtrl.progress = {};
        for(var i=0; i<files.length;i++)
        {
            ProjectCtrl.files[files[i].name] = i;
            ProjectCtrl.progress[files[i].name] = createProgress(files[i].name);
        }
    },

    /**
     *
     * @param result - { fail:{Number}, success:{Number} }
     * @param fileName - {String}
     */
    setResultProgress: function(result, fileName)
    {
        var p = ProjectCtrl.progress[fileName];
        var resContainer = $(p).find(".progress-result")[0];

        $(resContainer).append("Added: " + result.success + " ");
        $(resContainer).append('<span class="glyphicon glyphicon-ok" style="color: green" aria-hidden="true"></span>');
        $(resContainer).append(" - ");
        $(resContainer).append("Discard:" + result.fail + " ");
        $(resContainer).append('<span class="glyphicon glyphicon-remove" style="color: red" aria-hidden="true"></span>');
        $(resContainer).removeClass("hidden");

        //$(resContainer).text("Added: " + result.success + "  - Discard:" + result.fail);
        //$(resContainer).html(html);
        //$(resContainer).append("ciao!");
        //$(resContainer).append("ciao!");

    }
};


//addUploadDataHandler :function()
//{
//    $('#uploadForm').submit( function() {
//
//        status('uploading the file ...');
//
//        $(this).ajaxSubmit({
//
//            error: function(xhr) {
//                status('Error: ' + xhr.status);
//            },
//
//            success: function(response) {
//
//                if(response.error) {
//                    status('Opps, something bad happened');
//                    return;
//                }
//
//                var imageUrlOnServer = response.path;
//
//                status('Success, file uploaded to:' + imageUrlOnServer);
//
//                alert("fatto! + " + imageUrlOnServer);
//
//            }
//        });
//
//        // Have to stop the form from submitting and causing
//        // a page refresh - don't forget this
//        return false;
//    });
//
//    function status(message) {
//        $('#status').text(message);
//    }
//},


