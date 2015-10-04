"use strict";
var Datas = require('../model/Data');
var Summary = require('../model/Summary');
var Regions = require('../model/Regions');

module.exports = function (router, app) {

    /**
     * Funzione usata per aggiungere il dataset di normalizzazione
     */
    router.post('/normalization', app.upload.single('normalization'), function(req, res){

        Regions.setNormalization( {file:req.file}, function(result){
            res.json(result);
        })

    });

};