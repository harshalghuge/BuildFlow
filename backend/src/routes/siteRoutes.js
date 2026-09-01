const express = require("express");

const {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  updateSiteStatus,
} = require("../controllers/siteController");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();


// ======================================================
// ALL SITE ROUTES REQUIRE LOGIN
// ======================================================

router.use(authenticate);


// CREATE
router.post(
  "/",
  authorize("OWNER"),
  createSite
);


// GET ALL
router.get(
  "/",
  authorize("OWNER", "STAFF"),
  getSites
);


// GET ONE
router.get(
  "/:id",
  authorize("OWNER", "STAFF"),
  getSiteById
);


// UPDATE
router.put(
  "/:id",
  authorize("OWNER"),
  updateSite
);


// CHANGE STATUS
router.patch(
  "/:id/status",
  authorize("OWNER"),
  updateSiteStatus
);


module.exports = router;
