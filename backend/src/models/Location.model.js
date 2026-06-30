import mongoose from "mongoose";

const locationContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const locationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    locationCode: { type: String, trim: true, required: true },
    locationId: { type: String, trim: true, required: true },
    name: { type: String, trim: true, default: "" },
    isCentral: { type: Boolean, default: false },
    usesCompanyGstin: { type: Boolean, default: false },
    gstinEffectiveFrom: { type: Date },
    locationType: { type: String, trim: true, default: "" },
    operationalCategory: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, default: "" },
    status: { type: String, trim: true, default: "Active" },
    registrationDate: { type: Date, default: Date.now },
    country: { type: String, trim: true, default: "India" },
    state: { type: String, trim: true, default: "" },
    cityDistrict: { type: String, trim: true, default: "" },
    pinCode: { type: String, trim: true, default: "" },
    addressLine1: { type: String, trim: true, default: "" },
    addressLine2: { type: String, trim: true, default: "" },
    addressLine3: { type: String, trim: true, default: "" },
    addressLine4: { type: String, trim: true, default: "" },
    latitude: { type: String, trim: true, default: "" },
    longitude: { type: String, trim: true, default: "" },
    contacts: { type: [locationContactSchema], default: [] },
    isActive: { type: Boolean, default: true },
    defaultRMStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore" },
    defaultFGStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore" },
    defaultScrapStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore" },
    enablePurchase: { type: Boolean, default: true },
    enableSales: { type: Boolean, default: true },
    enableProduction: { type: Boolean, default: true },
    enableQuality: { type: Boolean, default: true },
    enableMaintenance: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "Location" }
);

locationSchema.index({ company: 1, locationCode: 1 }, { unique: true });
locationSchema.index({ company: 1, locationId: 1 });
locationSchema.index(
  { company: 1, isCentral: 1 },
  { unique: true, partialFilterExpression: { isCentral: true } }
);
locationSchema.index(
  { company: 1, gstin: 1 },
  { unique: true, partialFilterExpression: { gstin: { $type: "string", $ne: "" } } }
);

export const Location =
  mongoose.models.Location || mongoose.model("Location", locationSchema);
