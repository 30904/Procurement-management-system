import mongoose from "mongoose";

const subLocationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    parentLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    /** Alias for parentLocation (API compatibility) */
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    subLocationCode: { type: String, trim: true, required: true },
    subLocationId: { type: String, trim: true, required: true },
    subLocationName: { type: String, trim: true, default: "" },
    locationType: { type: String, trim: true, default: "" },
    operationalCategory: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, default: "" },
    status: { type: String, trim: true, default: "Active" },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "SubLocation" }
);

subLocationSchema.index({ company: 1, subLocationCode: 1 }, { unique: true });
subLocationSchema.index({ company: 1, parentLocation: 1, subLocationId: 1 }, { unique: true });
subLocationSchema.index({ company: 1, locationId: 1, subLocationCode: 1 });

export const SubLocation =
  mongoose.models.SubLocation || mongoose.model("SubLocation", subLocationSchema);
