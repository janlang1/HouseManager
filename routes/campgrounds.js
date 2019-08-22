var express = require("express");
var router  = express.Router(); //creates routes in other foldrers
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
          res.render("campgrounds/index",{campgrounds:allCampgrounds, page: "campgrounds"});
       }
    });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.camp.name; //need camp bc the form wrapped name with camp object
    var image = req.body.camp.image;
    var desc = req.body.camp.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newCampground = {name: name, image: image, description: desc, author: author}
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            //console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
});

//add user to house
router.post("/:id/join", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var userToAdd = req.user;

    Campground.findById(req.params.id, (err, campground)=>{
        //does mongodb have a better way to see if object could use mongoose-unique-validator
        campground.users.push(userToAdd);
        campground.save();
        req.flash("success", "user added");
        res.redirect('/campgrounds/' + campground._id);
    })
        
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate("users").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id",middleware.checkCampgroundOwnership, function(req, res){
    // find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
       if(err){
           res.redirect("/campgrounds");
       } else {
           //redirect somewhere(show page)
           res.redirect("/campgrounds/" + req.params.id);
       }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err, campgroundRemoved){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
       } else {
           //why does this not work
           Comment.deleteMany({_id: {$in: campgroundRemoved.comments}}, (err)=>{
               if(err){
                   console.log(err);
               }
               res.redirect("/campgrounds");
           });
       }
    })
 });

module.exports = router;