import ExcelJS from "exceljs";
import { MasterData } from "../models/MasterData.model.js";
import { HsnPMaster } from "../models/HsnPMaster.model.js";
import { Location } from "../models/Location.model.js";
import { InventoryStore } from "../models/InventoryStore.model.js";
import { SubLocation } from "../models/SubLocation.model.js";
import { createItemMaster } from "./itemMaster.service.js";
import { AppError } from "../utils/AppError.js";
import {
  resolveItemUploadLocationFields,
  resolveItemUploadSubLocationFields,
} from "../utils/resolveMasterLocationFields.js";

/** Excel column definitions — must match Item Master create form */
export const ITEM_UPLOAD_COLUMNS = [
  { key: "itemCategory", header: "Material Category *", required: true, width: 16 },
  { key: "itemName", header: "Material Name *", required: true, width: 28 },
  { key: "itemDescription", header: "Material Description *", required: true, width: 32 },
  { key: "uom", header: "UoM *", required: true, width: 10 },
  { key: "hsnCode", header: "HSN Code *", required: true, width: 14 },
  { key: "location", header: "Location *", required: true, width: 16 },
  { key: "inventoryStore", header: "Inventory Store *", required: true, width: 18 },
  { key: "subLocation", header: "Sub Location", required: false, width: 18 },
  { key: "reorderLevel", header: "Reorder Level", required: false, width: 14 },
  { key: "status", header: "Status", required: false, width: 12 },
  { key: "dualUnitEnabled", header: "Dual Unit (Yes/No)", required: false, width: 16 },
  { key: "secondaryUnit", header: "Secondary Unit", required: false, width: 14 },
  { key: "conversionFactor", header: "Conversion Factor", required: false, width: 16 },
];

const SAMPLE_ROW = {
  itemCategory: "IRM",
  itemName: "Copper Wire 1.5 sqmm",
  itemDescription: "Electrical copper wire coil",
  uom: "NOS",
  hsnCode: "",
  location: "Factory",
  inventoryStore: "RM-MAIN",
  subLocation: "Production Floor",
  reorderLevel: "100",
  status: "Active",
  dualUnitEnabled: "No",
  secondaryUnit: "",
  conversionFactor: "",
};

function headerMapFromRow(row) {
  const map = new Map();
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    const label = String(cell.value ?? "")
      .trim()
      .replace(/\s+/g, " ");
    if (label) map.set(label.toLowerCase(), col);
  });
  return map;
}

function colIndex(map, ...aliases) {
  for (const alias of aliases) {
    const idx = map.get(alias.toLowerCase());
    if (idx) return idx;
  }
  for (const [key, idx] of map.entries()) {
    if (aliases.some((a) => key.includes(a.toLowerCase()))) return idx;
  }
  return null;
}

function cellText(row, col) {
  if (!col) return "";
  const cell = row.getCell(col);
  if (cell.value == null) return "";
  if (typeof cell.value === "object" && cell.value.text) return String(cell.value.text).trim();
  if (cell.value instanceof Date) return cell.value.toISOString().slice(0, 10);
  return String(cell.value).trim();
}

function parseYesNo(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "yes" || v === "y" || v === "true" || v === "1";
}

function normalizeStatus(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Active";
  if (v.toLowerCase() === "inactive") return "Inactive";
  return "Active";
}

async function loadReferenceData(companyId) {
  const [categories, uoms, locations, stores, subLocations, hsnCodes] = await Promise.all([
    MasterData.find({ company: companyId, category: "Item Category", status: "Active" })
      .sort({ sequence: 1, label: 1 })
      .lean(),
    MasterData.find({ company: companyId, category: "UoM", status: "Active" })
      .sort({ sequence: 1, label: 1 })
      .lean(),
    Location.find({ company: companyId, isActive: { $ne: false } })
      .sort({ isCentral: -1, locationId: 1 })
      .lean(),
    InventoryStore.find({ company: companyId, status: { $ne: "Inactive" } })
      .sort({ locationId: 1, storeCode: 1 })
      .lean(),
    SubLocation.find({ company: companyId, status: { $ne: "Inactive" }, isActive: { $ne: false } })
      .sort({ parentLocation: 1, subLocationId: 1 })
      .lean(),
    HsnPMaster.find({ company: companyId, status: "Active" }).sort({ hsnCode: 1 }).select("hsnCode").lean(),
  ]);

  const firstHsn = hsnCodes[0]?.hsnCode ?? "";
  const firstLoc = locations[0];
  const firstStore = stores.find((s) => String(s.locationId) === String(firstLoc?._id)) || stores[0];
  const firstSub =
    subLocations.find((s) => String(s.parentLocation || s.locationId) === String(firstLoc?._id)) ||
    subLocations[0];

  return {
    categories,
    uoms,
    locations,
    stores,
    subLocations,
    hsnCodes,
    sampleHsn: firstHsn,
    sampleLocation: firstLoc?.locationId || firstLoc?.name || "",
    sampleStore: firstStore?.storeCode || "",
    sampleSubLocation: firstSub?.subLocationId || firstSub?.subLocationName || "",
  };
}

