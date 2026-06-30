import mongoose from "mongoose";

const itemDocumentTypeSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    code: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    allowedMimeTypes: { type: [String], default: ["application/pdf", "image/jpeg", "image/png"] },
    maxFiles: { type: Number, default: 1, min: 1, max: 20 },
    mandatoryRule: {
      type: String,
      enum: ["never", "always", "by_item_category"],
      default: "never",
    },
    applicableCategories: { type: [String], default: [] },
    sequence: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true, collection: "ItemDocumentType" }
);

itemDocumentTypeSchema.index({ company: 1, code: 1 }, { unique: true });

export const ItemDocumentType =
  mongoose.models.ItemDocumentType || mongoose.model("ItemDocumentType", itemDocumentTypeSchema);
