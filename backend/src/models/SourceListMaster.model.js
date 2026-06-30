import mongoose from "mongoose";

const sourceListMasterSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sourceListCode: { type: String, trim: true, required: true },
    itemType: { type: String, trim: true, default: "" },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    itemCode: { type: String, trim: true, default: "" },
    itemName: { type: String, trim: true, default: "" },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster" },
    supplierCode: { type: String, trim: true, default: "" },
    supplierName: { type: String, trim: true, default: "" },
    sourceType: { type: String, trim: true, default: "" },
    isPreferredVendor: { type: String, trim: true, default: "" },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true, collection: "SourceListMaster" }
);

sourceListMasterSchema.index({ company: 1, sourceListCode: 1 }, { unique: true });

export const SourceListMaster =
  mongoose.models.SourceListMaster || mongoose.model("SourceListMaster", sourceListMasterSchema);
