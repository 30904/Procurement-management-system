import mongoose from "mongoose";

const sacSRevisionSchema = new mongoose.Schema(
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

const sacSMasterSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    sacCode: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    gstRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 0 },
    utgstRate: { type: Number, default: 0 },
    revNumber: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    revisionHistory: { type: [sacSRevisionSchema], default: [] },
  },
  { timestamps: true, collection: "SacSMaster" }
);

sacSMasterSchema.index({ company: 1, sacCode: 1 }, { unique: true });

export const SacSMaster =
  mongoose.models.SacSMaster || mongoose.model("SacSMaster", sacSMasterSchema);

