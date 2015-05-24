/**
 * Created by b4p3p on 24/05/15.
 */

var CsvConverter = require("csvtojson").core.Converter;
var ConverterCtrl = function (data) {};

ConverterCtrl.csvToJson = function(csv, callback)
{
    //Converter Class
    var csvConverter = new CsvConverter();

    csvConverter.on("end_parsed", function(jsonObj) {
        callback(jsonObj);
    });

    csvConverter.fromString(csv, function(jsonObj){
        //if (jsonObj == null)
        //    return;
        //return saveJson(callback, jsonObj);
    });

};

module.exports = ConverterCtrl;
