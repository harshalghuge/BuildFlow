const express = require("express");

const {
  createInvoiceFromDelivery,
  getInvoices,
  getInvoiceById,
  confirmInvoice,
  cancelInvoice,
} = require("../controllers/invoiceController");

const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.use(authenticate);

router.post(
  "/from-delivery/:deliveryId",
  authorize("OWNER"),
  createInvoiceFromDelivery
);

router.get(
  "/",
  authorize("OWNER", "STAFF"),
  getInvoices
);

router.get(
  "/:id",
  authorize("OWNER", "STAFF"),
  getInvoiceById
);

router.patch(
  "/:id/confirm",
  authorize("OWNER"),
  confirmInvoice
);

router.patch(
  "/:id/cancel",
  authorize("OWNER"),
  cancelInvoice
);

module.exports = router;
