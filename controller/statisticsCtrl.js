var Data = require("../model/Data");

/**
 * StatController
 * @constructor
 */
var StatisticsCtrl = function() {};

/**
 * @param {String} projectName - project name
 * @param {function(ERROR,Array)} callback - the result callback
 */

StatisticsCtrl.GetMapData = function(projectName, callback)
{
    console.log("CALL: StatController.getMapData " + projectName);

    Data.loadData(projectName, function(error, data){

        if(error) {
            callback(error, {});
        }else{
            callback(null, data);
        }
    });
};

module.exports = StatisticsCtrl;
