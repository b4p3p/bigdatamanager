var uploaderCtrl = null;

var optionsCtrl = {

    timeout: 1000 * 120,  //120s,

    beforeSend: function (event) { uploaderCtrl.initProgress(); },

    uploadProgress: function (event, position, total, percentage, file) { uploaderCtrl.updateProgress(percentage); },

    error: function (xhr) { uploaderCtrl.onError(xhr); } ,

    success: function (response) {
        uploaderCtrl.onSuccess(response);
        DBNationsCtrl.updateTable();
    }
};

function submitFn()
{
    $(this).ajaxSubmit( optionsCtrl ) ;

    // Have to stop the form from submitting and causing
    // a page refresh - don't forget this
    return false;

}

var DBNationsCtrl =
{
    $tableNations: null,
    regions: null,

    updateTable: function()
    {
        DBNationsCtrl.$tableNations.bootstrapTable('refresh', {silent: true});
    },

    init:function()
    {
        DBNationsCtrl.$tableNations = $("#table-nations")
    },

    getNations: function()
    {
        console.log("CALL: getNations");

        $.ajax({
            type: "get",
            crossDomain: true,
            dataType: "json",
            url: "/getregions?DEBUG=1",
            success: function (data) {
                DBNationsCtrl.regions = data;
                DBNationsCtrl.$tableNations.bootstrapTable('load', DBNationsCtrl.regions );
            },
            error: function (xhr, status, error) {
                console.error("ERR: ShowmapCtrl.getRegions " + status + " " + xhr.status);
                console.error("     Status: " + status + " " + xhr.status);
                console.error("     Error: " + error);
            }
        });

    },

    delNation: function(nation)
    {
        bootbox.confirm("Are you sure you want to delete the follow nation:<br>" + nation.toUpperCase() ,
            function(confirm) {

                if(confirm) {

                    $.ajax({
                        type: "delete",
                        url: "/regions/nation",
                        data: {nation: nation},
                        success: function (data) {

                            //example data: deletedRegion: {Number}, updatedData: {Number}

                            console.log("SUCCESS delete nation - " + JSON.stringify(data));

                            bootbox.alert("<b>Deleted region:</b> " + data.deletedRegion + "<br>" +
                                          "<b>Updated data:</b> " + data.updatedData);

                            DBNationsCtrl.updateTable();
                        },
                        error: function (xhr, status, error) {
                            console.error("ERR: ShowmapCtrl.delNation " + status + " " + xhr.status);
                            console.error("     Status: " + status + " " + xhr.status);
                            console.error("     Error: " + error);
                        }
                    });

                }
            }
        );
    }
};

var Formatter = {

    deleteFormatter: function(value, row, index)
    {
        var $button = $('<button type="button" class="btn btn-danger btn-delete">')
            .attr("onclick", "DBNationsCtrl.delNation(\"" + row.nation + "\")" )
            .append('<i class="glyphicon glyphicon-remove"></i>');

        return $button.outerHTML();

        //onclick="DBNationsCtrl.deleteRegion(' + row.nation + ')"

        //return ' +
        //         '<i class="glyphicon glyphicon-remove"></i>' +
        //       '</button>';
    }

    //nationFormatter: function(value, row, index)
    //{
    //    return row.properties.NAME_0;
    //},
    //
    //regionFormatter: function(value, row, index)
    //{
    //    return row.properties.NAME_1;
    //},
    //
    //sumFormatter: function(value, row, index)
    //{
    //    return parseInt( row.properties.sum );
    //}

    //nationSorter: function(a, b){
    //    if (a > b) return 1;
    //    if (a < b) return -1;
    //    return 0;
    //},
    //
    //regionSorter: function(a, b){
    //    if (a > b) return 1;
    //    if (a < b) return -1;
    //    return 0;
    //},

    //operateFormatterTag: function(value, row, index)
    //{
    //    return [
    //        value +
    //        '<a class="editT ml10" href="javascript:void(0)" title="Edit tag">',
    //        '<i class="glyphicon glyphicon-pencil"></i>',
    //        '</a>'
    //    ].join(' ');
    //},
    //
    //operateFormatterVocabulary: function(value, row, index)
    //{
    //    return [
    //        value +
    //        '<a class="editV ml10" href="javascript:void(0)" title="Edit vocabulary">',
    //        '<i class="glyphicon glyphicon-pencil"></i>',
    //        '</a>'
    //    ].join(' ');
    //},
    //
    //operateFormatterDelete: function(value, row, index)
    //{
    //    return [
    //        '<a class="remove ml10" href="javascript:void(0)" title="Delete">',
    //        '<i class="glyphicon glyphicon-remove"></i>',
    //        '</a>'
    //    ].join(' ');
    //}

}



//$(document).ready(function() {
//
//    $('#uploadForm').submit( function() {
//
//        $(this).ajaxSubmit({
//
//            beforeSend: function(event, files, altro)
//            {
//                console.log("CALL: Before Send")
//                var fileList = ProjectCtrl.$btnFiles[0].files;
//                ProjectCtrl.initProgress(fileList);
//            },
//
//            uploadProgress: function(event, position, total, percentage, file)
//            {
//                ProjectCtrl.updateProgress(percentage);
//            },
//
//            error: function(xhr) {
//                status('Error: ' + xhr.status);
//            },
//
//            success: function(response) {
//                console.log("success: " + JSON.stringify(response) );
//                $("#upload_input").fileinput('clear');
//                ProjectCtrl.writeResultProgress(response);
//                //DomUtil.replaceItSelf( $("#upload_input") );
//            }
//        });
//
//        // Have to stop the form from submitting and causing
//        // a page refresh - don't forget this
//        return false;
//
//    });
//
//});