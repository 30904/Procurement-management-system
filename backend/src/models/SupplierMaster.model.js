import mongoose from "mongoose";

const supplierAddressSchema = new mongoose.Schema(
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

const supplierBankDetailsSchema = new mongoose.Schema(
  {
    befName: { type: String, trim: true, default: "" },
    bankName: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, default: "" },
    accountType: { type: String, trim: true, default: "" },
    ifsCode: { type: String, trim: true, default: "" },
    bankSwiftCode: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const supplierRevisionSchema = new mongoose.Schema(
  {
    revisionNo: { type: Number, required: true, min: 1 },
    revisionDate: { type: Date, required: true },
    reason: { type: String, trim: true, required: true },
    proposedBy: { type: String, trim: true, required: true },
    approvedBy: { type: String, trim: true, required: true },
    changedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, trim: true, default: "" },
      userName: { type: String, trim: true, default: "" },
      userEmail: { type: String, trim: true, default: "" },
    },
    changedAt: { type: Date, default: Date.now },
    changes: [
      {
        field: { type: String, required: true },
        from: { type: mongoose.Schema.Types.Mixed },
        to: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { _id: false }
);

const supplierContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const govProcurementSchema = new mongoose.Schema(
  {
    vendorType: { type: String, trim: true, default: "" },
    gemRegistered: { type: String, trim: true, default: "" },
    gemRegistrationNumber: { type: String, trim: true, default: "" },
    vendorRegistrationDate: { type: Date, default: null },
    vendorClassification: { type: String, trim: true, default: "" },
    msmeEligible: { type: String, trim: true, default: "" },
    womenOwnedEnterprise: { type: String, trim: true, default: "" },
    startupRegistered: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const vendorComplianceSchema = new mongoose.Schema(
  {
    panVerified: { type: String, trim: true, default: "" },
    gstVerified: { type: String, trim: true, default: "" },
    bankVerified: { type: String, trim: true, default: "" },
    complianceStatus: { type: String, trim: true, default: "Draft" },
    lastComplianceReview: { type: Date, default: null },
    reviewDueDate: { type: Date, default: null },
    approvedBy: { type: String, trim: true, default: "" },
    approvalDate: { type: Date, default: null },
  },
  { _id: false }
);

const vendorPerformanceSchema = new mongoose.Schema(
  {
    vendorScore: { type: Number, default: 0, min: 0 },
    deliveryRating: { type: Number, default: 0, min: 0 },
    qualityRating: { type: Number, default: 0, min: 0 },
    overallRating: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const supplierMasterSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    supplierCode: { type: String, trim: true, required: true },
    supplierName: { type: String, trim: true, required: true },
    supplierPurchaseType: { type: String, trim: true, default: "" },
    isSupplierActive: { type: String, trim: true, default: "A" },
    supplierCompanyType: { type: String, trim: true, default: "" },
    supplierBillingAddress: { type: [supplierAddressSchema], default: [] },
    supplierCurrency: { type: String, trim: true, default: "USD" },
    supplierINCOTerms: { type: String, trim: true, default: "" },
    supplierPaymentTerms: { type: String, trim: true, default: "" },
    countryOfOrigin: { type: String, trim: true, default: "" },
    supplierAddress: { type: [supplierAddressSchema], default: [] },
    supplierBankDetails: { type: [supplierBankDetailsSchema], default: [] },
    supplierCIN: { type: String, trim: true, default: "" },
    supplierContactMatrix: { type: [supplierContactSchema], default: [] },
    supplierLeadTimeInDays: { type: Number, default: null },
    supplierMSMENo: { type: String, trim: true, default: "" },
    supplierNickName: { type: String, trim: true, default: "" },
    supplierShippingAddress: { type: [supplierAddressSchema], default: [] },
    supplierType: { type: String, trim: true, default: "" },
    supplierURD: { type: String, trim: true, default: "" },
    supplierVendorCode: { type: String, trim: true, default: "" },
    supplierWebsite: { type: String, trim: true, default: "" },
    categoryType: { type: String, trim: true, default: "" },
    gstClassification: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, default: "" },
    revNumber: { type: Number, default: 0, min: 0 },
    revisionHistory: { type: [supplierRevisionSchema], default: [] },
    govProcurement: { type: govProcurementSchema, default: () => ({}) },
    vendorCompliance: {
      type: vendorComplianceSchema,
      default: () => ({ complianceStatus: "Draft" }),
    },
    vendorPerformance: { type: vendorPerformanceSchema, default: () => ({}) },
  },
  { timestamps: true, collection: "SupplierMaster" }
);

supplierMasterSchema.index({ company: 1, supplierCode: 1 }, { unique: true });

export const SupplierMaster =
  mongoose.models.SupplierMaster ||
  mongoose.model("SupplierMaster", supplierMasterSchema);
