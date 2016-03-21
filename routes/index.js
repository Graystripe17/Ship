var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var session = require("express-session");
var database_name = "ShipDB";
var collection_name_users = "users";
var collection_name_colleges = "colleges";
var mongodb_url_prefix = "mongodb://localhost:27017/";

router.use(session({
    cookieName: 'session',
    secret: 'random_string',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

// TODO: Implement OAuth 2.0

router.get('/', function(req, res, next) {
    if(req.session.user) {
        res.redirect('/home');
    } else {
        res.render('index', {title: 'SHIP'});
    }
});

router.get('/home', function(req, res) {
    res.render('home.jade', { title: "Home" });
});

router.post('/validate', function(req, res) {
    var MongoClient = mongodb.MongoClient;
    var url = "mongodb://localhost:27017/"+database_name;
    MongoClient.connect(url, function(err, db) {
       if(!err) {
           console.log("Connection established successfully");
           var user_collection = db.collection(collection_name_users);
           var user_login_input = {
               username: req.body.username,
               password: req.body.password
           };
           user_collection.find(
               {
                   username: req.body.username,
                   password: req.body.password
               }
           ).toArray(function(err, result) {
               if(!err) {
                   if (result.length) {
                       // Successful login
                       req.session.user = result;
                       delete req.session.user.password;
                       res.redirect("home");
                   } else {
                       console.log(user_login_input);
                       res.send("Invalid login");
                   }
                   db.close();
               } else {
                   console.log(err);
               }
           });

       } else {
           console.log("Cannot connect ", err);
       }
    });

});

router.post('/insert', function(req, res) {
    var MongoClient = mongodb.MongoClient;
    var URL = "mongodb://localhost:27017/"+database_name;
    MongoClient.connect(URL, function(err, db) {
        if(!err) {
            var user_collection = db.collection(collection_name_users);
            // Do error checks below
            var user_create_account_input = {
                username: req.body.username,
                password: req.body.password
            };

            user_collection.insert(user_create_account_input, function(err, res) {
                console.log("Connected to database");
                if(!err) {
                    console.log("Successful insertion");
                    db.close();
                } else {
                    console.log(err);
                }
            });
            console.log("Disconnected from Server");
            req.session.user = user_create_account_input;
            res.redirect("home");
        } else {
            console.log("Could not connect: ", err);
        }
    });
});

router.get('/logout', function(req, res) {
    // Possible callback
    req.session.destroy();
    res.redirect('/');
});

router.get('/search', function(req, res) {
    var MongoClient = mongodb.MongoClient;
    var url = "mongodb://localhost:27017/"+database_name;
    MongoClient.connect(url, function(err, db) {
        if(!err) {
            var college_collection = db.collection(collection_name_colleges);
            var user_input_college = {
                "institution name": req.param('college_input')
            };
            console.log(user_input_college + "HI");
            college_collection.find( { "institution name": req.param('college_input')  } ).toArray(function(err, result) {
                if(!err) {
                    if(result.length) {
                        res.send(result.toString());
                    } else {
                        res.send("Nothing found!");
                    }
                    db.close();
                } else {
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
    });
});

module.exports = router;
