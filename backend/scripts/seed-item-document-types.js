import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { ItemDocumentType } from "../src/models/ItemDocumentType.model.js";

const DOC_TYPES = [
  {
    code: "GA_DRAWING",
    label: "GA Drawing",
    description: "General arrangement / layout drawing",
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    maxFiles: 2,
    mandatoryRule: "by_item_category",
    applicableCategories: ["IRM", "ISF", "IFG"],
    sequence: 10,
  },
  {
    code: "SPEC_SHEET",
    label: "Specification Sheet",
    description: "Technical specification document",
    allowedMimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    maxFiles: 1,
    mandatoryRule: "always",
    applicableCategories: [],
    sequence: 20,
  },
  {
    code: "PRODUCT_PHOTO",
    label: "Product Photo",
    description: "Reference photo of item",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFiles: 3,
    mandatoryRule: "never",
    applicableCategories: [],
    sequence: 30,
  },
  {
    code: "CAD_3D",
    label: "3D Model / CAD",
    description: "STEP or CAD file",
    allowedMimeTypes: ["application/pdf", "application/octet-stream", "model/step"],
    maxFiles: 1,
    mandatoryRule: "by_item_category",
    applicableCategories: ["IRM"],
    sequence: 40,
  },
  {
    code: "QC_CHECKLIST",
    label: "QC Checklist",
    description: "Quality inspection checklist",
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxFiles: 1,
    mandatoryRule: "never",
    applicableCategories: ["IFG", "ISF"],
    sequence: 50,
  },
];

async function main() {
  await connectDatabase();
  const company =
    (process.env.SEED_COMPANY_CODE
      ? await Company.findOne({ companyCode: process.env.SEED_COMPANY_CODE.trim() })
      : null) || (await Company.findOne({ isActive: true }).sort({ createdAt: 1 }));
  if (!company) throw new Error("No company found");

  for (const row of DOC_TYPES) {
    await ItemDocumentType.findOneAndUpdate(
      { company: company._id, code: row.code },
      { $set: { company: company._id, ...row, status: "Active" } },
      { upsert: true, new: true }
    );
  }
  console.log(`[seed-item-document-types] Upserted ${DOC_TYPES.length} document types`);
}

main()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
