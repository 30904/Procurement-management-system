import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/materialPurchasePlanning.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return { companyId, scope: req.locationScope };
}

export const listRequirements = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listMaterialPurchaseRequirements(companyId, scope);
  res.status(200).json({ success: true, data });
});
