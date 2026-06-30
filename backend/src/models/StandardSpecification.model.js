import mongoose from "mongoose";

const standardSpecRevisionSchema = new mongoose.Schema(
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

const standardSpecificationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    specId: { type: String, trim: true, required: true },
    inspectionParameter: { type: String, trim: true, required: true },
    uom: { type: String, trim: true, required: true },
    testStandard: { type: String, trim: true, default: "" },
    testMethod: { type: String, trim: true, required: true },
    revNumber: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    revisionHistory: { type: [standardSpecRevisionSchema], default: [] },
  },
  { timestamps: true, collection: "StandardSpecification" }
);

standardSpecificationSchema.index({ company: 1, specId: 1 }, { unique: true });

export const StandardSpecification =
  mongoose.models.StandardSpecification ||
  mongoose.model("StandardSpecification", standardSpecificationSchema);
