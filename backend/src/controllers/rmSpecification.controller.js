import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/rmSpecification.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const user = req.appUser || {};
  return {
    companyId,
    userId: req.appUser?._id || req.user?.sub,
    actor: {
      userId: user._id || req.user?.sub,
      name: user.name || user.fullName || "",
      userName: user.userName || "",
      userEmail: user.email || "",
    },
  };
}

export const list = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.listRmSpecificationItems(companyId, {
    rmFilter: req.query.rmFilter,
    category: req.query.category,
  });
  res.status(200).json({ success: true, data });
});

export const statusSummary = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.getRmSpecificationStatusSummary(companyId);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.getRmSpecification(companyId, req.params.itemId);
  res.status(200).json({ success: true, data });
});

export const save = asyncHandler(async (req, res) => {
  const { companyId, actor } = ctx(req);
  const data = await svc.saveRmSpecification(companyId, req.params.itemId, req.body ?? {}, actor);
  res.status(200).json({ success: true, data });
});

export const clear = asyncHandler(async (req, res) => {
  const { companyId, userId } = ctx(req);
  const data = await svc.deleteRmSpecification(companyId, req.params.itemId, userId);
  res.status(200).json({ success: true, data });
});

export const applyCopy = asyncHandler(async (req, res) => {
  const { companyId, actor } = ctx(req);
  const { targetItemIds = [], overrideExisting = false } = req.body ?? {};
  const data = await svc.applyRmSpecificationCopy(
    companyId,
    req.params.itemId,
    targetItemIds,
    actor,
    { overrideExisting: Boolean(overrideExisting) }
  );
  res.status(200).json({ success: true, data });
});
