const express = require("express");

const {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  updateMaterialStatus,
} = require("../controllers/materialController");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();


// ======================================================
// ALL MATERIAL ROUTES REQUIRE LOGIN
// ======================================================

router.use(authenticate);


// CREATE
router.post(
  "/",
  authorize("OWNER"),
  createMaterial
);


// GET ALL
router.get(
  "/",
  authorize("OWNER", "STAFF"),
  getMaterials
);


// GET ONE
router.get(
  "/:id",
  authorize("OWNER", "STAFF"),
  getMaterialById
);


// UPDATE
router.put(
  "/:id",
  authorize("OWNER"),
  updateMaterial
);


// CHANGE STATUS
router.patch(
  "/:id/status",
  authorize("OWNER"),
  updateMaterialStatus
);


module.exports = router;
