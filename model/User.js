"use strict";

var mongoose = require('mongoose');

var User = function (data) {
    this.data = data;
};

var MODEL_NAME = "users";

var USER_SCHEMA = new mongoose.Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    created: Date
}, {strict: false});

User.prototype.data = {};    //json

User.prototype.getUsername = function()
{
    return this.data.username;
};

User.addUser = function(user, callback){
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var UserModel = connection.model("users", USER_SCHEMA);
    var u = new UserModel(user);
    u.save( function(err, result){
        connection.close();
        callback(err);
    } );
};

User.getUser = function (username, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');

    var Users = connection.model(MODEL_NAME, USER_SCHEMA);

    Users.findOne( {username: username }, function (err, doc)
    {
        console.log(doc);
        console.log("CALL getUsers -> findOne");
        callback(doc);
        connection.close();
    });
};

User.getUserPsw = function (username, password , callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Users = connection.model(MODEL_NAME, USER_SCHEMA);

    Users.findOne({username: username, password:password }, function (err, doc)
    {
        callback(doc);
        connection.close();
    });
};

/**
 * Get users
 * @param callback  - fn({Error}, {Users})
 */
User.getUsers = function(callback)
{

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var Users = connection.model(MODEL_NAME, USER_SCHEMA);

    Users.find(
        {},
        { _id:0, "firstName":1, "lastName":1, "username":1, "created":1}
    ).lean().exec ( function(err, data){
        connection.close();
        callback(err, data);
    });

};

module.exports = User;

