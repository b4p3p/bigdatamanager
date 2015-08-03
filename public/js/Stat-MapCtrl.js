//"use strict";
//
////var ShowmapCtrl = function(){};
//
////data variable
//ShowmapCtrl.stat = null;
////ShowmapCtrl.filtered Stat = null;
//
//ShowmapCtrl.regions = null;
//ShowmapCtrl.filteredRegions = null;
//
//ShowmapCtrl.datas = [];
//
//ShowmapCtrl.users = null;
//ShowmapCtrl.terms = null;
//
//ShowmapCtrl.contNonGeo = 0;
//
///* Viene richiamata al refresh della pagina */
////ShowmapCtrl.getData = function () {
////    console.log("CALL: getData");
////    async.parallel({
////        stat: function(next)        {
////        DataCtrl.getField( function(doc){
////            ShowmapCtrl.stat = doc;
////            next(null, doc);
////        }, DataCtrl.FIELD.STAT );
////    },
////        regions: function (next)    {
////        DataCtrl.getField(
////            function(doc)
////            {
////                ShowmapCtrl.regions = doc;
////                ShowmapCtrl.filteredRegions = doc;
////                next(null, doc);
////            },
////            DataCtrl.FIELD.REGIONSJSON
////        );
////    },
////        users: function (next)      {
////        DataCtrl.getField( function(doc){
////            ShowmapCtrl.users = doc;
////            next(null, doc);
////        }, DataCtrl.FIELD.USERS, 50);
////    },
////        wordcount: function (next)  {
////            DataCtrl.getField( function(doc)
////            {
////                ShowmapCtrl.terms = doc;
////                next(null, doc);
////            }, DataCtrl.FIELD.WORDCOUNT);
////        }
////    }, function(err, result) {
////        ShowmapCtrl.getDataMapAsync();
////        formCtrl.load();
////    });
////};
//
////var idOp = 0;
////var cont = 0;
////ShowmapCtrl.getDataMapAsync = function(condictions){
////
////    formCtrl.progressCount.reset();
////    cont = 0;
////    ShowmapCtrl.datas = [];
////
////    if(condictions == null) condictions = new ObjConditions();
////
////    var timeout = setTimeout( function(){
////        idOp++;
////        ShowmapCtrl._getDataMapAsync(idOp-1, condictions, timeout, 1000, 0);
////    } , 0 );
////};
////
////ShowmapCtrl._getDataMapAsync = function(_idOp, condictions, timeout, step, start){
////
////    if(_idOp != idOp - 1) return;
////
////    condictions.setLimit(step);
////    condictions.setSkip(start);
////    condictions.setIsGeo(true);
////
////    var queryString = condictions.getQueryString();
////    cont++;
////
////    DataCtrl.getFromUrl(DataCtrl.FIELD.DATA, queryString,
////        function(doc){
////
////            if(_idOp != idOp - 1) return;
////
////            ShowmapCtrl.datas = ShowmapCtrl.datas.concat(doc);
////            formCtrl.progressCount.setPercentage();
////
////            mapCtrl.heatmapCtrl.setData();
////            mapCtrl.markerCtrl.appendData(doc);
////            cont++;
////            //&& cont < 1
////            if(doc.length > 0 ) {
////                start += step;
////                var newTimeout = setTimeout( function(){
////                    ShowmapCtrl._getDataMapAsync(_idOp, condictions, newTimeout, step, start);
////                }, 0);
////            }else {
////                clearTimeout(timeout);
////                formCtrl.progressCount.stopProgress();
////            }
////        }
////    );
////};
//
//function getIcon(etichetta) {
//    switch (etichetta)
//    {
//        case "omofobia":    return getAwesomeMarker("blue");
//        case "donne":       return getAwesomeMarker("red");
//        case "razzismo":    return getAwesomeMarker("green");
//        case "diversità":   return getAwesomeMarker("orange");
//        default :           return getAwesomeMarker("purple");
//    }
//}
//
//f
//
//var mapCtrl = null;
//
//$(document).ready(function(){
//    //mapCtrl = new MapCtrl('map');
//    //ShowmapCtrl.getData();
//});
//
