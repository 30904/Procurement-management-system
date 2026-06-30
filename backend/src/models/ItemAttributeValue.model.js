import mongoose from "mongoose";

const itemAttributeValueSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemMaster", required: true, index: true },
    attributeCode: { type: String, trim: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "ItemAttributeValue" }
);

itemAttributeValueSchema.index({ company: 1, itemId: 1, attributeCode: 1 }, { unique: true });

export const ItemAttributeValue =
  mongoose.models.ItemAttributeValue || mongoose.model("ItemAttributeValue", itemAttributeValueSchema);
