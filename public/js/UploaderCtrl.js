var UploaderCtrl = function($formUpload, $btnFiles, $progressContainer, uploaderEvent, submitFn)
{
    this.$formUpload = $formUpload;
    this.$btnFiles =  $btnFiles;
    this.$progressContainer = $progressContainer;
    this.uploaderEvent = uploaderEvent;
    this.files = {};
    this.progress = {};

    this.getFiles = function(){
        return this.$btnFiles[0].files;
    };

    this.initProgress = function()
    {
        console.log("CALL: initProgress");

        this.files = {};
        this.progress = {};
        for(var i=0; i< this.getFiles().length;i++)
        {
            var f = this.getFiles()[i];
            this.files[f.name] = i;
            this.progress[f.name] = this.createProgress(f.name);
        }
    };

    this.createProgress = function(name)
    {
        var html = '<div class="progress-object"> \
                    <div class="progress" style="margin-bottom: 0"> \
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

        this.$progressContainer.append(d);

        return d;
    };

    this.updateProgress = function(percentage)
    {
        var keys = _.keys(this.progress);
        for(var k in keys){

            var p = this.progress[ keys[k] ];
            var pc = $(p).find(".progress-bar");

            $(pc).width(percentage + "%");
            $(pc).attr("aria-valuenow", percentage.toString() );
        }
    };

    this.onSuccess = function(response)
    {
        console.log("onSuccess: OK " + response);

        this.$btnFiles.fileinput('clear');
        var keys = _.keys(this.progress);

        for(var k in keys){

            var p = this.progress[ keys[k] ];
            var pb = $(p).find(".progress-bar");
            pb.removeClass("active");
            var resContainer = $(p).find(".progress-result")[0];

            if ( response.result[keys[k]] == null)
            {
                $(resContainer).text('Undefined error...');
            }
            else
            {
                $(resContainer).text('');
                $(resContainer).append("Added: " + response.result[keys[k]].success + " ");
                $(resContainer).append('<span class="glyphicon glyphicon-ok" style="color: green" aria-hidden="true"></span>');
                $(resContainer).append(" - ");
                $(resContainer).append("Discard:" + response.result[keys[k]].fail + " ");
                $(resContainer).append('<span class="glyphicon glyphicon-remove" style="color: red" aria-hidden="true"></span>');
            }
        }
    };

    this.onError = function(xhr)
    {

        if (xhr.statusText == "timeout") {
            alert("timeout :( \n file too big?");
        }
        console.error("UploaderCtrl.error:" + xhr.statusText);

    }

    this.upload = function()
    {
        if( this.getFiles().length == 0 ) {
            window.alert("No files selected.");
            return;
        }

        this.$formUpload.submit();
    };

    this.$formUpload.submit( submitFn );

};

