import mongoose from "mongoose";
import { rfqLineSchema } from "./schemas/rfqLine.schema.js";
import { rfqVendorSchema } from "./schemas/rfqVendor.schema.js";

const rfqSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    subLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation" },
    rfqNo: { type: String, trim: true, required: true },
    rfqDate: { type: Date, required: true, default: Date.now },
    rfqType: { type: String, trim: true, default: "Material" },
    department: { type: String, trim: true, default: "" },
    procurementCategory: { type: String, trim: true, default: "" },
    purchaseType: { type: String, trim: true, default: "" },
    currency: { type: String, trim: true, default: "INR" },
    referencePrId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseIndent" },
    referencePrNo: { type: String, trim: true, default: "" },
    referencePlanningRef: { type: String, trim: true, default: "" },
    requiredDeliveryDate: { type: Date },
    closingDate: { type: Date },
    buyer: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Open", "Closed", "Cancelled", "Awarded", "Expired"],
      default: "Draft",
    },
    vendors: { type: [rfqVendorSchema], default: [] },
    lines: { type: [rfqLineSchema], default: [] },
    totalQty: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: "" },
    terms: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "Rfq" }
);

rfqSchema.index({ company: 1, rfqNo: 1 }, { unique: true });
rfqSchema.index({ company: 1, locationId: 1, rfqDate: -1 });
rfqSchema.index({ company: 1, status: 1, closingDate: 1 });

export const Rfq = mongoose.models.Rfq || mongoose.model("Rfq", rfqSchema);
