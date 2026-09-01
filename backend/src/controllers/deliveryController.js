const mongoose = require("mongoose");

const Delivery = require("../models/Delivery");
const Client = require("../models/Client");
const Site = require("../models/Site");
const Material = require("../models/Material");
const { createAuditLog } = require("../services/auditService");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const allowedStatuses = ["DRAFT", "CONFIRMED", "CANCELLED"];


// Generate delivery number
const generateDeliveryNumber = async (organizationId) => {
  const year = new Date().getFullYear();

  const count = await Delivery.countDocuments({
    organizationId,
  });

  return `DEL-${year}-${String(count + 1).padStart(6, "0")}`;
};


// Create Delivery
const createDelivery = async (req, res) => {
  try {
    const {
      clientId,
      siteId,
      deliveryDate,
      items,
      notes,
    } = req.body;

    const organizationId = req.user.organizationId;
    const userId = req.user.userId;

    // Basic validation
    if (!clientId || !siteId || !deliveryDate || !items) {
      return res.status(400).json({
        success: false,
        message: "clientId, siteId, deliveryDate and items are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one material is required",
      });
    }

    // Validate ObjectIds
    if (
      !isValidObjectId(clientId) ||
      !isValidObjectId(siteId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid clientId or siteId",
      });
    }

    // Check Client
    const client = await Client.findOne({
      _id: clientId,
      organizationId,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Check Site
    const site = await Site.findOne({
      _id: siteId,
      organizationId,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Make sure site belongs to client
    if (site.clientId.toString() !== clientId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Site does not belong to the selected client",
      });
    }

    let subtotal = 0;
    let gstAmount = 0;

    const deliveryItems = [];

    for (const item of items) {
      const {
        materialId,
        quantity,
        rate,
      } = item;

      if (!materialId || quantity === undefined || rate === undefined) {
        return res.status(400).json({
          success: false,
          message: "materialId, quantity and rate are required",
        });
      }

      if (!isValidObjectId(materialId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid materialId: ${materialId}`,
        });
      }

      if (
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
      }

      if (
        typeof rate !== "number" ||
        !Number.isFinite(rate) ||
        rate < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Rate cannot be negative",
        });
      }

      // Check material belongs to organization
      const material = await Material.findOne({
        _id: materialId,
        organizationId,
        status: "ACTIVE",
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: `Material not found: ${materialId}`,
        });
      }

      const amount = quantity * rate;

      const itemGst = amount * (material.gstRate / 100);

      subtotal += amount;
      gstAmount += itemGst;

      deliveryItems.push({
        materialId: material._id,
        materialName: material.name,
        quantity,
        unit: material.unit,
        rate,
        gstRate: material.gstRate,
        amount: Number(amount.toFixed(2)),
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    gstAmount = Number(gstAmount.toFixed(2));

    const totalAmount = Number(
      (subtotal + gstAmount).toFixed(2)
    );

    const deliveryNumber = await generateDeliveryNumber(
      organizationId
    );

    const delivery = await Delivery.create({
      organizationId,
      clientId,
      siteId,
      deliveryNumber,
      deliveryDate,
      items: deliveryItems,
      subtotal,
      gstAmount,
      totalAmount,
      notes,
      status: "DRAFT",
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery created successfully",
      data: delivery,
    });

  } catch (error) {
    console.error("Create Delivery Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create delivery",
    });
  }
};


// Get all deliveries
const getDeliveries = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const {
      clientId,
      siteId,
      status,
      fromDate,
      toDate,
    } = req.query;

    const filter = {
      organizationId,
    };

    if (clientId) {
      if (!isValidObjectId(clientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clientId",
        });
      }

      filter.clientId = clientId;
    }

    if (siteId) {
      if (!isValidObjectId(siteId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid siteId",
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
      filter.deliveryDate = {};

      if (fromDate) {
        filter.deliveryDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.deliveryDate.$lte = end;
      }
    }

    const deliveries = await Delivery.find(filter)
      .populate("clientId", "companyName")
      .populate("siteId", "siteName")
      .sort({ deliveryDate: -1 });

    return res.status(200).json({
      success: true,
      message: "Deliveries fetched successfully",
      data: deliveries,
    });

  } catch (error) {
    console.error("Get Deliveries Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch deliveries",
    });
  }
};


// Get single delivery
const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    const delivery = await Delivery.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .populate("clientId", "companyName")
      .populate("siteId", "siteName");

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Delivery fetched successfully",
      data: delivery,
    });

  } catch (error) {
    console.error("Get Delivery Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery",
    });
  }
};


// Confirm delivery
const confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    const delivery = await Delivery.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status === "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Delivery is already confirmed",
      });
    }

    if (delivery.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled delivery cannot be confirmed",
      });
    }

    delivery.status = "CONFIRMED";
    delivery.confirmedBy = req.user.userId;
    delivery.confirmedAt = new Date();

    await delivery.save();

    await createAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      action: "DELIVERY_CONFIRMED",
      entityType: "Delivery",
      entityId: delivery._id,
      metadata: {
        deliveryNumber: delivery.deliveryNumber,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Delivery confirmed successfully",
      data: delivery,
    });

  } catch (error) {
    console.error("Confirm Delivery Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm delivery",
    });
  }
};


// Cancel delivery
const cancelDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery ID",
      });
    }

    const delivery = await Delivery.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Delivery is already cancelled",
      });
    }

    delivery.status = "CANCELLED";

    await delivery.save();

    await createAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      action: "DELIVERY_CANCELLED",
      entityType: "Delivery",
      entityId: delivery._id,
      metadata: {
        deliveryNumber: delivery.deliveryNumber,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Delivery cancelled successfully",
      data: delivery,
    });

  } catch (error) {
    console.error("Cancel Delivery Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel delivery",
    });
  }
};


module.exports = {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  confirmDelivery,
  cancelDelivery,
};
