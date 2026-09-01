const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ["PCS", "KG", "TON", "BAG", "METER", "CUBIC_METER", "LITER", "OTHER"],
    },
    defaultRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    gstRate: {
      type: Number,
      required: true,
      min: 0,
      max: 28,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

materialSchema.index({ organizationId: 1, name: 1 });
materialSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Material", materialSchema);
