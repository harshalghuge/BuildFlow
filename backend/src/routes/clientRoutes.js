const express = require("express");

const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  updateClientStatus,
} = require("../controllers/clientController");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();


// ======================================================
// ALL CLIENT ROUTES REQUIRE LOGIN
// ======================================================

router.use(authenticate);


// CREATE
router.post(
  "/",
  authorize("OWNER"),
  createClient
);


// GET ALL
router.get(
  "/",
  authorize("OWNER", "STAFF"),
  getClients
);


// GET ONE
router.get(
  "/:id",
  authorize("OWNER", "STAFF", "CLIENT"),
  getClientById
);


// UPDATE
router.put(
  "/:id",
  authorize("OWNER"),
  updateClient
);


// CHANGE STATUS
router.patch(
  "/:id/status",
  authorize("OWNER"),
  updateClientStatus
);


module.exports = router;