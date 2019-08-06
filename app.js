const   express     = require("express"),
        bodyParser  = require("body-parser"),
        mongoose    = require("mongoose"),
        flash = require("connect-flash"),
        passport    = require("passport"),
        LocalStrategy = require("passport-local"),
        methodOverride = require("method-override"),
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
app.use(methodOverride("_method"));
app.use(flash()); //session already set up bellow

//passport configuration:
app.use(require("express-session")({
    secret: "idk what this does",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session()); // need this so that the user gets saved when logged in
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//applies to all routes, no need to pass in render
app.use(function(req, res, next){
    res.locals.currentUser = req.user; //passport makes req.user
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
 });

//ROUTES
const   commentRoutes    = require("./routes/comments"),
        campgroundRoutes = require("./routes/campgrounds"),
        indexRoutes      = require("./routes/index")

 //moved all the routes to individual files to make app.js look better
 app.use("/", indexRoutes); //the first parameter passes in a the prefix for the other routes in the file
 app.use("/campgrounds", campgroundRoutes);
 app.use("/campgrounds/:id/comments", commentRoutes);


var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server Has Started!");
});
// var listener = app.listen(3000);
// console.log('Your friendly Express server, listening on port %s', listener.address().port); //%s indicates string value
