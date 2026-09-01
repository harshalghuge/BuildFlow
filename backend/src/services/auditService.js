const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  metadata = {},
}) => {
  return AuditLog.create({
    organizationId,
    userId,
    action,
    entityType,
    entityId,
    metadata,
  });
};

module.exports = {
  createAuditLog,
};
