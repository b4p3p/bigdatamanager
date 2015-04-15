var User = function (data) {
    this.data = data;
};

var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    username: String ,
    password: String ,
    name: String ,
    lastname: String
});

User.prototype.data = {};   //json del dato

//User.prototype.username = "";
//User.prototype.password = "";

User.prototype.getUsername = function()
{
    return this.data.username;
};

//
//User.prototype.getPassword = function()
//{
//    return this.data.password;
//};

User.prototype.save  = function()
{
    var testUser = getUser(this.getUsername());

    mongoose.createConnection('mongodb://localhost/oim');

    var Users = mongoose.model('Users', userSchema);

    var u = new Users( this.data );

    u.save(function(err, thor) {
        if (err) return console.error(err);
        console.dir(thor);
    });

    mongoose.connection.close();

};

module.exports = User;

function getUser(username)
{
    mongoose.createConnection('mongodb://localhost/oim');

    var Users = mongoose.model('Users', userSchema);
    var user = null;

    Users.findOne( {username: username } ,"username" , function (err, doc)
    {
        test();
    });

    mongoose.connection.close();

    console.log("porco cane");

    return user;
}

function test()
{
    console.log("porco cane");
}

/* static function */
exports.getUser = getUser;

