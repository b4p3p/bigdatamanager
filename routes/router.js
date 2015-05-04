module.exports = function (app) {

    app.get('/', function (req, res) {
        res.redirect('/login');
    });

    app.get('/login', function (req, res) {
        var message = { error:false , message: '' };
        res.render('../views/pages/login.ejs', message);
    });

    app.post('/login', function (req, res) {

        var username = req.body.username;
        var password = req.body.password;
        var message = { error:false , message: '' };

        if ( username == "" || password == "" ) {
            message.error = true;
            message.message = "Username or password missing";
            res.render('../views/pages/login.ejs', message);
            return;
        }

        var db = require('../controller/db');
        var user = db.getUser(username, password);

        message.error = true;
        message.message = "User not found";
        res.render('../views/pages/login.ejs', message );

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
        newUser.save(
            function(result, message)
            {
                var arg = { error:false , message: '' };

                if ( result >= 0 )
                    res.render('../views/pages/index.ejs');
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

        res.render('views/pages/index.ejs');
    });

};
