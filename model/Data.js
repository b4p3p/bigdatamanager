/**
 * Created by annarita on 12/05/15.
 */

var Data = function (data) {
    this.data = data;
};

var model_name = "data";

var mongoose = require('mongoose');

const DATA_SCHEMA = new mongoose.Schema({
    project_Name: String,
    id: Number,
    Date: Date,
    Latitude: Number,
    Longitude: Number,
    Source: { type: String, lowercase: true },
    Text: { type: String, lowercase: true },
    User: { type: String, lowercase: true },
    Tag: { type: String, lowercase: true }
});

Data.prototype.data = {};    //json

Data.save = function(data, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');

    var Model = connection.model(model_name, DATA_SCHEMA);
    var newData = new Model( data.data );

    newData.save( function(err) {
        if (err)
            callback(-2, err ); //error
        callback(0, "" );       //OK

        connection.close();
    });

};


module.exports = Data;