export async function buildItemMasterUploadTemplate(companyId) {
  const ref = await loadReferenceData(companyId);
  const sample = {
    ...SAMPLE_ROW,
    hsnCode: ref.sampleHsn || "Enter valid HSN from HSN/P Master",
    location: ref.sampleLocation || SAMPLE_ROW.location,
    inventoryStore: ref.sampleStore || SAMPLE_ROW.inventoryStore,
    subLocation: ref.sampleSubLocation || SAMPLE_ROW.subLocation,
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Celeris PMS";
  workbook.created = new Date();

  const items = workbook.addWorksheet("New Materials", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  items.columns = ITEM_UPLOAD_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  const headerRow = items.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF197DFA" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;

  items.addRow(
    ITEM_UPLOAD_COLUMNS.map((col) => sample[col.key] ?? "")
  );

  const notes = workbook.addWorksheet("Instructions");
  notes.getColumn(1).width = 88;
  const lines = [
    "Upload Material Master — Instructions",
    "",
    "1. Fill rows in the 'New Materials' sheet. Material codes are generated automatically from Material Category.",
    "2. Material Category must be the code (e.g. IRM, ICN, IPK) — see Reference sheet.",
    "3. HSN Code must exist in HSN/P Master (Active). GST rate is taken from HSN/P.",
    "4. Location = Location Master business ID or name (e.g. Factory, HO).",
    "5. Inventory Store = store code at that location (see Reference sheet).",
    "6. Sub Location (optional) = sub-location ID or name at that location.",
    "7. Reorder Level (optional) = numeric minimum stock trigger (≥ 0).",
    "8. Status: Active or Inactive (default Active).",
    "9. Dual Unit: Yes/No. If Yes, set Secondary Unit and Conversion Factor (> 0). Primary unit = UoM.",
    "",
    "Valid Item Categories (code — label):",
    ...ref.categories.map((r) => `  • ${r.value || r.label} — ${r.label}`),
    "",
    "Valid UoM:",
    ...ref.uoms.map((r) => `  • ${r.value || r.label}`),
    "",
    "Locations and inventory stores (from Location Master / Inventory Stores):",
    ...ref.locations.flatMap((loc) => {
      const locLabel = loc.locationId || loc.name;
      const locStores = ref.stores.filter((s) => String(s.locationId) === String(loc._id));
      if (!locStores.length) return [`  • ${locLabel} — (no stores configured)`];
      return locStores.map((s) => `  • ${locLabel} → ${s.storeCode} (${s.storeName})`);
    }),
    "",
    "Sample HSN codes (from HSN/P Master):",
    ...(ref.hsnCodes.length
      ? ref.hsnCodes.slice(0, 15).map((h) => `  • ${h.hsnCode}`)
      : ["  • (No HSN/P records — create HSN/P Master first)"]),
  ];
  lines.forEach((line, i) => {
    const row = notes.getRow(i + 1);
    row.getCell(1).value = line;
    if (i === 0) row.font = { bold: true, size: 12 };
  });

  const reference = workbook.addWorksheet("Reference");
  reference.columns = [
    { header: "Type", key: "type", width: 18 },
    { header: "Code / Value", key: "code", width: 18 },
    { header: "Label", key: "label", width: 28 },
  ];
  reference.getRow(1).font = { bold: true };
  for (const r of ref.categories) {
    reference.addRow({ type: "Material Category", code: r.value || r.label, label: r.label });
  }
  for (const r of ref.uoms) {
    reference.addRow({ type: "UoM", code: r.value || r.label, label: r.label });
  }
  for (const loc of ref.locations) {
    reference.addRow({
      type: "Location",
      code: loc.locationId || "",
      label: loc.name || loc.locationId || "",
    });
  }
  for (const s of ref.stores) {
    const loc = ref.locations.find((l) => String(l._id) === String(s.locationId));
    reference.addRow({
      type: "Inventory Store",
      code: s.storeCode,
      label: `${loc?.locationId || loc?.name || "?"} — ${s.storeName}`,
    });
  }
  for (const s of ref.subLocations) {
    const loc = ref.locations.find(
      (l) => String(l._id) === String(s.parentLocation || s.locationId)
    );
    reference.addRow({
      type: "Sub Location",
      code: s.subLocationId || s.subLocationCode || "",
      label: `${loc?.locationId || loc?.name || "?"} — ${s.subLocationName || s.subLocationId || ""}`,
    });
  }

  return workbook.xlsx.writeBuffer();
}

export async function parseItemMasterUploadBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

export async function importItemMasterWorkbook(companyId, buffer, actorId) {
  const workbook = await parseItemMasterUploadBuffer(buffer);
  const sheet =
    workbook.getWorksheet("New Materials") ||
    workbook.getWorksheet("New Items") ||
    workbook.worksheets.find((ws) => ws.rowCount > 0) ||
    workbook.worksheets[0];

  if (!sheet) {
    throw new AppError("Workbook has no data sheet", 400, "VALIDATION_ERROR");
  }

  const colMap = headerMapFromRow(sheet.getRow(1));
  const idx = {
    itemCategory: colIndex(colMap, "material category *", "material category", "item category *", "item category"),
    itemName: colIndex(colMap, "material name *", "material name", "item name *", "item name"),
    itemDescription: colIndex(colMap, "material description *", "material description", "item description *", "item description"),
    uom: colIndex(colMap, "uom *", "uom"),
    hsnCode: colIndex(colMap, "hsn code *", "hsn code"),
    location: colIndex(colMap, "location *", "location"),
    inventoryStore: colIndex(colMap, "inventory store *", "inventory store"),
    subLocation: colIndex(colMap, "sub location"),
    reorderLevel: colIndex(colMap, "reorder level"),
    status: colIndex(colMap, "status"),
    dualUnitEnabled: colIndex(colMap, "dual unit"),
    secondaryUnit: colIndex(colMap, "secondary unit"),
    conversionFactor: colIndex(colMap, "conversion factor"),
  };

  if (
    !idx.itemCategory ||
    !idx.itemName ||
    !idx.itemDescription ||
    !idx.uom ||
    !idx.hsnCode ||
    !idx.location ||
    !idx.inventoryStore
  ) {
    throw new AppError(
      "Template headers do not match. Download the latest template and try again.",
      400,
      "VALIDATION_ERROR"
    );
  }

  const results = { created: 0, failed: 0, errors: [], items: [] };

  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const itemCategory = cellText(row, idx.itemCategory);
    const itemName = cellText(row, idx.itemName);
    const itemDescription = cellText(row, idx.itemDescription);
    const uom = cellText(row, idx.uom);
    const hsnCode = cellText(row, idx.hsnCode);
    const locationText = cellText(row, idx.location);
    const inventoryStore = cellText(row, idx.inventoryStore);

    if (!itemCategory && !itemName && !itemDescription && !uom && !hsnCode && !locationText && !inventoryStore) {
      continue;
    }

    const rowLabel = `Row ${r}`;
    const dualEnabled = parseYesNo(cellText(row, idx.dualUnitEnabled));
    const secondaryUnit = cellText(row, idx.secondaryUnit);
    const conversionRaw = cellText(row, idx.conversionFactor);
    const conversionFactor = conversionRaw === "" ? 1 : Number(conversionRaw);

    const payload = {
      itemCategory,
      itemName,
      itemDescription,
      uom,
      hsnCode,
      status: normalizeStatus(cellText(row, idx.status)),
      dualUnit: {
        enabled: dualEnabled,
        primaryUnit: uom,
        secondaryUnit: dualEnabled ? secondaryUnit : "",
        conversionFactor: dualEnabled ? conversionFactor : 1,
      },
    };

    try {
      if (!itemCategory) throw new AppError("Material Category is required", 400, "VALIDATION_ERROR");
      if (!itemName) throw new AppError("Material Name is required", 400, "VALIDATION_ERROR");
      if (!itemDescription) throw new AppError("Material Description is required", 400, "VALIDATION_ERROR");
      if (!uom) throw new AppError("UoM is required", 400, "VALIDATION_ERROR");
      if (!hsnCode) throw new AppError("HSN Code is required", 400, "VALIDATION_ERROR");
      if (!locationText) throw new AppError("Location is required", 400, "VALIDATION_ERROR");
      if (!inventoryStore) throw new AppError("Inventory Store is required", 400, "VALIDATION_ERROR");

      const locFields = await resolveItemUploadLocationFields(companyId, locationText, inventoryStore);
      Object.assign(payload, locFields);
      if (idx.subLocation) {
        const subText = cellText(row, idx.subLocation);
        if (subText) {
          const subFields = await resolveItemUploadSubLocationFields(
            companyId,
            locFields.locationId,
            subText
          );
          Object.assign(payload, subFields);
        }
      }
      if (idx.reorderLevel) {
        const reorderText = cellText(row, idx.reorderLevel);
        if (reorderText !== "") payload.reorderLevel = reorderText;
      }
      if (dualEnabled) {
        if (!secondaryUnit) throw new AppError("Secondary Unit is required when Dual Unit is Yes", 400, "VALIDATION_ERROR");
        if (Number.isNaN(conversionFactor) || conversionFactor <= 0) {
          throw new AppError("Conversion Factor must be greater than 0", 400, "VALIDATION_ERROR");
        }
      }

      const doc = await createItemMaster(companyId, payload, actorId);
      results.created += 1;
      results.items.push({ row: r, itemNo: doc.itemNo, itemName: doc.itemName });
    } catch (err) {
      results.failed += 1;
      results.errors.push({
        row: r,
        message: err.message || "Failed to create item",
      });
    }
  }

  if (results.created === 0 && results.failed === 0) {
    throw new AppError("No data rows found in the uploaded file", 400, "VALIDATION_ERROR");
  }

  return results;
}
