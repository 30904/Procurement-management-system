import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/inspectionChecklist.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const user = req.appUser || {};
  return {
    companyId,
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
  const data = await svc.listInspectionChecklists(companyId);
  res.status(200).json({ success: true, data });
});

export const previewChecklistId = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.previewInspectionChecklistId(companyId);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.getInspectionChecklist(companyId, req.params.id);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.createInspectionChecklist(companyId, req.body ?? {});
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const { companyId, actor } = ctx(req);
  const data = await svc.updateInspectionChecklist(
    companyId,
    req.params.id,
    req.body ?? {},
    actor
  );
  res.status(200).json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.deleteInspectionChecklist(companyId, req.params.id);
  res.status(200).json({ success: true, data });
});
