import mongoose from "mongoose";

const assetRevisionSchema = new mongoose.Schema(
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

const assetMasterSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assetNo: { type: String, trim: true, required: true },
    assetCategory: { type: String, trim: true, required: true },
    assetName: { type: String, trim: true, required: true },
    assetDescription: { type: String, trim: true, required: true },
    uom: { type: String, trim: true, required: true },
    hsnCode: { type: String, trim: true, required: true },
    gstRate: { type: Number, default: 0 },
    lifeExpectancyYears: { type: Number, required: true, min: 0 },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster" },
    supplierCode: { type: String, trim: true, default: "" },
    supplierName: { type: String, trim: true, default: "" },
    manufacturerName: { type: String, trim: true, default: "" },
    mpnModelNo: { type: String, trim: true, default: "" },
    purchaseRateExGst: { type: Number, default: 0, min: 0 },
    assetUniqueId: { type: String, trim: true, default: "" },
    acquisitionDate: { type: Date, required: true },
    capitalisationDate: { type: Date, required: true },
    inOperationDate: { type: Date },
    manufacturingYear: { type: Number, min: 1900, max: 2100 },
    ratedPowerKw: { type: Number, min: 0 },
    assetLocation: { type: String, trim: true, required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", index: true },
    subLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation", index: true },
    subLocation: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    procurementTracking: {
      assetClassification: { type: String, trim: true, default: "" },
      procurementMode: { type: String, trim: true, default: "" },
      purchaseReference: { type: String, trim: true, default: "" },
      poReference: { type: String, trim: true, default: "" },
      assetLifecycleStatus: { type: String, trim: true, default: "" },
    },
    revNumber: { type: Number, default: 0, min: 0 },
    revisionHistory: { type: [assetRevisionSchema], default: [] },
  },
  { timestamps: true, collection: "AssetMaster" }
);

assetMasterSchema.index({ company: 1, assetNo: 1 }, { unique: true });

export const AssetMaster = mongoose.models.AssetMaster || mongoose.model("AssetMaster", assetMasterSchema);
