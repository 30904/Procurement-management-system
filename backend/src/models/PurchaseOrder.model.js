import mongoose from "mongoose";
import { transactionLineSchema } from "./schemas/transactionLine.schema.js";

const poAmendmentHistorySchema = new mongoose.Schema(
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

const purchaseOrderSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    subLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation" },
    inventoryStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore" },
    poNo: { type: String, trim: true, required: true },
    poDate: { type: Date, required: true, default: Date.now },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster", required: true },
    supplierName: { type: String, trim: true, default: "" },
    poType: { type: String, trim: true, default: "Standard PO" },
    currency: { type: String, trim: true, default: "INR" },
    orderReferenceNo: { type: String, trim: true, default: "" },
    orderReferenceDate: { type: Date },
    incidentalExpenses: {
      type: [
        {
          description: { type: String, trim: true, default: "" },
          amount: { type: Number, default: 0, min: 0 },
        },
      ],
      default: [],
    },
    poValue: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    poTerms: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    /** Purchase indents that drove this PO (e.g. from Material Purchase Planning). */
    sourceIndentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "PurchaseIndent" }],
      default: [],
    },
    sourceIndentNos: { type: [String], default: [] },
    procurementReference: {
      type: {
        procurementCategory: { type: String, trim: true, default: "" },
        purchaseType: { type: String, trim: true, default: "" },
        sourceListId: { type: mongoose.Schema.Types.ObjectId, ref: "SourceListMaster" },
        sourceListCode: { type: String, trim: true, default: "" },
        sourceListLabel: { type: String, trim: true, default: "" },
        vendorEvaluationId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorEvaluationMaster" },
        vendorEvaluationCode: { type: String, trim: true, default: "" },
        vendorEvaluationLabel: { type: String, trim: true, default: "" },
        rateContractReference: { type: String, trim: true, default: "" },
        contractReference: { type: String, trim: true, default: "" },
        budgetReference: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    governmentProcurement: {
      type: {
        gemPurchase: { type: String, trim: true, default: "" },
        tenderPurchase: { type: String, trim: true, default: "" },
        emergencyProcurement: { type: String, trim: true, default: "" },
        boardApprovalRequired: { type: String, trim: true, default: "" },
        tenderNumber: { type: String, trim: true, default: "" },
        gemBidNumber: { type: String, trim: true, default: "" },
        governmentApprovalNumber: { type: String, trim: true, default: "" },
        governmentReference: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    capitalProcurement: {
      type: {
        assetProcurement: { type: String, trim: true, default: "" },
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetMaster" },
        assetCode: { type: String, trim: true, default: "" },
        assetName: { type: String, trim: true, default: "" },
        capitalizationRequired: { type: String, trim: true, default: "" },
        capitalBudgetCode: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    approvalTracking: {
      type: {
        approvalStatus: { type: String, trim: true, default: "" },
        approvalAuthority: { type: String, trim: true, default: "" },
        approvalDate: { type: Date },
        approvalRemarks: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["Draft", "Approved", "Partially Received", "Closed", "Cancelled"],
      default: "Draft",
    },
    /** Derived from line receipt / short-close progress (separate from approval status). */
    grnStatus: {
      type: String,
      enum: ["Not Started", "Partial", "Complete", "Short Closed"],
      default: "Not Started",
    },
    /** Amendment revision count (0 = original approved PO). */
    amendRevNo: { type: Number, default: 0, min: 0 },
    amendStatus: {
      type: String,
      enum: ["None", "Pending"],
      default: "None",
    },
    pendingAmendment: { type: mongoose.Schema.Types.Mixed, default: null },
    amendmentHistory: { type: [poAmendmentHistorySchema], default: [] },
    lines: { type: [transactionLineSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: "" },
    /** Set when an approved PO is cancelled from Cancel PO (GRN not started). */
    cancelRemarks: { type: String, trim: true, default: "" },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledByName: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "PurchaseOrder" }
);

purchaseOrderSchema.index({ company: 1, poNo: 1 }, { unique: true });
purchaseOrderSchema.index({ company: 1, locationId: 1, poDate: -1 });

export const PurchaseOrder =
  mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);
