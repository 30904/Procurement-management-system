import mongoose from "mongoose";

const serviceRevisionSchema = new mongoose.Schema(
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

const serviceMasterSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    serviceNo: { type: String, trim: true, required: true },
    serviceDescription: { type: String, trim: true, required: true },
    sacCode: { type: String, trim: true, required: true },
    gstRate: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    revNumber: { type: Number, default: 0, min: 0 },
    revisionHistory: { type: [serviceRevisionSchema], default: [] },
  },
  { timestamps: true, collection: "ServiceMaster" }
);

serviceMasterSchema.index({ company: 1, serviceNo: 1 }, { unique: true });
serviceMasterSchema.index({ company: 1, sacCode: 1 });

export const ServiceMaster =
  mongoose.models.ServiceMaster || mongoose.model("ServiceMaster", serviceMasterSchema);
