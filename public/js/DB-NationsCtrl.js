var DBNationsCtrl =
{
    $tableNations: null,
    regions: null,

    init:function()
    {
        DBNationsCtrl.$tableNations = $('#table-nations');
        //DBNationsCtrl.$tableNations.bootstrapTable();
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

    }
};

var Formatter = {

    nationFormatter: function(value, row, index)
    {
        return row.properties.NAME_0;
    },

    regionFormatter: function(value, row, index)
    {
        return row.properties.NAME_1;
    },

    sumFormatter: function(value, row, index)
    {
        return parseInt( row.properties.sum );
    }

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