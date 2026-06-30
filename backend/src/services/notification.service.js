import { Notification } from "../models/Notification.model.js";
import { AppError } from "../utils/AppError.js";

export async function listNotifications(companyId, userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
  const filter = { company: companyId, recipient: userId };
  if (unreadOnly) filter.isRead = false;

  const [rows, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ company: companyId, recipient: userId, isRead: false }),
  ]);

  return { rows, total, unreadCount };
}

export async function getUnreadCount(companyId, userId) {
  return Notification.countDocuments({
    company: companyId,
    recipient: userId,
    isRead: false,
  });
}

export async function markAsRead(companyId, userId, notificationId) {
  const doc = await Notification.findOne({
    _id: notificationId,
    company: companyId,
    recipient: userId,
  });
  if (!doc) throw new AppError("Notification not found", 404, "NOT_FOUND");

  if (!doc.isRead) {
    doc.isRead = true;
    doc.readAt = new Date();
    await doc.save();
  }
  return doc.toObject();
}

export async function markAllAsRead(companyId, userId) {
  const result = await Notification.updateMany(
    { company: companyId, recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return { modifiedCount: result.modifiedCount };
}

export async function createNotification(companyId, data) {
  const { recipient, title, body, type, category, link, metadata } = data;

  if (!recipient) throw new AppError("Recipient is required", 400, "VALIDATION_ERROR");
  if (!title?.trim()) throw new AppError("Title is required", 400, "VALIDATION_ERROR");

  const doc = await Notification.create({
    company: companyId,
    recipient,
    title: title.trim(),
    body: (body ?? "").trim(),
    type: type || "info",
    category: (category ?? "general").trim(),
    link: (link ?? "").trim(),
    metadata: metadata || {},
  });
  return doc.toObject();
}

export async function createBulkNotifications(companyId, recipientIds, data) {
  const { title, body, type, category, link, metadata } = data;
  if (!title?.trim()) throw new AppError("Title is required", 400, "VALIDATION_ERROR");

  const docs = recipientIds.map((rid) => ({
    company: companyId,
    recipient: rid,
    title: title.trim(),
    body: (body ?? "").trim(),
    type: type || "info",
    category: (category ?? "general").trim(),
    link: (link ?? "").trim(),
    metadata: metadata || {},
  }));

  const result = await Notification.insertMany(docs);
  return { created: result.length };
}

export async function deleteNotification(companyId, userId, notificationId) {
  const doc = await Notification.findOneAndDelete({
    _id: notificationId,
    company: companyId,
    recipient: userId,
  });
  if (!doc) throw new AppError("Notification not found", 404, "NOT_FOUND");
  return { deleted: true, id: notificationId };
}

export async function clearAllNotifications(companyId, userId) {
  const result = await Notification.deleteMany({
    company: companyId,
    recipient: userId,
  });
  return { deletedCount: result.deletedCount };
}
