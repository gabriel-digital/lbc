// import dendencies
const mongoose = require("mongoose");

// create offer model
const Offer = mongoose.model("Offer", {
  created: Date,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: { type: String, required: true },
  picture: Object,
  price: { type: Number, required: true },
  title: { type: String, required: true },
});

module.exports = Offer;
