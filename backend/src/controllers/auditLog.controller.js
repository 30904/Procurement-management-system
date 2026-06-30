import { asyncHandler } from "../middleware/asyncHandler.js";
import * as svc from "../services/auditLog.service.js";

export const list = asyncHandler(async (req, res) => {
  const { page, limit, action, modelName, userId, from, to, search } = req.query;
  const result = await svc.listAuditLogs({
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    action,
    modelName,
    userId,
    from,
    to,
    search,
  });
  res.json({ success: true, ...result });
});

export const modelNames = asyncHandler(async (_req, res) => {
  const names = await svc.getModelNames();
  res.json({ success: true, data: names });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteLog(req.params.id);
  res.json({ success: true, message: "Log entry deleted" });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { before, modelName, action } = req.body ?? {};
  const count = await svc.deleteLogs({ before, modelName, action });
  res.json({ success: true, message: `${count} log(s) deleted`, deleted: count });
});

export const clearAll = asyncHandler(async (_req, res) => {
  const count = await svc.clearAllLogs();
  res.json({ success: true, message: `${count} log(s) cleared`, deleted: count });
});
