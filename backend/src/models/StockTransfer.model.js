import mongoose from "mongoose";
import { transactionLineSchema } from "./schemas/transactionLine.schema.js";

const stockTransferSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    transferNo: { type: String, trim: true, required: true },
    transferDate: { type: Date, required: true, default: Date.now },
    fromLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    fromStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore", required: true },
    toLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    toStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore", required: true },
    status: {
      type: String,
      enum: ["Draft", "In Transit", "Completed", "Cancelled"],
      default: "Draft",
    },
    lines: { type: [transactionLineSchema], default: [] },
    remarks: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "StockTransfer" }
);

stockTransferSchema.index({ company: 1, transferNo: 1 }, { unique: true });
stockTransferSchema.index({ company: 1, fromLocationId: 1, transferDate: -1 });

export const StockTransfer =
  mongoose.models.StockTransfer || mongoose.model("StockTransfer", stockTransferSchema);
