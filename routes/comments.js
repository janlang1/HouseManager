var express = require("express");
var router  = express.Router({mergeParams: true}); //allows the :id to get passed in from campgrounds
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find campground by id
    console.log(req.params.id);
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {campground: campground});
        }
    })
});

//Comments Create
router.post("/", middleware.isLoggedIn,function(req, res){
   //lookup campground using ID
   Campground.findById(req.params.id, function(err, campground){
       if(err){
           console.log(err);
           res.redirect("/campgrounds");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               req.flash("error", "something went wrong");
               console.log(err);
           } else {
               comment.author.id = req.user._id; //cant use currentUser bc this is a req part not a res part i think lol idk
               comment.author.username = req.user.username;
               comment.save();
               campground.comments.push(comment);
               campground.save();
               console.log(comment);
               req.flash("success", "comment added");
               res.redirect('/campgrounds/' + campground._id); //same as req.params.id
           }
        });
       }
   });
});

// EDIT COMMENT ROUTE
router.get("/:comment_id", middleware.checkCampgroundOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        res.render("comments/edit", {comment: foundComment});
    });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
       if(err){
           res.redirect("back");
       } else {
           res.redirect("/campgrounds/" + req.params.id );
       }
    });
 });
 
 // COMMENT DESTROY ROUTE
 router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
     //findByIdAndRemove
     Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "comment deleted");
            res.redirect("/campgrounds/" + req.params.id); 
        }
     });
 });

module.exports = router;