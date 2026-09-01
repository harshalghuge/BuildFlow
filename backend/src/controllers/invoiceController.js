const mongoose = require("mongoose");

const Delivery = require("../models/Delivery");
const Invoice = require("../models/Invoice");
const { createAuditLog } = require("../services/auditService");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const allowedStatuses = ["DRAFT", "CONFIRMED", "CANCELLED"];

const generateInvoiceNumber = async (organizationId) => {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({
    organizationId,
  });

  return `INV-${year}-${String(count + 1).padStart(6, "0")}`;
};

const createInvoiceFromDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    if (!isValidObjectId(deliveryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery id",
      });
    }

    const delivery = await Delivery.findOne({
      _id: deliveryId,
      organizationId: req.user.organizationId,
    }).lean();

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Invoice can only be generated from a confirmed delivery",
      });
    }

    const existingInvoice = await Invoice.findOne({
      organizationId: req.user.organizationId,
      deliveryId,
    }).lean();

    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: "Invoice already exists for this delivery",
      });
    }

    const invoice = await Invoice.create({
      organizationId: req.user.organizationId,
      clientId: delivery.clientId,
      siteId: delivery.siteId,
      deliveryId: delivery._id,
      invoiceNumber: await generateInvoiceNumber(req.user.organizationId),
      invoiceDate: new Date(),
      items: delivery.items,
      subtotal: delivery.subtotal,
      gstAmount: delivery.gstAmount,
      totalAmount: delivery.totalAmount,
      status: "DRAFT",
    });

    await createAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      action: "INVOICE_CREATED",
      entityType: "Invoice",
      entityId: invoice._id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        deliveryId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });

  } catch (error) {
    console.error("Create invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create invoice",
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const {
      clientId,
      siteId,
      status,
      fromDate,
      toDate,
    } = req.query;

    const filter = {
      organizationId: req.user.organizationId,
    };

    if (clientId) {
      if (!isValidObjectId(clientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client id",
        });
      }

      filter.clientId = clientId;
    }

    if (siteId) {
      if (!isValidObjectId(siteId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid site id",
        });
      }

      filter.siteId = siteId;
    }

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      filter.status = status;
    }

    if (fromDate || toDate) {
      filter.invoiceDate = {};

      if (fromDate) {
        filter.invoiceDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.invoiceDate.$lte = new Date(toDate);
      }
    }

    const invoices = await Invoice.find(filter)
      .populate("clientId", "companyName")
      .populate("siteId", "siteName")
      .populate("deliveryId", "deliveryNumber")
      .sort({ invoiceDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });

  } catch (error) {
    console.error("Get invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
    });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    })
      .populate("clientId", "companyName")
      .populate("siteId", "siteName")
      .populate("deliveryId", "deliveryNumber")
      .lean();

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });

  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
    });
  }
};

const confirmInvoice = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (invoice.status === "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already confirmed",
      });
    }

    if (invoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled invoice cannot be confirmed",
      });
    }

    invoice.status = "CONFIRMED";
    invoice.confirmedBy = req.user.userId;
    invoice.confirmedAt = new Date();

    await invoice.save();

    await createAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      action: "INVOICE_CONFIRMED",
      entityType: "Invoice",
      entityId: invoice._id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Invoice confirmed successfully",
      data: invoice,
    });

  } catch (error) {
    console.error("Confirm invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm invoice",
    });
  }
};

const cancelInvoice = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice id",
      });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (invoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already cancelled",
      });
    }

    invoice.status = "CANCELLED";

    await invoice.save();

    await createAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      action: "INVOICE_CANCELLED",
      entityType: "Invoice",
      entityId: invoice._id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Invoice cancelled successfully",
      data: invoice,
    });

  } catch (error) {
    console.error("Cancel invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel invoice",
    });
  }
};

module.exports = {
  createInvoiceFromDelivery,
  getInvoices,
  getInvoiceById,
  confirmInvoice,
  cancelInvoice,
};
