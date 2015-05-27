var projectCtrl = new function() {

    this.getData = function (content) {
        var json = JSON.parse(content);
        var $table = $('#tableProjects');

        $table.bootstrapTable('load', json);

    };

    /**
     * Funzione per formattare la colonna open
     * @param value
     * @param row - riga del json passato come parametro
     *              - row.projectName: nome del progetto
     *              - row.userProject: utente proprietario del progetto
     * @returns {string} - Html da inserire nella cella
     */
    this.openColumnFormatter = function (value, row) {

        //'id="' + row.projectName +'">' +

        return '<button type="button" class="btn btn-success btn-open">' +
            '<span class="glyphicon glyphicon-ok" aria-hidden="true" ' +
                  'project="' + row.projectName + '"' +
            'onclick="projectCtrl.openProject_Click(\'' + row.projectName + '\')"/>' +
            '</button>';

    };

    Number.prototype.padLeft = function(base,chr){
        var  len = (String(base || 10).length - String(this).length)+1;
        return len > 0? new Array(len).join(chr || '0')+this : this;
    };

    Date.prototype.toStringDate = function()
    {
       var dformat = [
                (this.getMonth() + 1).padLeft(),
                 this.getDate().padLeft(),
                 this.getFullYear()
                ].join('/') + ' ' +
                [
                    this.getHours().padLeft(),
                    this.getMinutes().padLeft(),
                    this.getSeconds().padLeft()
                ].join(':');
        return dformat;
    };

    this.dateCreationFormatter = function (value, row) {
        var d = new Date(value);
        return d.toStringDate();
    };

    this.dateLastUpdateFormatter = function (value, row) {
        var d = new Date(value);
        return d.toStringDate();
    };

    this.openProject_Click = function (projectName) {

        console.log(projectName);

        $.ajax({
            type: "POST",
            crossDomain:true,
            dataType: "json",
            url: "http://localhost:8080/setproject",
            data: { projectName: projectName } ,
            success: function(msg)
            {
                if(msg.status == 200)
                {
                    location.reload();
                }
            },
            error: function(xhr, status, error)
            {
                console.error("ERR: openProject_Click: " + status + " " + xhr.status);
            }
        });

    };

}
