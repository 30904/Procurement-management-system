import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userName: { type: String, trim: true, default: "" },
    action: { type: String, enum: ["CREATE", "UPDATE", "DELETE"], required: true, index: true },
    modelName: { type: String, trim: true, required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId },
    summary: { type: String, trim: true, default: "" },
    changes: { type: mongoose.Schema.Types.Mixed, default: null },
    previousData: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "AuditLog" }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ company: 1, createdAt: -1 });
auditLogSchema.index({ modelName: 1, action: 1 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
