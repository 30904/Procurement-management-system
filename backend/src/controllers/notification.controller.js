import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  createBulkNotifications,
  deleteNotification,
  clearAllNotifications,
} from "../services/notification.service.js";

function getUserId(req) {
  return req.appUser?._id || req.user?.sub;
}

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  const userId = getUserId(req);
  if (!companyId || !userId) throw new AppError("Auth required", 401, "UNAUTHORIZED");

  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const unreadOnly = req.query.unreadOnly === "true";

  const data = await listNotifications(companyId, userId, { limit, offset, unreadOnly });
  res.status(200).json({ success: true, data });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  const userId = getUserId(req);
  if (!companyId || !userId) throw new AppError("Auth required", 401, "UNAUTHORIZED");

  const count = await getUnreadCount(companyId, userId);
  res.status(200).json({ success: true, data: { unreadCount: count } });
});

export const read = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  const userId = getUserId(req);
  if (!companyId || !userId) throw new AppError("Auth required", 401, "UNAUTHORIZED");

  const doc = await markAsRead(companyId, userId, req.params.id);
  res.status(200).json({ success: true, data: doc });
});

export const readAll = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  const userId = getUserId(req);
  if (!companyId || !userId) throw new AppError("Auth required", 401, "UNAUTHORIZED");

  const result = await markAllAsRead(companyId, userId);
  res.status(200).json({ success: true, data: result });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await createNotification(companyId, req.body ?? {});
  res.status(201).json({ success: true, data: doc });
});

export const broadcast = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  if (!req.rbac?.isSuperAdmin) throw new AppError("Super Admin required", 403, "FORBIDDEN");

  const { recipientIds, ...notifData } = req.body ?? {};
  if (!Array.isArray(recipientIds) || !recipientIds.length) {
    throw new AppError("recipientIds array is required", 400, "VALIDATION_ERROR");
  }

  const result = await createBulkNotifications(companyId, recipientIds, notifData);
  res.status(201).json({ success: true, data: result });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  const userId = getUserId(req);
  if (!companyId || !userId) throw new AppError("Auth required", 401, "UNAUTHORIZED");

  const result = await deleteNotification(companyId, userId, req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const clearAll = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  const userId = getUserId(req);
  if (!companyId || !userId) throw new AppError("Auth required", 401, "UNAUTHORIZED");

  const result = await clearAllNotifications(companyId, userId);
  res.status(200).json({ success: true, data: result });
});
