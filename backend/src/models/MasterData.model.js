import mongoose from "mongoose";

/**
 * Generic key-value master data for any application built on the framework.
 * Supports categories like trade, skill, job_type, city, department, etc.
 */
const masterDataSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    category: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    label: { type: String, trim: true, required: true },
    value: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    sequence: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true, collection: "MasterData" }
);

masterDataSchema.index({ company: 1, category: 1, label: 1 }, { unique: true });
masterDataSchema.index({ company: 1, category: 1, sequence: 1 });

export const MasterData =
  mongoose.models.MasterData || mongoose.model("MasterData", masterDataSchema);
