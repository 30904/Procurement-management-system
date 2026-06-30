import mongoose from "mongoose";

const rateRowSchema = new mongoose.Schema(
  {
    moq: { type: Number, required: true, min: 0 },
    uom: { type: String, trim: true, required: true },
    rate: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const itemSupplierLinkSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemMaster", required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster", required: true, index: true },
    supplierCode: { type: String, trim: true, required: true },
    supplierName: { type: String, trim: true, required: true },
    supplierCategory: { type: String, trim: true, default: "" },
    mpn: { type: String, trim: true, default: "" },
    uom: { type: String, trim: true, required: true },
    rates: { type: [rateRowSchema], default: [] },
    isPreferred: { type: Boolean, default: false },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "ItemSupplierLink" }
);

itemSupplierLinkSchema.index({ company: 1, itemId: 1, supplierId: 1, mpn: 1 }, { unique: true });

export const ItemSupplierLink =
  mongoose.models.ItemSupplierLink || mongoose.model("ItemSupplierLink", itemSupplierLinkSchema);
