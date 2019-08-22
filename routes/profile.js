var express = require("express");
var router  = express.Router({mergeParams: true});
var User = require("../models/user");
var middleware = require("../middleware");
//note to self dont need mongoose in the routes bc its in the model

router.get("/:userId", (req,res) => {
    console.log(req.User);
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

module.exports = router;