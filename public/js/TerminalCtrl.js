var TerminalCtrl = function(idFrame) {

    var _self = this;

    this.$frameTerminal = $("#" + idFrame);
    this.intervalScroll = null;

    this.resetStyleBody = function() {
        _self.$frameTerminal.contents().find("body").attr("style", null);
    };

    this.addStyleFrame = function(style){
        _self.$frameTerminal.contents().find("head>style").text(style);
    };

    this.appendStyleFrame = function(style){
        _self.$frameTerminal.contents().find("head>style").append(style);
    };

    this.setSrcFrame = function(url) {

        this.$frameTerminal.attr("src", url );

        this.startScroll();

        var addCssToIframe = function() {
            if (_self.$frameTerminal.contents().find("head") != undefined) {
                _self.addStyleFrame('body{font-family: monospace;color:#fff;font-size:15px;text-align:left;position:static;word-wrap:break-word}');
                _self.appendStyleFrame('.countDocs{display:inline-block;width:45px}');
                _self.appendStyleFrame('.countRes{display:inline-block;width:80px}');
                _self.resetStyleBody();
                clearInterval(addCssInterval);
            }
        };
        var addCssInterval = setInterval(addCssToIframe, 500);

        //termino lo scroll quando la pagina è caricata
        this.$frameTerminal.load( function() {

            _self.$frameTerminal.contents().scrollTop(
                _self.$frameTerminal.contents().height() + 200);
                clearInterval(_self.intervalScroll);
        });
    };

    this.fnIntervalScroll = function() {

        _self.$frameTerminal.contents().scrollTop(
            _self.$frameTerminal.contents().height() + 200
        );

        //_self.$frameTerminal.contents().find("body")
        //    .css('color','#fff')
        //    .css('font-family','monospace')
        //    .css('font-size','15px')
        //    .css('text-align','left')
        //    .css('position','static')
        //    .css('word-wrap','break-word');

    };

    this.startScroll = function () {
        clearInterval(_self.intervalScroll);
        _self.intervalScroll = setInterval( _self.fnIntervalScroll , 500);
    };

    switch(document.location.hash){
        case "#syncproject":
            this.setSrcFrame("/project/sync");
            break;
    }
};
