//import dependencies
const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const User = require("../models/user-model");

/* ************* 
 user sign up 
 ************ */
router.post("/user/sign_up", async (req, res) => {
  try {
    console.log(req.fields);
    // check username exist in query
    if (!req.fields.username || !req.fields.email || !req.fields.password) {
      return res
        .status(400)
        .json({ error: { message: "missing username, email or password" } });
    }

    // check mail isn't already used
    const found = await User.findOne({ email: req.fields.email });
    if (found) {
      return res.status(400).json({ error: { message: "mail already taken" } });
    }

    // everthing's fine, let's create a new user !
    // first, hash password
    const password = req.fields.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);
    // create user
    const user = new User({
      hash: hash,
      salt: salt,
      token: token,
      email: req.fields.email,
      account: {
        username: req.fields.username,
        phone: req.fields.phone,
      },
    });
    // save user in bdd and answer client
    await user.save();
    return res.json({
      _id: user._id,
      token: user.token,
      email: user.email,
      account: {
        username: user.account.username,
        phone: user.account.phone,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* ************* 
 user log in
 ************ */
router.post("/user/log_in", async (req, res) => {
  try {
    // check we have a useranme & password
    if (!req.fields.email || !req.fields.password) {
      return res
        .status(400)
        .json({ error: { message: "email or password missing" } });
    }
    // check user exist
    const user = await User.findOne({ email: req.fields.email });
    if (!user) {
      return res.status(400).json({ error: { message: "unkown user" } });
    }
    const hash = SHA256(req.fields.password + user.salt).toString(encBase64);
    console.log(hash, user.hash);
    // check password
    if (hash !== user.hash) {
      return res.status(400).json({ error: { message: "invalid password" } });
    }
    // everything's fine, welcome user !
    return res.json({ user.account.username, user.account.token, message: `Welcome ${user.account.username} !` });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
