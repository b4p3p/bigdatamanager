var projectControl = new function() {

    this.loadData = function(content)
    {
        var json = JSON.parse(content);
        var $table = $('#tableProjects');

        $table.bootstrapTable('load', json );

    }

};