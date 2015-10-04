"use strict";

var mongoose = require('mongoose');
var async = require('async');

var User = function (data) {
    this.data = data;
};

var MODEL_NAME = "users";

var USER_SCHEMA = new mongoose.Schema({
    username: {type:String , required: true},
    password: String,
    firstName: String,
    lastName: String,
    created: Date,
    lastLogin: Date,
    level: {type: Number, default: 0}
}, {strict: false});

User.prototype.data = {};    //json

User.prototype.getUsername = function()
{
    return this.data.username;
};

/**
 * Aggiunge un nuovo utente
 * @param user
 * @param callback
 */
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
 * Restituisce tuttI gli utenti registrati
 * @param callback  - fn({Error}, {Users})
 */
User.getUsers = function(callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var users = connection.model(MODEL_NAME, USER_SCHEMA);

    users.find({}, { _id:0, "firstName":1, "lastName":1, "username":1, "created":1, "level":1, "lastLogin":1}
    ).sort("-level").lean().exec ( function(err, data){
        connection.close();
        callback(err, data);
    });

};

User.setLastLogin = function(username){
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var users = connection.model(MODEL_NAME, USER_SCHEMA);

    users.findOne({username:username}, function(err, doc){
        doc.lastLogin = new Date();
        doc.save( function(err){
            connection.close();
            if(err) console.error(err.toString());
        });
    });

};

/**
 * Cancella l'utente selezionato
 * @param username
 * @param callback
 */
User.delUser = function(username, callback){

    var Projects = require('../model/Project');

    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var users = connection.model(MODEL_NAME, USER_SCHEMA);

    async.parallel({

        //users
        user:function(next){
            users.remove({username:username}, function(err, result){
                next(err);
            })
        },

        //projects
        projects:function(next){
            Projects.delUserProjects( {connection:connection, user:username} , function(err, result){
                next(err);
            })
        }

    }, function(err, result){
        callback(err)
    });
};

module.exports = User;

