import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";
import { ItemAttributeDefinition } from "../src/models/ItemAttributeDefinition.model.js";

const COATING_CATEGORY = "ITEM_COATING_TYPE";

const ATTR_DEFS = [
  {
    code: "WIDTH",
    label: "Width",
    dataType: "number",
    unit: "mm",
    min: 0,
    mandatoryRule: "by_item_category",
    applicableCategories: ["IRM", "IPK"],
    sequence: 5,
  },
  {
    code: "LENGTH",
    label: "Length",
    dataType: "number",
    unit: "mm",
    min: 0,
    mandatoryRule: "by_item_category",
    applicableCategories: ["IRM", "IPK"],
    sequence: 6,
  },
  {
    code: "THICKNESS",
    label: "Thickness",
    dataType: "number",
    unit: "µm",
    min: 0,
    mandatoryRule: "never",
    applicableCategories: ["IRM", "IPK"],
    sequence: 7,
  },
  {
    code: "GSM",
    label: "GSM",
    dataType: "number",
    unit: "GMS",
    min: 0,
    mandatoryRule: "by_item_category",
    applicableCategories: ["IRM", "IPK"],
    sequence: 8,
  },
  {
    code: "MATERIAL_GRADE",
    label: "Material Grade",
    dataType: "text",
    mandatoryRule: "by_item_category",
    applicableCategories: ["IRM"],
    sequence: 10,
  },
  {
    code: "THREAD_SIZE",
    label: "Thread Size",
    dataType: "text",
    unit: "mm",
    mandatoryRule: "never",
    applicableCategories: ["IRM"],
    sequence: 20,
  },
  {
    code: "RATED_VOLTAGE",
    label: "Rated Voltage",
    dataType: "number",
    unit: "V",
    min: 0,
    max: 1000,
    mandatoryRule: "by_item_category",
    applicableCategories: ["IRM", "IFG"],
    sequence: 30,
  },
  {
    code: "COATING_TYPE",
    label: "Coating Type",
    dataType: "dropdown",
    masterDataCategory: COATING_CATEGORY,
    options: ["Powder Coat", "Zinc Plated", "Bare"],
    mandatoryRule: "never",
    applicableCategories: ["IRM", "IPK"],
    sequence: 40,
  },
  {
    code: "IS_HAZARDOUS",
    label: "Hazardous Material",
    dataType: "boolean",
    defaultValue: false,
    mandatoryRule: "always",
    applicableCategories: [],
    sequence: 50,
  },
  {
    code: "SHELF_LIFE_MONTHS",
    label: "Shelf Life",
    dataType: "number",
    unit: "months",
    min: 0,
    max: 120,
    mandatoryRule: "by_item_category",
    applicableCategories: ["ICN"],
    sequence: 60,
  },
  {
    code: "PACK_DIMENSIONS",
    label: "Pack Dimensions (L×W×H)",
    dataType: "text",
    mandatoryRule: "never",
    applicableCategories: ["IPK"],
    sequence: 70,
  },
];

const COATING_OPTIONS = [
  { label: "Powder Coat", value: "POWDER" },
  { label: "Zinc Plated", value: "ZINC" },
  { label: "Bare", value: "BARE" },
  { label: "Anodized", value: "ANODIZED" },
];

async function main() {
  await connectDatabase();
  const company =
    (process.env.SEED_COMPANY_CODE
      ? await Company.findOne({ companyCode: process.env.SEED_COMPANY_CODE.trim() })
      : null) || (await Company.findOne({ isActive: true }).sort({ createdAt: 1 }));
  if (!company) throw new Error("No company found");

  for (let i = 0; i < COATING_OPTIONS.length; i += 1) {
    const o = COATING_OPTIONS[i];
    await MasterData.findOneAndUpdate(
      { company: company._id, category: COATING_CATEGORY, label: o.label },
      {
        $set: {
          company: company._id,
          category: COATING_CATEGORY,
          label: o.label,
          value: o.value,
          sequence: (i + 1) * 10,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log(`[seed-item-attribute-definitions] Coating master data: ${COATING_OPTIONS.length} upserted`);

  for (const row of ATTR_DEFS) {
    await ItemAttributeDefinition.findOneAndUpdate(
      { company: company._id, code: row.code },
      { $set: { company: company._id, ...row, status: "Active" } },
      { upsert: true, new: true }
    );
  }
  console.log(`[seed-item-attribute-definitions] Upserted ${ATTR_DEFS.length} attribute definitions`);
}

main()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
