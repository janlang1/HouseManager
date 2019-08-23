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

var docFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(pdf)$/i)) {
        return cb(new Error('Only document files are allowed!'), false);
    }
    cb(null, true);
};
var uploaddoc = multer({ storage: storage, fileFilter: docFilter})


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
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        console.log(result);
        // add cloudinary url for the image to the campground object under image property
        req.body.camp.image = result.secure_url;
        req.body.camp.imageId = result.public_id;
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

//add document to house
router.post("/:id/document",  middleware.isLoggedIn, uploaddoc.single('doc'),function(req, res){
    // get data from form and add to campgrounds array
    if(req.user.isAdmin){
        cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
            console.log(result);
            // add cloudinary url for the image to the campground object under image property
            var newDoc = {
                documentUrl: result.secure_url,
                documentId: result.public_id,
                documentName: result.original_filename
            }
            // req.body.camp.image = result.secure_url;
            // req.body.camp.imageId = result.public_id;
            // add author to campground
            
            Campground.findById(req.params.id, (err, campground)=>{
                //does mongodb have a better way to see if object could use mongoose-unique-validator
                campground.documents.push(newDoc);
                campground.save();
                req.flash("success", "document added");
                res.redirect('/campgrounds/' + campground._id);
            }); 
          });
    }
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
            req.flash("error", "no such house found");
            res.redirect("/campgrounds")
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
router.put("/:id",upload.single('image'),middleware.checkCampgroundOwnership, function(req, res){
    // find and update the correct campground

    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.camp.name;
            campground.description = req.body.camp.description;
            campground.price = req.body.camp.price;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, async function(err, campground) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(campground.imageId);
            while(campground.documents.length > 0){
                await cloudinary.v2.uploader.destroy(campground.documents[0].documentId);
            }
            campground.remove();
            req.flash('success', 'Campground deleted successfully!');
            res.redirect('/campgrounds');
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
      });
 });

 //delete document from campgground
 router.delete("/:id/document/:docID",middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, async function(err, campground) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
        try {
            let index;
            for(var i = 0; i < campground.documents.length; i += 1){
                if(campground.documents[i].documentId === req.params.docID) index = i;
            }
            if(index){
                campground.documents.splice(index, 1);
            }
            if(index === 0 ){
                user.documents.shift();
            }
            campground.save();
            await cloudinary.v2.uploader.destroy(req.params.docID);
            req.flash('success', 'document deleted successfully!');
            res.redirect('/campgrounds/' + campground._id);
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
      });
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