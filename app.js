const   express     = require("express"),
        bodyParser  = require("body-parser"),
        mongoose    = require("mongoose"),
        passport    = require("passport"),
        LocalStrategy = require("passport-local"),
        Campground  = require("./models/campground"),
        Comment     = require("./models/comment"),
        User        = require("./models/user"),
        seedDB      = require("./seeds"),
        app         = express();

mongoose.connect("mongodb://localhost:27017/house_manager", {useNewUrlParser: true});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public")); //_dirname is big directory in this case housemanager
//seedDB(); //stop seeeding

//passport configuration:
app.use(require("express-session")({
    secret: "idk what this does",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res) => {
    res.render("home.ejs");
});

//========RESTFUL ROUTES===========//
//INDEX
app.get("/campgrounds", (req,res) =>{
	//instead of basing in a array it passes in the db
	Campground.find({}, (err,allcampgrounds)=>{
		if(err){
			console.log(err);
		} else {
			res.render("campgrounds/index", {campgrounds:allcampgrounds});
		}
	});
});

//CREATE
app.post("/campgrounds", (req,res) => {
	// var name = req.body.name;
	// var imageurl = req.body.image;
    // var desc = req.body.description; instead of all this we can use varname[item] to create an object
	var newCamp = req.body.camp;
	Campground.create(newCamp, (err, newlyCreatedCamp)=>{
		if(err){
			console.log(err); //usually give error message and redirect to form
		} else {
			console.log("added a new camp");
			res.redirect("/campgrounds");
		}
	});
});

//NEW
app.get("/campgrounds/new", (req,res) => {
	res.render("campgrounds/new");
});

//SHOW
app.get("/campgrounds/:id", (req,res) => {
    //req.params is the : stuff
    //.populate and .exec put the actual comments from that id into the campground comment array
	Campground.findById(req.params.id).populate("comments").exec((err, foundCampground)=>{
		if(err){
			console.log(err);
		} else{
			res.render("campgrounds/show", {campground:foundCampground});
		}
	});
	
});

//comment routes
app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res){
    // find campground by id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {campground: campground});
        }
    })
});

app.post("/campgrounds/:id/comments", isLoggedIn, function(req, res){
    //lookup campground using ID
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else {
         Comment.create(req.body.comment, function(err, comment){
            if(err){
                console.log(err);
            } else {
                campground.comments.push(comment);
                campground.save();
                res.redirect('/campgrounds/' + campground._id); //same as req.params.id
            }
         });
        }
    });
    //create new comment
    //connect new comment to campground
    //redirect campground show page
 });

//AUTH ROUTES
//show register page
app.get("/register", (req, res) =>{
    res.render("register"); 
 });
 //handles sign up logic
 app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/campgrounds"); 
        });
    });
});

// show login form
app.get("/login", function(req, res){
    res.render("login"); 
 });
 // handling login logic
 app.post("/login", passport.authenticate("local", 
     {
         successRedirect: "/campgrounds",
         failureRedirect: "/login"
     }), function(req, res){
 });
 // logic route
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/campgrounds");
 });
 
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     res.redirect("/login"); //if not logged in sends them to 
 }


var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server Has Started!");
});
// var listener = app.listen(3000);
// console.log('Your friendly Express server, listening on port %s', listener.address().port); //%s indicates string value
