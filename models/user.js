var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    avatar: String,
    avatarId: String,
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    roomNumber: String,
    rent: Number,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type: Boolean, default: false},
    documents: [
        {
            documentUrl: String,
            documentId: String,
            documentName: String,
        }
    ]
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);