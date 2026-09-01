const Client = require("../models/Client");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


// ======================================================
// CREATE CLIENT
// ======================================================

const createClient = async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      email,
      gstin,
      billingAddress,
    } = req.body || {};

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    const client = await Client.create({
      organizationId: req.user.organizationId,

      companyName: companyName.trim(),

      contactPerson: contactPerson?.trim(),

      phone: phone?.trim(),

      email: email
        ? email.toLowerCase().trim()
        : undefined,

      gstin: gstin
        ? gstin.toUpperCase().trim()
        : undefined,

      billingAddress: billingAddress?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: client,
    });

  } catch (error) {

    console.error("Create client error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create client",
    });
  }
};


// ======================================================
// GET ALL CLIENTS
// ======================================================

const getClients = async (req, res) => {
  try {

    const clients = await Client.find({
      organizationId: req.user.organizationId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });

  } catch (error) {

    console.error("Get clients error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};


// ======================================================
// GET SINGLE CLIENT
// ======================================================

const getClientById = async (req, res) => {
  try {

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client id",
      });
    }

    const client = await Client.findOne({
      _id: req.params.id,

      // IMPORTANT:
      // Prevent accessing another organization's client.
      organizationId: req.user.organizationId,
    }).lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: client,
    });

  } catch (error) {

    console.error("Get client error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch client",
    });
  }
};


// ======================================================
// UPDATE CLIENT
// ======================================================

const updateClient = async (req, res) => {
  try {

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client id",
      });
    }

    const {
      companyName,
      contactPerson,
      phone,
      email,
      gstin,
      billingAddress,
    } = req.body || {};

    const updateData = {};

    if (companyName !== undefined) {
      updateData.companyName = companyName.trim();
    }

    if (contactPerson !== undefined) {
      updateData.contactPerson = contactPerson.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    if (email !== undefined) {
      updateData.email = email.toLowerCase().trim();
    }

    if (gstin !== undefined) {
      updateData.gstin = gstin.toUpperCase().trim();
    }

    if (billingAddress !== undefined) {
      updateData.billingAddress = billingAddress.trim();
    }

    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,

        // SECURITY:
        organizationId: req.user.organizationId,
      },

      updateData,

      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: client,
    });

  } catch (error) {

    console.error("Update client error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update client",
    });
  }
};


// ======================================================
// CHANGE CLIENT STATUS
// ======================================================

const updateClientStatus = async (req, res) => {
  try {

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client id",
      });
    }

    const { status } = req.body || {};

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
      },

      {
        status,
      },

      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client status updated",
      data: client,
    });

  } catch (error) {

    console.error("Update client status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update client status",
    });
  }
};


module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  updateClientStatus,
};
