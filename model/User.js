var User = function (data) {
    this.data = data;
};

var model_name = "users";

var mongoose = require('mongoose');

const USER_SCHEMA = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    lastName: String
});

User.prototype.data = {};    //json

User.prototype.getUsername = function()
{
    return this.data.username;
};

User.save = function(user, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');
    var username = user.getUsername();
    var userdata = user.data;

    User.getUser( username,
        function (data) {
        if (data != null)
        {
            callback(-1 , "User already exists" );
            connection.close();
        }
        else
        {
            //var conn = mongoose.createConnection('mongodb://localhost/oim');
            var Model = connection.model(model_name, USER_SCHEMA);
            var newuser = new Model( user.data );

            newuser.save( function(err) {
                if (err)
                    callback(-2, err ); //error
                callback(0, "" );       //OK

                connection.close();
            });
        }
    });

};

User.getUser = function (username, callback)
{
    var connection = mongoose.createConnection('mongodb://localhost/oim');

    var Users = connection.model(model_name, USER_SCHEMA);

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

    var Users = connection.model(model_name, USER_SCHEMA);

    Users.findOne({username: username, password:password }, function (err, doc)
    {
        console.log(doc);
        console.log("CALL getUsers -> findOne");
        callback(doc);
        connection.close();
    });
};

module.exports = User;

