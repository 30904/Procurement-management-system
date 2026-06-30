import { AuditLog } from "../models/AuditLog.model.js";

export async function listAuditLogs({ page = 1, limit = 50, action, modelName, userId, from, to, search }) {
  const filter = {};
  if (action) filter.action = action;
  if (modelName) filter.modelName = modelName;
  if (userId) filter.userId = userId;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    filter.$or = [
      { summary: { $regex: search, $options: "i" } },
      { userName: { $regex: search, $options: "i" } },
      { modelName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { data: docs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getModelNames() {
  const names = await AuditLog.distinct("modelName");
  return names.sort();
}

export async function deleteLog(id) {
  return AuditLog.findByIdAndDelete(id);
}

export async function deleteLogs(filter = {}) {
  const query = {};
  if (filter.before) {
    query.createdAt = { $lt: new Date(filter.before) };
  }
  if (filter.modelName) query.modelName = filter.modelName;
  if (filter.action) query.action = filter.action;

  const result = await AuditLog.deleteMany(query);
  return result.deletedCount;
}

export async function clearAllLogs() {
  const result = await AuditLog.deleteMany({});
  return result.deletedCount;
}
