import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { listLocationAuditForEntity } from "../services/locationAudit.service.js";

export const listForEntity = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const entityType = String(req.query.entityType || "").trim();
  const entityId = String(req.query.entityId || "").trim();
  if (!entityType || !entityId) {
    throw new AppError("entityType and entityId are required", 400, "VALIDATION_ERROR");
  }

  const data = await listLocationAuditForEntity(companyId, entityType, entityId);
  res.status(200).json({ success: true, data });
});
