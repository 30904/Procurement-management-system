import mongoose from "mongoose";

const itemAttributeDefinitionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    code: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    dataType: {
      type: String,
      enum: ["text", "number", "decimal", "boolean", "date", "dropdown", "multi_select"],
      default: "text",
    },
    unit: { type: String, trim: true, default: "" },
    options: { type: [String], default: [] },
    masterDataCategory: { type: String, trim: true, default: "" },
    mandatoryRule: {
      type: String,
      enum: ["never", "always", "by_item_category"],
      default: "never",
    },
    applicableCategories: { type: [String], default: [] },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: null },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    regex: { type: String, trim: true, default: "" },
    sequence: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true, collection: "ItemAttributeDefinition" }
);

itemAttributeDefinitionSchema.index({ company: 1, code: 1 }, { unique: true });

export const ItemAttributeDefinition =
  mongoose.models.ItemAttributeDefinition ||
  mongoose.model("ItemAttributeDefinition", itemAttributeDefinitionSchema);
