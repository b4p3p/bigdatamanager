var User = function (data) {
    this.data = data;
};

var model_name = "users";
var mongoose = require('mongoose');
var connection = null;

var userSchema = new mongoose.Schema({
    username: String ,
    password: String ,
    name: String ,
    lastname: String
});

User.prototype.data = {};               //json del dato

User.prototype.getUsername = function()
{
    return this.data.username;
};

User.prototype.save  = function(callback)
{
    connection = mongoose.createConnection('mongodb://localhost/oim');

    getUser( this.getUsername() ,  function (data)
    {
        if ( data != null)
        {
            callback(-1 , "User exists" );   //utente esistente
            connection.close();
        }
        else
        {
            //var conn = mongoose.createConnection('mongodb://localhost/oim');
            var Users = connection.model(model_name, userSchema);
            var u = new Users( this.data );
            u.save( function(err, thor) {
                if (err)
                    callback(-2, err ); //errore
                callback(0, "" );            //OK

                connection.close();

            });
        }
    });

};

module.exports = User;

function getUser(username, callback)
{
    connection = mongoose.createConnection('mongodb://localhost/oim');
    var Users = connection.model(model_name, userSchema);

    Users.findOne( {username: username } , function (err, doc)
    {
        console.log(doc);
        console.log("CALL getUsers -> findOne");
        callback(doc);
    });
}

/* static function */
exports.getUser = getUser;

