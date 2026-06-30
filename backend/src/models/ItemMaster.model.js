import mongoose from "mongoose";

const itemRevisionSchema = new mongoose.Schema(
  {
    revisionNo: { type: Number, required: true, min: 1 },
    revisionDate: { type: Date, required: true },
    reason: { type: String, trim: true, required: true },
    proposedBy: { type: String, trim: true, required: true },
    approvedBy: { type: String, trim: true, required: true },
    changedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, trim: true, default: "" },
      userName: { type: String, trim: true, default: "" },
      userEmail: { type: String, trim: true, default: "" },
    },
    changedAt: { type: Date, default: Date.now },
    changes: [
      {
        field: { type: String, required: true },
        from: { type: mongoose.Schema.Types.Mixed },
        to: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { _id: false }
);

const itemProcurementInfoSchema = new mongoose.Schema(
  {
    materialType: { type: String, trim: true, default: "" },
    procurementCategory: { type: String, trim: true, default: "" },
    stockType: { type: String, trim: true, default: "" },
    gemApplicable: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const itemGovernanceSchema = new mongoose.Schema(
  {
    approvalStatus: { type: String, trim: true, default: "Draft" },
    approvedBy: { type: String, trim: true, default: "" },
    approvalDate: { type: Date, default: null },
    remarks: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const itemInventoryLevelsSchema = new mongoose.Schema(
  {
    avgMonthlyConsumption: { type: Number, min: 0 },
    workingDaysPerMonth: { type: Number, min: 0 },
    procurementLeadTimeDays: { type: Number, min: 0 },
    procurementPeriodDays: { type: Number, min: 0 },
    procurementFrequency: { type: Number, min: 0 },
    safetyStockPeriodDays: { type: Number, min: 0 },
    adc: { type: Number, min: 0 },
    roq: { type: Number, min: 0 },
    safetyStock: { type: Number, min: 0 },
    rol: { type: Number, min: 0 },
    minLevel: { type: Number, min: 0 },
    maxLevel: { type: Number, min: 0 },
    configured: { type: Boolean, default: false },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const itemMasterSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    itemNo: { type: String, trim: true, required: true },
    itemCategory: { type: String, trim: true, required: true },
    itemName: { type: String, trim: true, required: true },
    itemDescription: { type: String, trim: true, required: true },
    uom: { type: String, trim: true, required: true },
    hsnCode: { type: String, trim: true, required: true },
    gstRate: { type: Number, default: 0 },
    inventoryStore: { type: String, trim: true, required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", index: true },
    inventoryStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStore" },
    subLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "SubLocation", index: true },
    reorderLevel: { type: Number, min: 0 },
    inventoryLevels: { type: itemInventoryLevelsSchema, default: () => ({}) },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    procurementInfo: { type: itemProcurementInfoSchema, default: () => ({}) },
    governance: { type: itemGovernanceSchema, default: () => ({}) },
    dualUnit: {
      enabled: { type: Boolean, default: false },
      primaryUnit: { type: String, trim: true, default: "" },
      secondaryUnit: { type: String, trim: true, default: "" },
      conversionFactor: { type: Number, default: 1, min: 0 },
    },
    revNumber: { type: Number, default: 0, min: 0 },
    revisionHistory: { type: [itemRevisionSchema], default: [] },
    /** Incoming quality control level (Masters → Quality → Item QCL). */
    incomingQcl: {
      qclLevel: { type: String, trim: true, default: "" },
      shelfLifeMonths: { type: Number, min: 0 },
      configured: { type: Boolean, default: false },
      updatedAt: { type: Date },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    /** Raw material specification lines (Masters → Quality → RM Specifications). */
    rmSpecification: {
      inspectionStandard: { type: String, trim: true, default: "" },
      lines: [
        {
          standardSpecificationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StandardSpecification",
          },
          specId: { type: String, trim: true, default: "" },
          sequence: { type: Number, default: 0, min: 0 },
          inspectionParameter: { type: String, trim: true, default: "" },
          uom: { type: String, trim: true, default: "" },
          testStandard: { type: String, trim: true, default: "" },
          testMethod: { type: String, trim: true, default: "" },
          specValue: { type: String, trim: true, default: "" },
          ltl: { type: String, trim: true, default: "" },
          utl: { type: String, trim: true, default: "" },
        },
      ],
      inspectionChecklist: [
        {
          inspectionChecklistId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InspectionChecklist",
          },
          checklistId: { type: String, trim: true, default: "" },
          checklistItem: { type: String, trim: true, default: "" },
          displayOrder: { type: Number, default: 0, min: 0 },
          sequence: { type: Number, default: 0, min: 0 },
          selected: { type: Boolean, default: false },
        },
      ],
      configured: { type: Boolean, default: false },
      revNumber: { type: Number, default: 0, min: 0 },
      revisionHistory: { type: [itemRevisionSchema], default: [] },
      updatedAt: { type: Date },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true, collection: "ItemMaster" }
);

itemMasterSchema.index({ company: 1, itemNo: 1 }, { unique: true });

export const ItemMaster = mongoose.models.ItemMaster || mongoose.model("ItemMaster", itemMasterSchema);
