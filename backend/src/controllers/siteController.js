const mongoose = require("mongoose");

const Client = require("../models/Client");
const Site = require("../models/Site");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const allowedStatuses = ["ACTIVE", "COMPLETED", "ON_HOLD"];

const findOrganizationClient = async (clientId, organizationId) => {
  if (!isValidObjectId(clientId)) {
    return {
      error: {
        status: 400,
        message: "Invalid client id",
      },
    };
  }

  const client = await Client.findOne({
    _id: clientId,
    organizationId,
  }).lean();

  if (!client) {
    return {
      error: {
        status: 404,
        message: "Client not found",
      },
    };
  }

  return {
    client,
  };
};

const assignTrimmedString = (target, key, value, label) => {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return `${label} cannot be empty`;
  }

  target[key] = value.trim();
  return null;
};


// ======================================================
// CREATE SITE
// ======================================================

const createSite = async (req, res) => {
  try {
    const {
      clientId,
      siteName,
      address,
      contactPerson,
      contactPhone,
      status,
    } = req.body || {};

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client id is required",
      });
    }

    if (!siteName || typeof siteName !== "string" || !siteName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Site name is required",
      });
    }

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const { error } = await findOrganizationClient(
      clientId,
      req.user.organizationId
    );

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const siteData = {
      organizationId: req.user.organizationId,
      clientId,
      siteName: siteName.trim(),
    };

    for (const [key, label] of [
      ["address", "Address"],
      ["contactPerson", "Contact person"],
      ["contactPhone", "Contact phone"],
    ]) {
      const validationError = assignTrimmedString(
        siteData,
        key,
        { address, contactPerson, contactPhone }[key],
        label
      );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }
    }

    if (status !== undefined) {
      siteData.status = status;
    }

    const site = await Site.create(siteData);

    return res.status(201).json({
      success: true,
      message: "Site created successfully",
      data: site,
    });

  } catch (error) {

    console.error("Create site error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create site",
    });
  }
};


// ======================================================
// GET ALL SITES
// ======================================================

const getSites = async (req, res) => {
  try {
    const query = {
      organizationId: req.user.organizationId,
    };

    if (req.query.clientId) {
      const { error } = await findOrganizationClient(
        req.query.clientId,
        req.user.organizationId
      );

      if (error) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      query.clientId = req.query.clientId;
    }

    const sites = await Site.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: sites.length,
      data: sites,
    });

  } catch (error) {

    console.error("Get sites error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sites",
    });
  }
};


// ======================================================
// GET SINGLE SITE
// ======================================================

const getSiteById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid site id",
      });
    }

    const site = await Site.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    }).lean();

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: site,
    });

  } catch (error) {

    console.error("Get site error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site",
    });
  }
};


// ======================================================
// UPDATE SITE
// ======================================================

const updateSite = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid site id",
      });
    }

    const {
      clientId,
      siteName,
      address,
      contactPerson,
      contactPhone,
    } = req.body || {};

    const updateData = {};

    if (clientId !== undefined) {
      const { error } = await findOrganizationClient(
        clientId,
        req.user.organizationId
      );

      if (error) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      updateData.clientId = clientId;
    }

    for (const [key, label] of [
      ["siteName", "Site name"],
      ["address", "Address"],
      ["contactPerson", "Contact person"],
      ["contactPhone", "Contact phone"],
    ]) {
      const validationError = assignTrimmedString(
        updateData,
        key,
        { siteName, address, contactPerson, contactPhone }[key],
        label
      );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields supplied",
      });
    }

    const site = await Site.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
      },
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Site updated successfully",
      data: site,
    });

  } catch (error) {

    console.error("Update site error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update site",
    });
  }
};


// ======================================================
// CHANGE SITE STATUS
// ======================================================

const updateSiteStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid site id",
      });
    }

    const { status } = req.body || {};

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const site = await Site.findOneAndUpdate(
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

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Site status updated",
      data: site,
    });

  } catch (error) {

    console.error("Update site status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update site status",
    });
  }
};


module.exports = {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  updateSiteStatus,
};
