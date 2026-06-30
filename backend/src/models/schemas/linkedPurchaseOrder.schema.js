import mongoose from "mongoose";

export const linkedPurchaseOrderSchema = new mongoose.Schema(
  {
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    poNo: { type: String, trim: true, default: "" },
    poStatus: { type: String, trim: true, default: "Draft" },
    poDate: { type: Date },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
