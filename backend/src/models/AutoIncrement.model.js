import mongoose from "mongoose";

/**
 * Per-company auto-increment sequences (e.g. supplier codes: DGM/0032).
 * Counter increments only when allocateNextCode() runs on successful save.
 */
const autoIncrementSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    moduleName: { type: String, trim: true, required: true },
    module: { type: String, trim: true, required: true, uppercase: true },
    modulePrefix: { type: String, trim: true, required: true, uppercase: true },
    autoIncrementValue: { type: Number, default: 0, min: 0 },
    digit: { type: Number, default: 4, min: 1, max: 12 },
    /** When set, counter is per location (e.g. PUN-PO-000001). Null = company-wide legacy. */
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
  },
  { timestamps: true, collection: "AutoIncrement" }
);

autoIncrementSchema.index({ company: 1, module: 1, locationId: 1 }, { unique: true });

export const AutoIncrement =
  mongoose.models.AutoIncrement || mongoose.model("AutoIncrement", autoIncrementSchema);
