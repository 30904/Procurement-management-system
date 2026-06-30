import mongoose from "mongoose";
import { purchaseIndentLineSchema } from "./schemas/purchaseIndentLine.schema.js";
import { linkedPurchaseOrderSchema } from "./schemas/linkedPurchaseOrder.schema.js";

const procurementInfoSchema = new mongoose.Schema(
  {
    requisitionType: { type: String, trim: true, default: "" },
    procurementCategory: { type: String, trim: true, default: "" },
    costCenter: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const budgetInfoSchema = new mongoose.Schema(
  {
    budgetHead: { type: String, trim: true, default: "" },
    estimatedProcurementValue: { type: Number },
    budgetAvailable: { type: String, trim: true, default: "" },
    fundingSource: { type: String, trim: true, default: "" },
    financialYear: { type: String, trim: true, default: "" },
    budgetReference: { type: String, trim: true, default: "" },
    budgetRemarks: { type: String, trim: true, default: "" },
    budgetVerificationStatus: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const governanceInfoSchema = new mongoose.Schema(
  {
    gemApplicable: { type: String, trim: true, default: "" },
    tenderRequired: { type: String, trim: true, default: "" },
    emergencyProcurement: { type: String, trim: true, default: "" },
    boardApprovalRequired: { type: String, trim: true, default: "" },
    procurementJustification: { type: String, trim: true, default: "" },
    specialApprovalNotes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const approvalTrackingSchema = new mongoose.Schema(
  {
    approvalStatus: { type: String, trim: true, default: "" },
    approvedBy: { type: String, trim: true, default: "" },
    approvalDate: { type: Date },
    approvalRemarks: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const purchaseIndentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    subLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation" },
    indentNo: { type: String, trim: true, required: true },
    indentDate: { type: Date, required: true, default: Date.now },
    department: { type: String, trim: true, default: "" },
    requestedBy: { type: String, trim: true, default: "" },
    priority: { type: String, enum: ["Normal", "Urgent"], default: "Normal" },
    requiredByDate: { type: Date },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Cancelled"],
      default: "Draft",
    },
    /** POs created from this indent (updated when PO status changes). */
    linkedPurchaseOrders: { type: [linkedPurchaseOrderSchema], default: [] },
    lines: { type: [purchaseIndentLineSchema], default: [] },
    totalQty: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: "" },
    procurementInfo: { type: procurementInfoSchema, default: () => ({}) },
    budgetInfo: { type: budgetInfoSchema, default: () => ({}) },
    governanceInfo: { type: governanceInfoSchema, default: () => ({}) },
    approvalTracking: { type: approvalTrackingSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "PurchaseIndent" }
);

purchaseIndentSchema.index({ company: 1, indentNo: 1 }, { unique: true });
purchaseIndentSchema.index({ company: 1, locationId: 1, indentDate: -1 });

export const PurchaseIndent =
  mongoose.models.PurchaseIndent || mongoose.model("PurchaseIndent", purchaseIndentSchema);
