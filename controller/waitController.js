var WaitController = function(res) {

    var self = this;
    this.res = res;
    this.done = false;
    this.interval = null;

    this.start = function(){
        this.done = false;
        this.interval = setInterval(function(){
            if(!self.done) self.res.write(".");
        }, 500);
    };

    this.stop = function()
    {
        this.done = true;
        clearInterval(this.interval);
        res.write("<br>");
    };

};

module.exports = WaitController;