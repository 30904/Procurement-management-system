import mongoose from "mongoose";
import { transactionLineSchema } from "./schemas/transactionLine.schema.js";

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    subLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation" },
    inventoryStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore" },
    invoiceNo: { type: String, trim: true, required: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster", required: true },
    supplierName: { type: String, trim: true, default: "" },
    goodsReceiptId: { type: mongoose.Schema.Types.ObjectId, ref: "GoodsReceipt" },
    grnNo: { type: String, trim: true, default: "" },
    locationGstin: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Draft", "Posted", "Cancelled"], default: "Draft" },
    lines: { type: [transactionLineSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "PurchaseInvoice" }
);

purchaseInvoiceSchema.index({ company: 1, invoiceNo: 1 }, { unique: true });
purchaseInvoiceSchema.index({ company: 1, locationId: 1, invoiceDate: -1 });

export const PurchaseInvoice =
  mongoose.models.PurchaseInvoice || mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);
