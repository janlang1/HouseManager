var express = require("express");
var router  = express.Router({mergeParams: true});
var User = require("../models/user");
var middleware = require("../middleware");
//note to self dont need mongoose in the routes bc its in the model

router.get("/:userId", (req,res) => {
    User.findById(req.params.userId, (err, userProfile)=>{
        if(err){
            console.log(err);
        } else {
            res.render("profile/index", {userProfile: userProfile});
        }
    });
});

router.get("/:userId/edit", middleware.checkProfileOwnership, (req,res) => {
    User.findById(req.params.userId, (err, foundUserProfile)=>{
        if(err){
            console.log(err);
        } else {
            res.render("profile/edit", {userProfile: foundUserProfile});
        }
    });
});

router.put("/:userId", middleware.checkProfileOwnership,(req,res) => {
    User.findByIdAndUpdate(req.params.userId, req.body.profile, (err, updatedUserProfile)=>{
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            res.redirect("/profile/" + req.params.userId);
        }
    });
});

//admin stuff
//make admin
router.put("/:userId/makeadmin", middleware.isLoggedIn,(req,res) => {
    if(req.user.isAdmin){
        let updatedUser = {
            isAdmin: true
        };
        User.findByIdAndUpdate(req.params.userId, updatedUser, (err, updatedUserProfile)=>{
            if(err){
                console.log(err);
                res.redirect("/admin");
            } else {
                res.redirect("/admin");
            }
        });
    }
    
});

//delete user
router.delete("/:userId", middleware.isLoggedIn, (req,res) => {
    if(req.user.isAdmin){
        User.findByIdAndRemove(req.params.userId, (err, removedUserProfile)=>{
            if(err){
                console.log(err);
                req.flash("error", "couldn't remove user");
                res.redirect("/admin");
            } else {
                req.flash("success", "User Deleted");
                res.redirect("/admin");
            }
        });
    }
    
});

module.exports = router;