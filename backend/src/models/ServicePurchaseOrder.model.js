import mongoose from "mongoose";

const spoAmendmentHistorySchema = new mongoose.Schema(
  {
    revisionNo: { type: Number, required: true, min: 1 },
    submittedAt: { type: Date, required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submittedByName: { type: String, trim: true, default: "" },
    approvedAt: { type: Date, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
    changes: [
      {
        field: { type: String, required: true },
        from: { type: mongoose.Schema.Types.Mixed },
        to: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    snapshot: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: true }
);

const spoLineSchema = new mongoose.Schema(
  {
    lineNo: { type: Number, required: true, min: 1 },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceMaster" },
    serviceNo: { type: String, trim: true, default: "" },
    sacCode: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    serviceDetails: { type: String, trim: true, default: "" },
    gstRate: { type: Number, default: 0, min: 0 },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, default: 0, min: 0 },
    discPercent: { type: Number, default: 0, min: 0 },
    netRate: { type: Number, default: 0, min: 0 },
    lineValue: { type: Number, default: 0, min: 0 },
    serviceScheduleDate: { type: Date },
  },
  { _id: false }
);

const servicePurchaseOrderSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    spoNo: { type: String, trim: true, required: true },
    spoDate: { type: Date, required: true, default: Date.now },
    serviceCategory: {
      type: String,
      enum: ["Domestic", "Import"],
      default: "Domestic",
    },
    serviceProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "LogisticsMaster", required: true },
    serviceProviderName: { type: String, trim: true, default: "" },
    orderReferenceNo: { type: String, trim: true, default: "" },
    currency: { type: String, trim: true, default: "INR" },
    spoRemarks: { type: String, trim: true, default: "" },
    spoValidity: { type: Date },
    paymentTerms: { type: String, trim: true, default: "" },
    spoValue: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Cancelled"],
      default: "Draft",
    },
    /** Service receipt progress (analogous to GRN on material PO). */
    receiptStatus: {
      type: String,
      enum: ["Not Started", "Partial", "Complete", "Short Closed"],
      default: "Not Started",
    },
    amendRevNo: { type: Number, default: 0, min: 0 },
    amendStatus: {
      type: String,
      enum: ["None", "Pending"],
      default: "None",
    },
    pendingAmendment: { type: mongoose.Schema.Types.Mixed, default: null },
    amendmentHistory: { type: [spoAmendmentHistorySchema], default: [] },
    cancelRemarks: { type: String, trim: true, default: "" },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledByName: { type: String, trim: true, default: "" },
    lines: { type: [spoLineSchema], default: [] },
  },
  { timestamps: true, collection: "ServicePurchaseOrder" }
);

servicePurchaseOrderSchema.index({ company: 1, spoNo: 1 }, { unique: true });
servicePurchaseOrderSchema.index({ company: 1, locationId: 1, spoDate: -1 });

export const ServicePurchaseOrder =
  mongoose.models.ServicePurchaseOrder ||
  mongoose.model("ServicePurchaseOrder", servicePurchaseOrderSchema);
