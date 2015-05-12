var arg_index = { username:'' , project:'' };

var _USERNAME = "username";
var _IS_AUTH = "isauth";

module.exports = function (app) {

    app.get('/', function (req, res) {
        res.redirect('/login');
    });

    app.get('/login', function (req, res) {
        var message = { error:false , message: '' };
        res.render('../views/pages/login.ejs', message);
    });

    var request;

    app.post('/login', function (req, res) {

        var username = req.body.username;
        var password = req.body.password;
        var message = { error:false , message: '' };

        request = req;

        if ( username == "" || password == "" ) {
            message.error = true;
            message.message = "Username or password missing";
            res.render('../views/pages/login.ejs', message);
            return;
        }

        User = require('../model/User');

        User.getUserPsw(username , password , function(data)
        {
            message.error = true;
            message.message = "User not found";

            if ( data == null )
            {
                res.render('../views/pages/login.ejs', message );
            }
            else
            {
                var sess = request.session;
                sess.username = username;
                res.redirect('/index');
            }

        });

    });

    app.get('/register', function (req, res) {
        var message = { error:false , message: '' };
        res.render('../views/pages/register.ejs', message);
    });

    app.post('/register', function (req, res) {

        var username = req.body.username;
        var password = req.body.password;
        var name = req.body.name;
        var lastname = req.body.lastname;

        User = require("../model/User");

        var newUser = new User(req.body);
        User.save(newUser ,
            function(result, message)
            {
                var arg = { error:false , message: '' };

                if ( result >= 0 )
                    res.redirect('/login');
                else
                {
                    arg.message = message;
                    arg.error = true;
                    res.render('../views/pages/register.ejs', arg);
                }
            }
        );


    });

    app.get('/index', function (req, res) {

        var sess = req.session;
        var username = sess.username;
        var arg = arg_index;

        arg.username = username;

        res.render('../views/pages/index.ejs', arg);
    });

    app.get('/test', function (req, res) {
        res.render('../views/pages/test.ejs', {} );
    });

};
