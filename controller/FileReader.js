/**
 * Created by b4p3p on 20/05/15.
 */

var FileReader = function (type, fileNames) {
    this.fileNames = fileNames;
    this.type = type;
};

FileReader.prototype.type = '';
FileReader.prototype.fileNames = [];
FileReader.prototype.jsonData = {};

FileReader.prototype.save = function (callback) {

};

module.exports = FileReader;