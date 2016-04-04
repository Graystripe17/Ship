var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var session = require("express-session");
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mongodb_url_prefix = "mongodb://localhost:27017/";
var database_name = "ShipDB";
var ShipDB_url = mongodb_url_prefix + database_name;
var collection_name_users = "users";
var collection_name_colleges = "colleges";

router.use(session({
    cookieName: 'session',
    secret: 'random_string',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

router.use(passport.initialize());
router.use(passport.session());

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
    var url = mongodb_url_prefix + database_name;
    MongoClient.connect(url, function(err, db) {
       if(!err) {
           console.log("Connection established successfully");
           req.checkBody('username', 'Name is required').notEmpty();
           // req.checkBody('email', 'Email is not valid').isEmail();
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

router.post('/google', passport.authenticate('local', { successRedirect: '/',
                                                        failureRedirect: '/ppooop'}))

router.post('/insert', function(req, res) {
    var MongoClient = mongodb.MongoClient;
    var URL = mongodb_url_prefix + database_name;
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
    var url = mongodb_url_prefix + database_name;
    MongoClient.connect(url, function(err, db) {
        if(!err) {
            var college_collection = db.collection(collection_name_colleges);
            var college_search_value =  req.param('college_input');
            console.log(college_search_value);
            college_collection.find(
                // The following uses indexed text scoring
                {$text: {$search: college_search_value}}, {score: {$meta:"textScore"}}
                // The following uses regex search
                //{ "institution name": new RegExp(college_search_value, 'i')}
            ).sort( { score: {$meta: "textScore" }})
                .limit(20).toArray(function(err, result) {
                if(!err) {
                    if(result.length) {
                        var response_string = "Success: found " + result.length + " or more result(s)<br>" ;
                        //for(var i = 0; i < result.length; i++) {
                        //    response_string += result[i]['institution name'];
                        //    response_string += "<br>";
                        //}
                        response_string += result.map(function(x) {
                            return x['institution name'] + "<br>";
                        });
                        res.send(response_string);
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






passport.use(new GoogleStrategy( {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "localhost:3000/auth/google/callback:"
    },
    function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return done(err, user);
        })
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login']}));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    }
);





module.exports = router;
