import mongoose from "mongoose";

const serviceR1RevisionSchema = new mongoose.Schema(
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

const mpbcdcServiceSchema = new mongoose.Schema(
  {
    serviceType: { type: String, trim: true, default: "" },
    gemApplicable: { type: String, trim: true, default: "" },
    approvalStatus: { type: String, trim: true, default: "Draft" },
  },
  { _id: false }
);

const serviceMasterR1Schema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    serviceId: { type: String, trim: true, required: true },
    serviceCategory: { type: String, trim: true, required: true },
    serviceName: { type: String, trim: true, required: true },
    serviceDescription: { type: String, trim: true, default: "" },
    uom: { type: String, trim: true, required: true },
    gstRegimeApplicability: { type: String, trim: true, required: true },
    sacCode: { type: String, trim: true, required: true },
    taxabilityType: { type: String, trim: true, required: true },
    gstRate: { type: Number, default: 0 },
    rcmApplicability: { type: String, trim: true, required: true },
    itcAllowed: { type: String, trim: true, required: true },
    tdsApplicability: { type: String, trim: true, required: true },
    tdsSection: { type: String, trim: true, required: true },
    tdsRate: { type: Number, required: true, min: 0 },
    costCenter: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    mpbcdcService: { type: mpbcdcServiceSchema, default: () => ({}) },
    revNumber: { type: Number, default: 0, min: 0 },
    revisionHistory: { type: [serviceR1RevisionSchema], default: [] },
  },
  { timestamps: true, collection: "ServiceMasterR1" }
);

serviceMasterR1Schema.index({ company: 1, serviceId: 1 }, { unique: true });

export const ServiceMasterR1 =
  mongoose.models.ServiceMasterR1 || mongoose.model("ServiceMasterR1", serviceMasterR1Schema);
