import mongoose from "mongoose";
import { transactionLineSchema } from "./schemas/transactionLine.schema.js";

const goodsReceiptSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    subLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation" },
    inventoryStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore", required: true },
    grnNo: { type: String, trim: true, required: true },
    grnDate: { type: Date, required: true, default: Date.now },
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    poNo: { type: String, trim: true, default: "" },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster", required: true },
    supplierName: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Draft", "Posted", "Cancelled"], default: "Draft" },
    lines: { type: [transactionLineSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: "" },
    procurementReference: {
      type: {
        purchaseRequisitionId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseIndent" },
        purchaseRequisitionNo: { type: String, trim: true, default: "" },
        procurementCategory: { type: String, trim: true, default: "" },
        purchaseType: { type: String, trim: true, default: "" },
        sourceListId: { type: mongoose.Schema.Types.ObjectId, ref: "SourceListMaster" },
        sourceListCode: { type: String, trim: true, default: "" },
        sourceListLabel: { type: String, trim: true, default: "" },
        vendorEvaluationId: { type: mongoose.Schema.Types.ObjectId, ref: "VendorEvaluationMaster" },
        vendorEvaluationCode: { type: String, trim: true, default: "" },
        vendorEvaluationLabel: { type: String, trim: true, default: "" },
        contractReference: { type: String, trim: true, default: "" },
        budgetReference: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    receiptInformation: {
      type: {
        receiptType: { type: String, trim: true, default: "" },
        receiptStatus: { type: String, trim: true, default: "" },
        inspectionRequired: { type: String, trim: true, default: "" },
        qcStatus: { type: String, trim: true, default: "" },
        acceptedQuantity: { type: Number, min: 0 },
        rejectedQuantity: { type: Number, min: 0 },
        shortQuantity: { type: Number, min: 0 },
        excessQuantity: { type: Number, min: 0 },
      },
      default: () => ({}),
    },
    governmentProcurement: {
      type: {
        gemProcurement: { type: String, trim: true, default: "" },
        tenderProcurement: { type: String, trim: true, default: "" },
        inspectionCertificateAvailable: { type: String, trim: true, default: "" },
        governmentInspectionRequired: { type: String, trim: true, default: "" },
        inspectionCertificateNumber: { type: String, trim: true, default: "" },
        inspectionAgency: { type: String, trim: true, default: "" },
        inspectionDate: { type: Date },
        governmentRemarks: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    capitalProcurement: {
      type: {
        assetCreationRequired: { type: String, trim: true, default: "" },
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetMaster" },
        assetCode: { type: String, trim: true, default: "" },
        assetName: { type: String, trim: true, default: "" },
        capitalizationPending: { type: String, trim: true, default: "" },
        assetTagNumber: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    receivingAuthority: {
      type: {
        receivedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        receivedByName: { type: String, trim: true, default: "" },
        verifiedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        verifiedByName: { type: String, trim: true, default: "" },
        verifiedDate: { type: Date },
        receivingRemarks: { type: String, trim: true, default: "" },
      },
      default: () => ({}),
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "GoodsReceipt" }
);

goodsReceiptSchema.index({ company: 1, grnNo: 1 }, { unique: true });
goodsReceiptSchema.index({ company: 1, locationId: 1, grnDate: -1 });

export const GoodsReceipt =
  mongoose.models.GoodsReceipt || mongoose.model("GoodsReceipt", goodsReceiptSchema);
