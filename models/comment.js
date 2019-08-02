var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    author: String
});

//return statement
module.exports = mongoose.model("Comment", commentSchema);
