import mongoose from "mongoose";

const locationChangeAuditSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    entityType: { type: String, trim: true, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    oldLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    newLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    oldSubLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation" },
    newSubLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedByName: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "LocationChangeAudit" }
);

locationChangeAuditSchema.index({ company: 1, entityType: 1, entityId: 1, createdAt: -1 });

export const LocationChangeAudit =
  mongoose.models.LocationChangeAudit ||
  mongoose.model("LocationChangeAudit", locationChangeAuditSchema);
