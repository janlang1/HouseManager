var express = require("express");
var router  = express.Router(); //creates routes in other foldrers
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'johnwebapp', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    // get data from form and add to campgrounds array
    cloudinary.uploader.upload(req.file.path, function(result) {
        console.log(result);
        // add cloudinary url for the image to the campground object under image property
        req.body.camp.image = result.secure_url;
        // add author to campground
        req.body.camp.author = {
          id: req.user._id,
          username: req.user.username
        }
        Campground.create(req.body.camp, function(err, campground) {
          if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          res.redirect('/campgrounds/' + campground.id);
        });
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

 //delete user from array in campground.users
 router.delete("/:id/user",middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, (err, foundCampground)=>{
        if(err){
            console.log(err);
            res.redirect("/campgrounds/" + req.params.id);
       } else {
            let index = foundCampground.users.indexOf(req.user._id);
            if(index > -1){
                foundCampground.users.splice(index, 1);
            }
            foundCampground.save();
            res.redirect("/campgrounds/" + req.params.id);
       }
    });
 });

module.exports = router;