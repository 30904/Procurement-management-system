import mongoose from "mongoose";

const vendorEvaluationMasterSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    evaluationCode: { type: String, trim: true, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierMaster" },
    supplierCode: { type: String, trim: true, default: "" },
    supplierName: { type: String, trim: true, default: "" },
    priceWeight: { type: Number, default: 25, min: 0, max: 100 },
    deliveryWeight: { type: Number, default: 25, min: 0, max: 100 },
    qualityWeight: { type: Number, default: 25, min: 0, max: 100 },
    complianceWeight: { type: Number, default: 25, min: 0, max: 100 },
    minimumScore: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true, collection: "VendorEvaluationMaster" }
);

vendorEvaluationMasterSchema.index({ company: 1, evaluationCode: 1 }, { unique: true });

export const VendorEvaluationMaster =
  mongoose.models.VendorEvaluationMaster ||
  mongoose.model("VendorEvaluationMaster", vendorEvaluationMasterSchema);
