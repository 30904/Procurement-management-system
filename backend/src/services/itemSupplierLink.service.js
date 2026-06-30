import { AppError } from "../utils/AppError.js";
import { ItemMaster } from "../models/ItemMaster.model.js";
import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { ItemSupplierLink } from "../models/ItemSupplierLink.model.js";

function normalizeRates(rows = []) {
  const normalized = Array.isArray(rows)
    ? rows
        .map((r) => ({
          moq: Number(r?.moq ?? 0),
          uom: String(r?.uom ?? "").trim(),
          rate: Number(r?.rate ?? 0),
        }))
        .filter((r) => r.uom)
    : [];
  if (!normalized.length) throw new AppError("At least one rate row is required", 400, "VALIDATION_ERROR");
  for (const row of normalized) {
    if (Number.isNaN(row.moq) || row.moq < 0) throw new AppError("MOQ must be 0 or greater", 400, "VALIDATION_ERROR");
    if (Number.isNaN(row.rate) || row.rate < 0) throw new AppError("Rate must be 0 or greater", 400, "VALIDATION_ERROR");
  }
  return normalized;
}

async function ensureRefs(companyId, itemId, supplierId) {
  const item = await ItemMaster.findOne({ _id: itemId, company: companyId }).lean();
  if (!item) throw new AppError("Item not found", 404, "NOT_FOUND");
  let supplier = null;
  if (supplierId) {
    supplier = await SupplierMaster.findOne({ _id: supplierId, company: companyId }).lean();
    if (!supplier) throw new AppError("Supplier not found", 404, "NOT_FOUND");
  }
  return { item, supplier };
}

export async function listItemSupplierLinks(companyId, itemId) {
  await ensureRefs(companyId, itemId);
  return ItemSupplierLink.find({ company: companyId, itemId }).sort({ supplierName: 1, createdAt: -1 }).lean();
}

function pickDefaultRate(rates = []) {
  if (!Array.isArray(rates) || !rates.length) return { rate: "", uom: "" };
  const sorted = [...rates].sort((a, b) => Number(a.moq ?? 0) - Number(b.moq ?? 0));
  const row = sorted[0];
  return { rate: Number(row.rate ?? 0), uom: String(row.uom ?? "").trim() };
}

export async function listSupplierLinkedItems(companyId, supplierId) {
  const id = String(supplierId ?? "").trim();
  if (!id) throw new AppError("Supplier is required", 400, "VALIDATION_ERROR");

  const supplier = await SupplierMaster.findOne({ _id: id, company: companyId }).lean();
  if (!supplier) throw new AppError("Supplier not found", 404, "NOT_FOUND");

  const links = await ItemSupplierLink.find({
    company: companyId,
    supplierId: supplier._id,
    status: "Active",
  })
    .sort({ isPreferred: -1, createdAt: 1 })
    .lean();

  if (!links.length) return [];

  const itemIds = [...new Set(links.map((link) => String(link.itemId)))];
  const items = await ItemMaster.find({ _id: { $in: itemIds }, company: companyId }).lean();
  const itemMap = new Map(items.map((item) => [String(item._id), item]));

  return links
    .map((link) => {
      const item = itemMap.get(String(link.itemId));
      if (!item) return null;
      const { rate, uom } = pickDefaultRate(link.rates);
      return {
        linkId: link._id,
        itemId: item._id,
        itemNo: item.itemNo ?? "",
        itemName: item.itemName ?? "",
        itemDescription: item.itemDescription ?? "",
        uom: link.uom || uom || item.uom || "",
        hsnCode: item.hsnCode ?? "",
        gstRate: Number(item.gstRate ?? 0),
        mpn: link.mpn ?? "",
        rates: link.rates ?? [],
        isPreferred: Boolean(link.isPreferred),
        defaultRate: rate,
      };
    })
    .filter(Boolean);
}

export async function createItemSupplierLink(companyId, itemId, data, actorId) {
  const supplierId = String(data?.supplierId ?? "").trim();
  if (!supplierId) throw new AppError("Supplier is required", 400, "VALIDATION_ERROR");
  const { supplier } = await ensureRefs(companyId, itemId, supplierId);
  const rates = normalizeRates(data?.rates);

  const isPreferred = Boolean(data?.isPreferred);
  if (isPreferred) {
    await ItemSupplierLink.updateMany(
      { company: companyId, itemId, isPreferred: true },
      { $set: { isPreferred: false, updatedBy: actorId } }
    );
  }

  const doc = await ItemSupplierLink.create({
    company: companyId,
    itemId,
    supplierId: supplier._id,
    supplierCode: supplier.supplierCode,
    supplierName: supplier.supplierName,
    supplierCategory: supplier.categoryType || supplier.supplierPurchaseType || "",
    mpn: String(data?.mpn ?? "").trim(),
    uom: String(data?.uom ?? "").trim() || String(data?.rates?.[0]?.uom ?? "").trim(),
    rates,
    isPreferred,
    status: data?.status === "Inactive" ? "Inactive" : "Active",
    createdBy: actorId,
    updatedBy: actorId,
  });
  return doc.toObject();
}

export async function updateItemSupplierLink(companyId, itemId, linkId, data, actorId) {
  const doc = await ItemSupplierLink.findOne({ _id: linkId, company: companyId, itemId });
  if (!doc) throw new AppError("Supplier link not found", 404, "NOT_FOUND");
  const rates = normalizeRates(data?.rates ?? doc.rates);
  doc.mpn = String(data?.mpn ?? doc.mpn ?? "").trim();
  doc.uom = String(data?.uom ?? doc.uom ?? "").trim();
  doc.rates = rates;
  const nextPreferred = data?.isPreferred !== undefined ? Boolean(data.isPreferred) : doc.isPreferred;
  if (nextPreferred) {
    await ItemSupplierLink.updateMany(
      { company: companyId, itemId, _id: { $ne: doc._id }, isPreferred: true },
      { $set: { isPreferred: false, updatedBy: actorId } }
    );
  }
  doc.isPreferred = nextPreferred;
  doc.status = data?.status === "Inactive" ? "Inactive" : "Active";
  doc.updatedBy = actorId;
  await doc.save();
  return doc.toObject();
}

export async function deleteItemSupplierLink(companyId, itemId, linkId) {
  const doc = await ItemSupplierLink.findOneAndDelete({ _id: linkId, company: companyId, itemId });
  if (!doc) throw new AppError("Supplier link not found", 404, "NOT_FOUND");
  return { deleted: true, id: linkId };
}
