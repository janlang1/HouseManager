var express = require("express");
var router  = express.Router({mergeParams: true});
var User = require("../models/user");
var middleware = require("../middleware");
//note to self dont need mongoose in the routes bc its in the model
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

//document support
//add document to house
router.post("/:userId/document",  middleware.isLoggedIn, uploaddoc.single('doc'),function(req, res){
    // get data from form and add to campgrounds array
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        // add cloudinary url for the image to the campground object under image property
        var newDoc = {
            documentUrl: result.secure_url,
            documentId: result.public_id,
            documentName: result.original_filename
        }
        // req.body.camp.image = result.secure_url;
        // req.body.camp.imageId = result.public_id;
        // add author to campground
        
        User.findById(req.params.userId, (err, user)=>{
            //does mongodb have a better way to see if object could use mongoose-unique-validator
            user.documents.push(newDoc);
            user.save();
            req.flash("success", "document added to user");
            res.redirect('/profile/' + req.params.userId);
        }); 
    });
    
});

//delete document from campgground
router.delete("/:userId/document/:docID",middleware.isLoggedIn, function(req, res){
    User.findById(req.params.userId, async function(err, user) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
        try {
            let index;
            for(var i = 0; i < user.documents.length; i += 1){
                console.log(index);
                if(user.documents[i].documentId === req.params.docID) index = i;
            }
            console.log(index);
            if(index){
                user.documents.splice(index, 1);
            }
            //ran into random bug where it wont splic index 0
            if(index === 0 ){
                user.documents.shift();
            }
            user.save();
            await cloudinary.v2.uploader.destroy(req.params.docID);
            req.flash('success', 'document deleted successfully!');
            res.redirect('/profile/' + user._id); //can use req.params
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
      });
 });

module.exports = router;