/**
 * Controller usato per puro frontendismo :S
 * Serve solo a stampare dei puntini al terminale
 */

/**
 *
 * @param app
 * @param target:String - nome della funzione da far chiamare a socket.io
 * @constructor
 */
var WaitController = function(app, target) {

    var self = this;

    this.app = app;
    this.done = false;
    this.interval = null;

    this.start = function(){
        this.done = false;
        this.interval = setInterval(function(){
            if(!self.done)
                self.app.io.emit(target, ".");
        }, 500);
    };

    this.stop = function()
    {
        this.done = true;
        clearInterval(this.interval);
        //res.write("<br>");
    };

};

module.exports = WaitController;