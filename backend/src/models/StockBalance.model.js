import mongoose from "mongoose";

const stockBalanceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    inventoryStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryStore",
      required: true,
      index: true,
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemMaster", required: true, index: true },
    itemNo: { type: String, trim: true, default: "" },
    qtyOnHand: { type: Number, default: 0 },
    uom: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "StockBalance" }
);

stockBalanceSchema.index(
  { company: 1, locationId: 1, inventoryStoreId: 1, itemId: 1 },
  { unique: true }
);

export const StockBalance =
  mongoose.models.StockBalance || mongoose.model("StockBalance", stockBalanceSchema);
