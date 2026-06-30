import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { ItemMaster } from "../src/models/ItemMaster.model.js";
import { ItemAttributeValue } from "../src/models/ItemAttributeValue.model.js";

const SAMPLE_BY_CATEGORY = {
  IRM: {
    WIDTH: 1200,
    LENGTH: 2400,
    THICKNESS: 50,
    GSM: 350,
    MATERIAL_GRADE: "C11000 Copper",
    THREAD_SIZE: "M6",
    RATED_VOLTAGE: 440,
    COATING_TYPE: "ZINC",
    IS_HAZARDOUS: false,
  },
  ICN: {
    IS_HAZARDOUS: true,
    SHELF_LIFE_MONTHS: 24,
  },
  IPK: {
    WIDTH: 400,
    LENGTH: 600,
    THICKNESS: 120,
    GSM: 280,
    COATING_TYPE: "POWDER",
    PACK_DIMENSIONS: "40×30×25 cm",
    IS_HAZARDOUS: false,
  },
  IFG: {
    RATED_VOLTAGE: 230,
    IS_HAZARDOUS: false,
  },
  ISF: {
    IS_HAZARDOUS: false,
  },
};

async function main() {
  await connectDatabase();
  const company =
    (process.env.SEED_COMPANY_CODE
      ? await Company.findOne({ companyCode: process.env.SEED_COMPANY_CODE.trim() })
      : null) || (await Company.findOne({ isActive: true }).sort({ createdAt: 1 }));
  if (!company) throw new Error("No company found");

  const items = await ItemMaster.find({ company: company._id }).lean();
  let count = 0;
  for (const item of items) {
    const attrs = SAMPLE_BY_CATEGORY[item.itemCategory];
    if (!attrs) continue;
    for (const [attributeCode, value] of Object.entries(attrs)) {
      await ItemAttributeValue.findOneAndUpdate(
        { company: company._id, itemId: item._id, attributeCode },
        { $set: { company: company._id, itemId: item._id, attributeCode, value } },
        { upsert: true, new: true }
      );
      count += 1;
    }
  }
  console.log(`[seed-item-attribute-values] Upserted ${count} attribute values for ${items.length} items`);
}

main()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
