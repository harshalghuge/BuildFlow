const express = require("express");

const router = express.Router();

const {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  confirmDelivery,
  cancelDelivery,
} = require("../controllers/deliveryController");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");


// Create delivery
router.post(
  "/",
  authenticate,
  authorize("OWNER", "STAFF"),
  createDelivery
);


// Get all deliveries
router.get(
  "/",
  authenticate,
  authorize("OWNER", "STAFF"),
  getDeliveries
);


// Get single delivery
router.get(
  "/:id",
  authenticate,
  authorize("OWNER", "STAFF"),
  getDeliveryById
);


// Confirm delivery
router.patch(
  "/:id/confirm",
  authenticate,
  authorize("OWNER"),
  confirmDelivery
);


// Cancel delivery
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("OWNER"),
  cancelDelivery
);


module.exports = router;
