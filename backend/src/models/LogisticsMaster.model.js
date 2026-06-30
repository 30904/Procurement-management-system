import mongoose from "mongoose";

const logisticsAddressSchema = new mongoose.Schema(
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

const logisticsContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const logisticsBankDetailsSchema = new mongoose.Schema(
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

const logisticsVehicleSchema = new mongoose.Schema(
  {
    vehicleNo: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const logisticsRevisionSchema = new mongoose.Schema(
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

const logisticsMasterSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lspCode: { type: String, trim: true, required: true },
    categoryType: { type: String, trim: true, default: "" },
    lspNameLegalEntity: { type: String, trim: true, required: true },
    lspNickName: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, default: "" },
    lspCIN: { type: String, trim: true, default: "" },
    lspCurrency: { type: String, trim: true, default: "INR" },
    lspPaymentTerms: { type: String, trim: true, default: "" },
    freightServiceType: { type: String, trim: true, default: "" },
    rcmApplicability: { type: String, trim: true, default: "" },
    isLspActive: { type: String, trim: true, default: "A" },
    mpbcdcLogistics: {
      transportCategory: { type: String, trim: true, default: "" },
      serviceCoverage: { type: String, trim: true, default: "" },
      gemRegistered: { type: String, trim: true, default: "" },
      approvalStatus: { type: String, trim: true, default: "Draft" },
    },
    lspAddress: { type: [logisticsAddressSchema], default: [] },
    lspContactMatrix: { type: [logisticsContactSchema], default: [] },
    lspBankDetails: { type: [logisticsBankDetailsSchema], default: [] },
    lspVehicleDetails: { type: [logisticsVehicleSchema], default: [] },
    revNumber: { type: Number, default: 0, min: 0 },
    revisionHistory: { type: [logisticsRevisionSchema], default: [] },
  },
  { timestamps: true, collection: "LogisticsMaster" }
);

logisticsMasterSchema.index({ company: 1, lspCode: 1 }, { unique: true });

export const LogisticsMaster =
  mongoose.models.LogisticsMaster ||
  mongoose.model("LogisticsMaster", logisticsMasterSchema);
