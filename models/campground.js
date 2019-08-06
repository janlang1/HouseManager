var mongoose = require("mongoose");
const Comment = require("./comment")

var campgroundSchema = new mongoose.Schema({
    name:String,
    price: String,
    image: String,
    description: String,
    author: {
        id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
        },
        username: String
     },
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