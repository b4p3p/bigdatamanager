"use strict";
var ngApp = angular.module('bigDataManager', [] );

ngApp.controller('ngAppCtrl', ['$scope', function($scope) {

    var socket = io.connect();
    var $frameTerminal = $("#terminal");

    /**
     *  EVENTI DELLA SOCKET
     */

    /**
     * Messaggio generico
     */
    socket.on('projectsync_msg', function(message) {
        $frameTerminal.append(message + '<br>');
    });

    /**
     * Messaggio con il risultato della sincronizzazione di una regione
     *
     * result:{
     *   cont: Number,
     *   tot: Number
     *   modified: Number,
     *   region: String
     *   nation: String
     * }
     */
    socket.on('projectsync_res', function(result) {

        var modified = "- Modified " + divInline(result.cont + "/" + result.tot , "countRes");

        $frameTerminal.append(

            divInline(result.cont + "/" + result.tot , "countRes") +
            " - Modified " + divInline(result.modified , "countDocs") +
            " docs in " + result.region + "@" + result.nation +
            '<br>'

        );
    });

    function divInline(text, divClass ){

        var div = $('<div></div>')
            .addClass(divClass)
            .css('display', 'inline-block')
            .text(text);
        return div[0].outerHTML;

        //var div = '<div class="' + divClass + '" style="display:inline-block">';
        //div += text;
        //div += "</div>";
        //return div;
    }

    //richiesta alla specifica pagina in base all' hashtag
    switch(document.location.hash){
        case "#syncproject":
            $.ajax({
                type: 'get',
                url: '/project/sync',
                success: function(res){
                    //alert(res);
                },
                error: function(err)
                {
                    alert("Error: \n " + err.toString());
                }
            });
            break;
    }

}]);



//var TerminalCtrl = function(idFrame) {
//
//    var _self = this;
//
//    this.$frameTerminal = $("#" + idFrame);
//    this.intervalScroll = null;
//
//    this.resetStyleBody = function() {
//        _self.$frameTerminal.contents().find("body").attr("style", null);
//    };
//
//    this.addStyleFrame = function(style){
//        _self.$frameTerminal.contents().find("head>style").text(style);
//    };
//
//    this.appendStyleFrame = function(style){
//        _self.$frameTerminal.contents().find("head>style").append(style);
//    };
//
//    this.setSrcFrame = function(url) {
//
//        this.$frameTerminal.attr("src", url );
//
//        this.startScroll();
//
//        var addCssToIframe = function() {
//            if (_self.$frameTerminal.contents().find("head") != undefined) {
//                _self.addStyleFrame('body{font-family: monospace;color:lightyellow;font-size:15px;text-align:left;position:static;word-wrap:break-word}');
//                _self.appendStyleFrame('.countDocs{display:inline-block;width:45px}');
//                _self.appendStyleFrame('.countRes{display:inline-block;width:80px}');
//                _self.resetStyleBody();
//                clearInterval(addCssInterval);
//            }
//        };
//        var addCssInterval = setInterval(addCssToIframe, 500);
//
//        //termino lo scroll quando la pagina è caricata
//        this.$frameTerminal.load( function() {
//
//            addCssToIframe();
//            _self.$frameTerminal.contents().scrollTop(
//                _self.$frameTerminal.contents().height() + 200);
//                clearInterval(_self.intervalScroll);
//        });
//    };
//
//    this.fnIntervalScroll = function() {
//
//        _self.$frameTerminal.contents().scrollTop(
//            _self.$frameTerminal.contents().height() + 200
//        );
//
//        //_self.$frameTerminal.contents().find("body")
//        //    .css('color','#fff')
//        //    .css('font-family','monospace')
//        //    .css('font-size','15px')
//        //    .css('text-align','left')
//        //    .css('position','static')
//        //    .css('word-wrap','break-word');
//
//    };
//
//    this.startScroll = function () {
//        clearInterval(_self.intervalScroll);
//        _self.intervalScroll = setInterval( _self.fnIntervalScroll , 500);
//    };
//
//    //eventi della socket
//    var socket = io.connect();
//    socket.on('projectsync_msg', function(message) {
//        _self.$frameTerminal.append(message + '<br>');
//    });
//
//
//    //richiesta alla specifica pagina in base all' hashtag
//    switch(document.location.hash){
//        case "#syncproject":
//            $.ajax({
//                type: 'get',
//                url: '/project/sync',
//                success: function(res){
//                    alert(res);
//                },
//                error: function(err)
//                {
//                    alert("Error: \n " + err.toString());
//                }
//            });
//            break;
//    }
//};
