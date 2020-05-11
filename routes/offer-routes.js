//import dependencies
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/offer-model");
const isAuthenticated = require("../middlewares/is-authenticated");

/* ************************** 
 publish offer 
 ************************* */
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // check all arguments are here
    if (!req.fields.title || !req.fields.description || !req.fields.price) {
      return res.status(400).json({
        error: { message: "Missing title, description, price or user" },
      });
    }

    //check arguments are correct
    if (
      req.fields.title.length > 50 ||
      req.fields.description.length > 1000 ||
      req.fields.price > 100000
    ) {
      return res.status(400).json({ error: { message: "Invalid data" } });
    }

    // upload file to cloudinary
    const picture = await cloudinary.uploader.upload(req.files.picture.path);

    // everything's fine, let's create an offer !
    const date = Date.now();
    const offer = new Offer({
      created: date,
      title: req.fields.title,
      description: req.fields.description,
      price: req.fields.price,
      creator: req.user, // comes from middleware
      picture: picture,
    });
    await offer.save();
    return res.json({
      _id: offer._id,
      title: offer.title,
      created: offer.created,
      description: offer.description,
      price: offer.price,
      creator: {
        account: {
          username: offer.creator.account.username,
          phone: offer.creator.account.phone,
        },
        _id: offer.creator._id,
      },
      picture: {
        secure_url: offer.picture.secure_url,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* ************************** 
show offers and filter 
************************* */
router.get("/offer/with-count", async (req, res) => {
  try {
    // filter by title & min/max price
    let search = {};
    if (req.query.title) {
      search["title"] = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin && req.query.priceMax) {
      search["price"] = { $gte: req.query.priceMin, $lte: req.query.priceMax };
    } else if (req.query.priceMin) {
      search["price"] = { $gte: req.query.priceMin };
    } else if (req.query.priceMax) {
      search["price"] = { $lte: req.query.priceMax };
    }

    // sort by date & price
    let sort = {};
    switch (req.query.sort) {
      case "price-desc":
        sort["price"] = "desc";
        break;
      case "price-asc":
        sort["price"] = "asc";
        break;
      case "date-desc":
        sort["created"] = "desc";
        break;
      case "date-asc":
        sort["created"] = "asc";
        break;
    }

    //pagination
    let limit = 10;
    let skip = 0;
    if (req.query.page && req.query.page > 0) {
      skip = limit * (req.query.page - 1);
    }
    // for pages checks, we first need count, see below

    // all settings done, let's find & answer something
    const offers = await Offer.find(search)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate({
        path: "creator",
        select: "-hash -salt -token -email -__v",
      });
    const count = offers.length;
    const pages = count / limit;
    // now we can limit pagination
    if (req.query.page > pages) {
      return res
        .status(400)
        .json({ error: { message: "Invalid page number" } });
    }
    return res.json({ pages: pages, offers: offers });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* ************************** 
show offer with id 
************************* */
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "creator",
      select: "-hash -salt -token -email -__v",
    });
    if (!offer) {
      return res.status(400).json({ error: { message: "invalid ID" } });
    } else {
      return res.json({
        _id: offer._id,
        title: offer.title,
        description: offer.description,
        price: offer.price,
        creator: offer.creator,
        created: offer.created,
        picture: offer.picture,
      });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* ************************** 
delete offer 
************************* */
router.delete("/offer/delete", async (req, res) => {
  // check id exist
  const found = await Offer.findById(req.fields.offerId);
  if (!found) {
    return res.status(400).json({ error: { message: "invalid ID" } });
  } else {
    //if so, delete !
    await Offer.findByIdAndDelete(req.fields.offerId);
    return res.json({ message: "Offer deleted" });
  }
});

module.exports = router;
