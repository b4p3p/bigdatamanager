"use strict";

function progressCaption(value, name)
{
    return  value + "% - " + name;
}

function createProgress(name)
{

    var html = '<div class="progress-object"> \
                    <div class="progress"> \
                        <div class="progress-bar progress-bar-success progress-bar-striped active" \
                             role="progressbar" \
                             aria-valuenow="0" \
                             aria-valuemin="0" \
                             aria-valuemax="100" \
                             style="width:0%;text-align:left;color:black;padding-left:10px;"> \
                             ' + name + ' \
                        </div> \
                    </div> \
                    <div class="progress-result" style="min-height: 25px"> \
                    Wait... \
                    </div> \
                </div>';

    //Added: 100 - Discard: 5

    var d = $(html);

    $("#progress-container").append(d);

    return d;

}

var ProjectCtrl =
{
    files: {},
    progress: {},
    username: null,
    project: null,
    type: "",

    //control
    $tableTags: null,
    $btnFiles: null,

    init: function(username, project)
    {
        console.log("SET " + username + " " + project);

        ProjectCtrl.username = username;
        ProjectCtrl.project = project;

        ProjectCtrl.$tableTags = $("#tagsTable");
        ProjectCtrl.$btnFiles =     $("#upload_input");

        //functione per l'upload dei file
        $(document).ready(function()
            {

            $('#uploadForm').submit(

                function()
                {

                $(this).ajaxSubmit({

                    beforeSend: function(event, files, altro)
                    {
                        console.log("CALL: Before Send");
                        var fileList = ProjectCtrl.$btnFiles[0].files;
                        ProjectCtrl.initProgress(fileList);
                    },

                    uploadProgress: function(event, position, total, percentage, file)
                    {
                        ProjectCtrl.updateProgress(percentage);
                    },

                    error: function(xhr) {
                        status('Error: ' + xhr.status);
                    },

                    success: function(response) {
                        console.log("success: " + JSON.stringify(response) );
                        $("#upload_input").fileinput('clear');
                        ProjectCtrl.writeResultProgress(response);

                        //DomUtil.replaceItSelf( $("#upload_input") );
                    }
                });

                // Have to stop the form from submitting and causing
                // a page refresh - don't forget this
                return false;

            }
            );

        }
        );
    },

    /**
     *
     * @param project
     * @param callback - fn({Data})
     */
    getProject: function(callback)
    {
        console.log("CALL: getProject - project=" + ProjectCtrl.project);
        jQuery.ajax({
            type: "GET",
            url: '/project/getproject?project=' + ProjectCtrl.project,
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

    /**
     *
     * @param value
     * @param row - riga del json passato come parametro
     *              - row.project: nome del progetto
     *              - row.userProject: utente proprietario del progetto
     * @returns {string} - Html da inserire nella cella
     */
    openColumnFormatter : function (value, row)
    {
        return '<button type="button" class="btn btn-success btn-open">' +
            '<span class="glyphicon glyphicon-ok selectProj" aria-hidden="true" ' +
                  'project="' + row.projectName + '"' +
            'onclick="ProjectCtrl.openProject_Click(\'' + row.projectName + '\')"/>' +
            '</button>';
    },

    deleteColumnFormatter : function (value, row) {

        return '<button type="button" class="btn btn-danger btn-delete">' +
            '<span class="glyphicon glyphicon-remove img-delete" aria-hidden="true" ' +
            'project="' + row.project + '"' +
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

    deleteProject_Click : function (project) {
        bootbox.confirm("Are you sure you want to delete this project?<br><b>" + project + "</b>", function(result)
        {
            if(result)
                ProjectCtrl.deleteProject(project);
        });
    },

    deleteProject : function(project) {
        /**
         *      success message: {
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
            data: { project: project } ,
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

    openProject_Click : function (project)
    {
        $.ajax({
            type: "POST",
            crossDomain:true,
            dataType: "json",
            url: "/project/setproject",
            data: { project: project } ,
            success: function(msg)
            {
                if(msg.status == 200)
                {
                    location.replace("/view/home");
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

        $("#project").val(data.projectName);
        $("#description").val(data.description);
    },

    showExample:function() {
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

    sendFiles: function () {

        var files = ProjectCtrl.$btnFiles[0].files;
        for(var i = 0; i< files.length; i ++)
        {
            var f = files.length[0];
        }

        if ( files.length == 0)
            bootbox.alert("No file selected");
        else
            $('#uploadForm').submit();
    },

    getSelectedFiles: function() {
        console.log("CALL: getSelectedFiles");
        var fileInput = document.getElementById("upload_input");
        return fileInput.files;
    },

    /**
     * Crea delle progress bar vuote
     * @param files
     */
    initProgress: function(files) {
        ProjectCtrl.files = {};
        ProjectCtrl.progress = {};
        for(var i=0; i<files.length;i++)
        {
            ProjectCtrl.files[files[i].name] = i;
            ProjectCtrl.progress[files[i].name] = createProgress(files[i].name);
        }
    },

    /**
     * Modifica la lunghezza della progress bar
     * @param percentage
     */
    updateProgress: function (percentage) {

        var keys = _.keys(ProjectCtrl.progress);
        for(var k in keys){

            var p = ProjectCtrl.progress[ keys[k] ];
            var pc = $(p).find(".progress-bar");

            $(pc).width(percentage + "%");
            $(pc).attr("aria-valuenow", percentage.toString() );
        }

    },
    
    /**
     * Scrive i risultati delle insert sotto le progress bar
     *
     * @param result - { fail:{Number}, success:{Number} }
     * @param fileName - {String}
     */
    writeResultProgress: function(result)
    {
        var keys = _.keys(ProjectCtrl.progress);
        for(var k in keys){

            var p = ProjectCtrl.progress[ keys[k] ];
            var pb = $(p).find(".progress-bar");
            pb.removeClass("active");
            var resContainer = $(p).find(".progress-result")[0];

            if ( result[keys[k]] == null)
            {
                $(resContainer).text('Undefined error...');
            }
            else
            {
                $(resContainer).text('');
                $(resContainer).append("Added: " + result[keys[k]].success + " ");
                $(resContainer).append('<span class="glyphicon glyphicon-ok" style="color: green" aria-hidden="true"></span>');
                $(resContainer).append(" - ");
                $(resContainer).append("Discard:" + result[keys[k]].fail + " ");
                $(resContainer).append('<span class="glyphicon glyphicon-remove" style="color: red" aria-hidden="true"></span>');
            }
        }
    }
};




//setTableTag: function()
//{
//    $('#tagsTable').bootstrapTable('destroy');
//    $('#tagsTable').bootstrapTable({
//        columns: [
//            {
//                field: 'tag',
//                title: 'Tag',
//                //align: 'center',
//                //switchable: false,
//                sortable: true,
//                formatter: operateFormatterTag,
//                events:
//                {
//                    'click .editT': function (e, value, row, index) {
//                        console.log(JSON.stringify(row), index);
//
//                        bootbox.prompt({
//                            title: "Edit tag: " + JSON.stringify(row.tag),
//                            value: row.tag,
//                            callback: function (result) {
//                                if (result === null) {
//                                    console.log("Prompt edit tag dismissed");
//                                } else {
//                                    console.log("New tag: " + result);
//                                    var data = {
//                                        newTag: result,
//                                        oldTag: row.tag
//                                    };
//                                    $.ajax({
//                                        url: '/vocabulary/tag',
//                                        contentType: "application/json; charset=utf-8",
//                                        type: 'move',
//                                        async: true,
//                                        data: JSON.stringify(data),
//                                        dataType: "json",
//                                        success: function(html) {
//                                            ProjectCtrl.updateTableTags();
//                                            //ProjectCtrl.getTags();
//                                        },
//                                        error: function(xhr, status, error){
//                                            alert("Error: " + error);
//                                        }
//                                    });
//                                }
//                            }
//                        });
//                    }
//                }
//            },
//            {
//                field: 'words',
//                title: 'Vocabulary',
//                formatter: operateFormatterVocabulary,
//                events:
//                {
//                    'click .editV': function (e, value, row, index) {
//                        console.log(row, index);
//
//                        bootbox.prompt({
//                            title: "Edit vocabulary of tag: " + JSON.stringify(row.tag),
//                            value: row.words,
//                            callback: function (result) {
//                                if (result === null) {
//                                    console.log("Prompt edit vocabulary dismissed");
//                                } else {
//                                    console.log("New words: " + result);
//                                    var data = {
//                                        tag: row.tag,
//                                        words: result
//                                    };
//                                    $.ajax({
//                                        url: '/vocabulary/words',
//                                        contentType: "application/json; charset=utf-8",
//                                        type: 'PUT',
//                                        async: false,
//                                        data: JSON.stringify(data),
//                                        dataType: "json",
//                                        success: function(html) {
//                                            ProjectCtrl.getTags();
//                                        },
//                                        error: function(xhr, status, error){
//                                            alert("Error: " + error);
//                                        }
//                                    });
//                                }
//                            }
//                        });
//                    }
//                }
//            },
//            {
//                field: 'operate',
//                title: 'Delete tag',
//                align: 'center',
//                formatter: operateFormatterDelete,
//                events: {
//                    'click .remove': function (e, value, row, index) {
//                        console.log(row, index);
//
//                        bootbox.confirm("<h4>Are you sure to delete tag: "
//                            + JSON.stringify(row.tag)
//                            + "?</h4>",
//                            function (result) {
//                                if (result) {
//                                    console.log("User confirmed delete dialog");
//                                    //var data = {
//                                    //    type: "tag",
//                                    //    data: {
//                                    //        tag: row.tag
//                                    //    }
//                                    //};
//                                    $.ajax({
//                                        url: '/vocabulary/tag',
//                                        contentType: "application/json; charset=utf-8",
//                                        type: 'DELETE',
//                                        async: false,
//                                        data: JSON.stringify({tag:row.tag}),
//                                        dataType: "json",
//                                        success: function(html) {
//                                            ProjectCtrl.getTags();
//                                        },
//                                        error: function(xhr, status, error){
//                                            alert("Error: " + error);
//                                        }
//                                    });
//                                } else {
//                                    console.log("User declined delete dialog");
//                                }
//                            });
//                    }
//                }
//            }],
//        data: ProjectCtrl.tags,
//        search: true,
//        striped: true,
//        dataType: 'json',
//        smartDisplay: true
//        //showRefresh: true,
//        //minimumCountColumns: 1,
//        //showColumns: true,
//        //pagination: true,
//        //clickToSelect: true
//    });
//},



//getTags: function () {
//
//    jQuery.ajax({
//        type: "GET",
//        url: '/vocabulary/vocabulary',
//        dataType: 'json',
//        async: true,
//        timeout: 1 * 60 * 1000,                   // 1m
//        success: function (data) {
//
//            console.log("SUCCESS: /vocabulary/vocabulary");
//            ProjectCtrl.tags = data;
//            ProjectCtrl.setTableTag()
//        },
//        error: function (data) {
//            alert('GetTagsVocabulary fail');
//        }
//    });
//},