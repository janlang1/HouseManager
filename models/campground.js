var mongoose = require("mongoose");
const Comment = require("./comment")

var campgroundSchema = new mongoose.Schema({
    name:String,
    image: String,
    description: String,
    comments: [
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
         }
    ]
});

//store by ID and not the entire thing
//return statement
module.exports = mongoose.model("Campground", campgroundSchema);