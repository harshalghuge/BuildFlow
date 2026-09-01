const mongoose = require("mongoose");
const Material = require("../models/Material");

const allowedUnits = ["PCS", "KG", "TON", "BAG", "METER", "CUBIC_METER", "LITER", "OTHER"];
const allowedStatuses = ["ACTIVE", "INACTIVE"];
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const numberError = (value, label, max) => {
  if (value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return `${label} must be a valid number`;
  if (value < 0) return `${label} cannot be negative`;
  if (max !== undefined && value > max) return `${label} cannot be greater than ${max}`;
  return null;
};

const stringField = (target, key, value, label) => {
  if (value === undefined) return null;
  if (typeof value !== "string" || !value.trim()) return `${label} cannot be empty`;
  target[key] = value.trim();
  return null;
};

const createMaterial = async (req, res) => {
  try {
    const { name, description, unit, defaultRate = 0, gstRate = 0, status } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Material name is required" });
    }
    if (!allowedUnits.includes(unit)) {
      return res.status(400).json({ success: false, message: "Invalid unit" });
    }
    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const rateError = numberError(defaultRate, "Default rate");
    const gstError = numberError(gstRate, "GST rate", 28);
    if (rateError || gstError) {
      return res.status(400).json({ success: false, message: rateError || gstError });
    }

    const duplicate = await Material.findOne({
      organizationId: req.user.organizationId,
      name: name.trim(),
    }).lean();
    if (duplicate) {
      return res.status(409).json({ success: false, message: "A material with this name already exists" });
    }

    const data = {
      organizationId: req.user.organizationId,
      name: name.trim(),
      unit,
      defaultRate,
      gstRate,
      ...(status ? { status } : {}),
    };
    const descriptionError = stringField(data, "description", description, "Description");
    if (descriptionError) return res.status(400).json({ success: false, message: descriptionError });

    const material = await Material.create(data);
    return res.status(201).json({ success: true, message: "Material created successfully", data: material });
  } catch (error) {
    console.error("Create material error:", error);
    return res.status(500).json({ success: false, message: "Failed to create material" });
  }
};

const getMaterials = async (req, res) => {
  try {
    const query = { organizationId: req.user.organizationId };
    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) return res.status(400).json({ success: false, message: "Invalid status" });
      query.status = req.query.status;
    }
    const materials = await Material.find(query).sort({ status: 1, name: 1 }).lean();
    return res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    console.error("Get materials error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch materials" });
  }
};

const getMaterialById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid material id" });
    const material = await Material.findOne({ _id: req.params.id, organizationId: req.user.organizationId }).lean();
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });
    return res.status(200).json({ success: true, data: material });
  } catch (error) {
    console.error("Get material error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch material" });
  }
};

const updateMaterial = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid material id" });
    const { name, description, unit, defaultRate, gstRate, status } = req.body || {};
    const updateData = {};

    const nameError = stringField(updateData, "name", name, "Material name");
    const descriptionError = stringField(updateData, "description", description, "Description");
    if (nameError || descriptionError) return res.status(400).json({ success: false, message: nameError || descriptionError });
    if (unit !== undefined) {
      if (!allowedUnits.includes(unit)) return res.status(400).json({ success: false, message: "Invalid unit" });
      updateData.unit = unit;
    }
    const rateError = numberError(defaultRate, "Default rate");
    const gstError = numberError(gstRate, "GST rate", 28);
    if (rateError || gstError) return res.status(400).json({ success: false, message: rateError || gstError });
    if (defaultRate !== undefined) updateData.defaultRate = defaultRate;
    if (gstRate !== undefined) updateData.gstRate = gstRate;
    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
      updateData.status = status;
    }
    if (!Object.keys(updateData).length) return res.status(400).json({ success: false, message: "No valid fields supplied" });

    if (name !== undefined) {
      const duplicate = await Material.findOne({
        organizationId: req.user.organizationId,
        name: name.trim(),
        _id: { $ne: req.params.id },
      }).lean();
      if (duplicate) return res.status(409).json({ success: false, message: "A material with this name already exists" });
    }

    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });
    return res.status(200).json({ success: true, message: "Material updated successfully", data: material });
  } catch (error) {
    console.error("Update material error:", error);
    return res.status(500).json({ success: false, message: "Failed to update material" });
  }
};

const updateMaterialStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid material id" });
    const { status } = req.body || {};
    if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { status },
      { new: true, runValidators: true }
    );
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });
    return res.status(200).json({ success: true, message: "Material status updated successfully", data: material });
  } catch (error) {
    console.error("Update material status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update material status" });
  }
};

module.exports = { createMaterial, getMaterials, getMaterialById, updateMaterial, updateMaterialStatus };
