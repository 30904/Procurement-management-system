import mongoose from "mongoose";

export const rfqVendorSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster" },
    supplierCode: { type: String, trim: true, default: "" },
    supplierName: { type: String, trim: true, default: "" },
    preferred: { type: Boolean, default: false },
    sourceListCode: { type: String, trim: true, default: "" },
    vendorRating: { type: Number, default: 0, min: 0 },
    msme: { type: String, trim: true, default: "" },
    gemRegistered: { type: String, trim: true, default: "" },
    contactPerson: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
  },
  { _id: false }
);
