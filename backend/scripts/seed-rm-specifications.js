/**
 * Seed RM specifications on 5 active items (Quality → RM Specifications).
 * Usage: npm run seed:rm-specifications
 * Prerequisites: items, standard specifications, inspection checklist seeds
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { INSPECTION_STANDARD_STANDARD_SPEC } from "../src/config/inspectionStandard.js";
import { Company } from "../src/models/Company.model.js";
import { ItemMaster } from "../src/models/ItemMaster.model.js";
import { StandardSpecification } from "../src/models/StandardSpecification.model.js";
import { InspectionChecklist } from "../src/models/InspectionChecklist.model.js";

const TARGET_ITEM_NOS = [
  "ICN/0009",
  "ICN/0010",
  "IFG/0018",
  "IPK/0007",
  "IRM/0013",
];

/** Per-item spec value overrides keyed by inspectionParameter (optional). */
const ITEM_SPEC_PROFILES = {
  "ICN/0009": {
    Colour: { specValue: "Clear", ltl: "Clear", utl: "Light yellow" },
    "Moisture Content": { specValue: "0.5", ltl: "0", utl: "1.0" },
    Density: { specValue: "0.87", ltl: "0.85", utl: "0.90" },
  },
  "ICN/0010": {
    Colour: { specValue: "Amber", ltl: "Light amber", utl: "Dark amber" },
    Viscosity: { specValue: "46", ltl: "44", utl: "48" },
    "Flash Point": { specValue: "200", ltl: "190", utl: "210" },
  },
  "IFG/0018": {
    "Dimensions as per Drawing": { specValue: "Per dwg", ltl: "Min", utl: "Max" },
    "Appearance / Visual Inspection": { specValue: "OK", ltl: "—", utl: "—" },
    "Tensile Strength": { specValue: "120", ltl: "110", utl: "130" },
  },
  "IPK/0007": {
    Thickness: { specValue: "3.5", ltl: "3.2", utl: "3.8" },
    Width: { specValue: "400", ltl: "395", utl: "405" },
    Length: { specValue: "600", ltl: "595", utl: "605" },
  },
  "IRM/0013": {
    "Tensile Strength": { specValue: "250", ltl: "240", utl: "260" },
    "Elongation at Break": { specValue: "25", ltl: "20", utl: "30" },
    "Hardness (Shore A)": { specValue: "85", ltl: "80", utl: "90" },
  },
};

const DEFAULT_LINE_VALUES = {
  Colour: { specValue: "As per std", ltl: "—", utl: "—" },
  "Appearance / Visual Inspection": { specValue: "OK", ltl: "—", utl: "—" },
  Thickness: { specValue: "2.0", ltl: "1.8", utl: "2.2" },
  "Tensile Strength": { specValue: "100", ltl: "90", utl: "110" },
  "Moisture Content": { specValue: "1.0", ltl: "0.5", utl: "1.5" },
  "Peel Adhesion Strength": { specValue: "5.0", ltl: "4.5", utl: "5.5" },
};

function buildLines(stdSpecs, itemNo) {
  const profile = ITEM_SPEC_PROFILES[itemNo] || {};
  const pick = stdSpecs.slice(0, 6);
  return pick.map((spec, index) => {
    const param = spec.inspectionParameter;
    const vals = profile[param] || DEFAULT_LINE_VALUES[param] || {
      specValue: "OK",
      ltl: "—",
      utl: "—",
    };
    return {
      standardSpecificationId: spec._id,
      specId: spec.specId,
      sequence: (index + 1) * 10,
      inspectionParameter: spec.inspectionParameter,
      uom: spec.uom,
      testStandard: spec.testStandard || "",
      testMethod: spec.testMethod,
      specValue: vals.specValue,
      ltl: vals.ltl,
      utl: vals.utl,
    };
  });
}

function buildChecklist(checklistRows) {
  return checklistRows.slice(0, 7).map((row, index) => ({
    inspectionChecklistId: row._id,
    checklistId: row.checklistId,
    checklistItem: row.checklistItem,
    displayOrder: row.displayOrder ?? index + 1,
    sequence: (index + 1) * 10,
    selected: index < 5,
  }));
}

async function resolveTargetItems(companyId) {
  const found = [];
  for (const itemNo of TARGET_ITEM_NOS) {
    const doc = await ItemMaster.findOne({
      company: companyId,
      itemNo,
      status: "Active",
    });
    if (doc) found.push(doc);
  }
  if (found.length >= 5) return found.slice(0, 5);

  const extra = await ItemMaster.find({
    company: companyId,
    status: "Active",
    itemNo: { $nin: found.map((d) => d.itemNo) },
    $or: [
      { "rmSpecification.configured": { $ne: true } },
      { "rmSpecification.lines": { $size: 0 } },
      { rmSpecification: { $exists: false } },
    ],
  })
    .sort({ itemNo: 1 })
    .limit(5 - found.length);

  return [...found, ...extra].slice(0, 5);
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-rm-specifications] No company found");
    process.exitCode = 1;
    return;
  }

  const stdSpecs = await StandardSpecification.find({
    company: company._id,
    status: "Active",
  })
    .sort({ specId: 1 })
    .lean();

  if (!stdSpecs.length) {
    console.error(
      "[seed-rm-specifications] No standard specifications found. Run: npm run seed:standard-specifications"
    );
    process.exitCode = 1;
    return;
  }

  const checklistRows = await InspectionChecklist.find({
    company: company._id,
    status: "Active",
  })
    .sort({ displayOrder: 1, checklistId: 1 })
    .lean();

  const items = await resolveTargetItems(company._id);
  if (!items.length) {
    console.error("[seed-rm-specifications] No active items found");
    process.exitCode = 1;
    return;
  }

  let updated = 0;
  for (const item of items) {
    const lines = buildLines(stdSpecs, item.itemNo);
    const inspectionChecklist = buildChecklist(checklistRows);

    item.rmSpecification = {
      inspectionStandard: INSPECTION_STANDARD_STANDARD_SPEC,
      lines,
      inspectionChecklist,
      configured: true,
      revNumber: 0,
      revisionHistory: [],
      updatedAt: new Date(),
    };
    await item.save();
    updated += 1;
    console.log(
      `  ✓ ${item.itemNo} — ${item.itemName} (${lines.length} parameter line(s), ${inspectionChecklist.filter((c) => c.selected).length} checklist item(s))`
    );
  }

  console.log(
    `[seed-rm-specifications] Applied RM specification to ${updated} item(s) for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-rm-specifications] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
