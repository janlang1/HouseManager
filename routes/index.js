var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Comment = require("../models/comment");
var Campground = require("../models/campground");
var middleware = require("../middleware/")

//root route
router.get("/", function(req, res){
    res.render("home");
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    if(req.body.adminCode === "ago"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username); //can use newUser.username
           res.redirect("/campgrounds"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "logged out");
   res.redirect("/campgrounds");
});

// NEED TO MOVE TO OWN ROUTES PAGE
// admin route
router.get("/admin", middleware.isLoggedIn, function(req, res){
    if(req.user.isAdmin){
        Campground.find({}, (err, allCampgrounds)=>{
            if(err){
                console.log(err);
            } else {
                User.find({}, (err, allUsers)=>{
                    if(err){
                        console.log(err);
                    } else {
                        res.render("admin", {campgrounds: allCampgrounds, users: allUsers});
                    }
                });
            }
        });
    } else {
        req.flash("error", "You are not an ADMIN")
        res.redirect("/campgrounds");
    }
 });


module.exports = router;