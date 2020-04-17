// set environnement variables
require("dotenv").config();
// import dependencies
const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const compression = require("compression");

const app = express();
app.use(cors());
app.use(formidable());
app.use(compression());

// connect to BDD
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// connect to cloudinary
cloudinary.config({
  cloud_name: "gabcdn",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// import & use routes
const userRoutes = require("./routes/user-routes.js");
app.use(userRoutes);

const offerRoutes = require("./routes/offer-routes.js");
app.use(offerRoutes);

// handle 404
app.all("*", (req, res) => {
  res.status(404).json({
    error: {
      message: "error 404 : page not found",
    },
  });
});

// start server
app.listen(process.env.PORT, () => {
  console.log("Server started, got get them Tiger ! 🐯");
});
