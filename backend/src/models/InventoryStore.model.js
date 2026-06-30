import mongoose from "mongoose";

const inventoryStoreSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    storeCode: { type: String, trim: true, required: true },
    storeName: { type: String, trim: true, required: true },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "InventoryStore" }
);

inventoryStoreSchema.index({ company: 1, locationId: 1, storeCode: 1 }, { unique: true });

export const InventoryStore =
  mongoose.models.InventoryStore || mongoose.model("InventoryStore", inventoryStoreSchema);
