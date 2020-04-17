// import dendencies
const mongoose = require("mongoose");

// create user model
const User = mongoose.model("User", {
  email: { type: String, unique: true },
  token: String,
  hash: { type: String, select: true },
  salt: { type: String, select: true },
  account: {
    username: { type: String, required: true },
    phone: { type: String },
  },
});

module.exports = User;
