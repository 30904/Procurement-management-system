import mongoose from "mongoose";

const jwoLineSchema = new mongoose.Schema(
  {
    lineNo: { type: Number, required: true, min: 1 },
    jwiId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemMaster" },
    jwiNo: { type: String, trim: true, default: "" },
    jwiItemName: { type: String, trim: true, default: "" },
    jwiItemDescription: { type: String, trim: true, default: "" },
    serviceDescription: { type: String, trim: true, default: "" },
    sacCode: { type: String, trim: true, default: "" },
    uom: { type: String, trim: true, default: "" },
    gstRate: { type: Number, default: 0, min: 0 },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, default: 0, min: 0 },
    jwoAmount: { type: Number, default: 0, min: 0 },
    scheduleDate: { type: Date },
  },
  { _id: false }
);

const jobWorkOrderSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    jwoNo: { type: String, trim: true, required: true },
    jwoDate: { type: Date, required: true, default: Date.now },
    jwoType: { type: String, trim: true, default: "Standard" },
    jobWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster", required: true },
    jobWorkerCode: { type: String, trim: true, default: "" },
    jobWorkerName: { type: String, trim: true, default: "" },
    orderReferenceNo: { type: String, trim: true, default: "" },
    currency: { type: String, trim: true, default: "INR" },
    jwoRemarks: { type: String, trim: true, default: "" },
    jwoValidity: { type: Date },
    jwoTerms: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    jwoValue: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Cancelled"],
      default: "Draft",
    },
    /** Material issue / receipt against job worker (for future MJW DC). */
    issueStatus: {
      type: String,
      enum: ["Not Started", "Partial", "Complete", "Short Closed"],
      default: "Not Started",
    },
    lines: { type: [jwoLineSchema], default: [] },
  },
  { timestamps: true, collection: "JobWorkOrder" }
);

jobWorkOrderSchema.index({ company: 1, jwoNo: 1 }, { unique: true });
jobWorkOrderSchema.index({ company: 1, locationId: 1, jwoDate: -1 });

export const JobWorkOrder =
  mongoose.models.JobWorkOrder || mongoose.model("JobWorkOrder", jobWorkOrderSchema);
