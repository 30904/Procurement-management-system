import mongoose from "mongoose";

export const purchaseIndentLineSchema = new mongoose.Schema(
  {
    lineNo: { type: Number, required: true, min: 1 },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemMaster" },
    itemNo: { type: String, trim: true, default: "" },
    itemName: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    uom: { type: String, trim: true, default: "" },
    qty: { type: Number, required: true, min: 0 },
    requiredDate: { type: Date },
    lineRemarks: { type: String, trim: true, default: "" },
  },
  { _id: false }
);
