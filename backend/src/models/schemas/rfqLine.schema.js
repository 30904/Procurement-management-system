import mongoose from "mongoose";

export const rfqLineSchema = new mongoose.Schema(
  {
    lineNo: { type: Number, required: true, min: 1 },
    lineType: { type: String, enum: ["Material", "Service"], default: "Material" },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    itemNo: { type: String, trim: true, default: "" },
    itemName: { type: String, trim: true, default: "" },
    serviceId: { type: mongoose.Schema.Types.ObjectId },
    serviceCode: { type: String, trim: true, default: "" },
    serviceName: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    uom: { type: String, trim: true, default: "" },
    qty: { type: Number, required: true, min: 0 },
    expectedDelivery: { type: Date },
    technicalSpecification: { type: String, trim: true, default: "" },
    drawingReference: { type: String, trim: true, default: "" },
    attachmentNote: { type: String, trim: true, default: "" },
    lineRemarks: { type: String, trim: true, default: "" },
  },
  { _id: false }
);
