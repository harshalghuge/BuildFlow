const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["OWNER", "STAFF", "CLIENT"],
      required: true,
      default: "STAFF",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


// Same email can exist in different organizations,
// but not twice inside the same organization.

userSchema.index(
  {
    organizationId: 1,
    email: 1,
  },
  {
    unique: true,
  }
);


module.exports = mongoose.model(
  "User",
  userSchema
);