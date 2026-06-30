import mongoose from "mongoose";

const prospectAddressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    line3: { type: String, trim: true, default: "" },
    line4: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    pinCode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    zone: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const prospectContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const prospectSupplierSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    registrationNo: { type: String, trim: true, required: true },
    registrationDate: { type: Date, required: true },
    categoryType: { type: String, trim: true, default: "" },
    supplierName: { type: String, trim: true, required: true },
    gstClassification: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, default: "" },
    supplierPaymentTerms: { type: String, trim: true, default: "" },
    isSupplierActive: { type: String, trim: true, default: "A" },
    supplierBillingAddress: { type: [prospectAddressSchema], default: [] },
    supplierContactMatrix: { type: [prospectContactSchema], default: [] },
    assessmentStatus: {
      type: String,
      enum: ["Pending", "In Review", "Approved", "Rejected"],
      default: "Pending",
    },
    assessmentNotes: { type: String, trim: true, default: "" },
    assessedBy: { type: String, trim: true, default: "" },
    assessedAt: { type: Date },
  },
  { timestamps: true, collection: "ProspectSupplierMaster" }
);

prospectSupplierSchema.index({ company: 1, registrationNo: 1 }, { unique: true });

export const ProspectSupplierMaster =
  mongoose.models.ProspectSupplierMaster ||
  mongoose.model("ProspectSupplierMaster", prospectSupplierSchema);
