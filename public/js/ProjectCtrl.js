"use strict";

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
        console.log("progress " + event.file.name + ": " + event.bytesLoaded / event.file.size);
    });

    siofu.addEventListener("progress", function(event){

        var p = ProjectCtrl.progress[event.file.name];
        var value =  Math.floor( (event.bytesLoaded / event.file.size) * 100).toString();
        $(p).text(progressCaption(value, event.file.name));
        $(p).attr("aria-valuenow", value);
        $(p).css("width", value + "%");

    });

    siofu.addEventListener("complete", function(event){

        console.log("END UPLOAD: " + event.file.name + " " + event.detail.result);

    });

});

function progressCaption(value, name){

    return  value + "% - " + name;

}

function createProgress(name) {

    var d = $('<div class="progress"></div>');

    var d2 = $('<div class="progress-bar progress-bar-success progress-bar-striped"></div>');

    d2.attr("role", "progressbar")
        .attr("aria-valuenow", "0")
        .attr("aria-valuemin", "0")
        .attr("aria-valuemax", "100");

    d2.css("width", "0%")
        .css("text-align", "left")
        .css("color", "black")
        .css("padding-left", "10px");

    d2.text( progressCaption(0, name));

    d.append(d2);

    ProjectCtrl.progress[name] = d2;

    $("#progress-container").append(d);

    return d2;

}

var ProjectCtrl =
{
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
    },

    loadData : function (content) {
        var json = JSON.parse(content);
        var $table = $('#tableProjects');
        $table.bootstrapTable('load', json);
    },

    /**
     * Funzione per formattare la colonna open
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

    getSelectedFiles: function()
    {
        console.log("CALL: getSelectedFiles");

        var fileInput = document.getElementById("upload_input");
        return fileInput.files;
    },

    initProgress: function(files)
    {
        ProjectCtrl.files = {};
        ProjectCtrl.progress = {};
        for(var i=0; i<files.length;i++)
        {
            ProjectCtrl.files[files[i].name] = i;
            ProjectCtrl.progress[files[i].name] = createProgress(files[i].name);
        }
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


