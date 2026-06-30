import mongoose from "mongoose";

const inspectionChecklistRevisionSchema = new mongoose.Schema(
  {
    revisionNo: { type: Number, required: true, min: 1 },
    revisionDate: { type: Date, required: true },
    reason: { type: String, trim: true, required: true },
    proposedBy: { type: String, trim: true, required: true },
    approvedBy: { type: String, trim: true, required: true },
    changedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, trim: true, default: "" },
      userName: { type: String, trim: true, default: "" },
      userEmail: { type: String, trim: true, default: "" },
    },
    changedAt: { type: Date, default: Date.now },
    changes: [
      {
        field: { type: String, required: true },
        from: { type: mongoose.Schema.Types.Mixed },
        to: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { _id: false }
);

const inspectionChecklistSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    checklistId: { type: String, trim: true, required: true },
    checklistItem: { type: String, trim: true, required: true },
    displayOrder: { type: Number, default: 0, min: 0 },
    revNumber: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    revisionHistory: { type: [inspectionChecklistRevisionSchema], default: [] },
  },
  { timestamps: true, collection: "InspectionChecklist" }
);

inspectionChecklistSchema.index({ company: 1, checklistId: 1 }, { unique: true });

export const InspectionChecklist =
  mongoose.models.InspectionChecklist ||
  mongoose.model("InspectionChecklist", inspectionChecklistSchema);
