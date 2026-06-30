import { SourceListMaster } from "../models/SourceListMaster.model.js";
import { ItemMaster } from "../models/ItemMaster.model.js";
import { ServiceMasterR1 } from "../models/ServiceMasterR1.model.js";
import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { parseOptionalDate, trimStr } from "../utils/mpbcdcMasterFields.js";

const CODE_PREFIX = "SL";
const CODE_DIGITS = 4;

export async function getNextSourceListCode(companyId) {
  const regex = new RegExp(`^${CODE_PREFIX}\\d{${CODE_DIGITS}}$`, "i");
  const latest = await SourceListMaster.findOne({ company: companyId, sourceListCode: regex })
    .sort({ sourceListCode: -1 })
    .select({ sourceListCode: 1 })
    .lean();
  let nextNum = 1;
  if (latest?.sourceListCode) {
    const suffix = Number(String(latest.sourceListCode).slice(CODE_PREFIX.length));
    if (Number.isFinite(suffix)) nextNum = suffix + 1;
  }
  return `${CODE_PREFIX}${String(nextNum).padStart(CODE_DIGITS, "0")}`;
}

async function resolveItemRef(companyId, itemType, itemId) {
  if (!itemId) return { itemId: undefined, itemCode: "", itemName: "" };
  const type = trimStr(itemType);
  if (type === "Service") {
    const row = await ServiceMasterR1.findOne({ _id: itemId, company: companyId }).lean();
    if (!row) throw new AppError("Invalid service selected", 400, "VALIDATION_ERROR");
    return { itemId: row._id, itemCode: row.serviceId || "", itemName: row.serviceName || "" };
  }
  const row = await ItemMaster.findOne({ _id: itemId, company: companyId }).lean();
  if (!row) throw new AppError("Invalid material selected", 400, "VALIDATION_ERROR");
  return { itemId: row._id, itemCode: row.itemNo || "", itemName: row.itemName || "" };
}

async function resolveSupplierRef(companyId, supplierId) {
  if (!supplierId) return { supplierId: undefined, supplierCode: "", supplierName: "" };
  const row = await SupplierMaster.findOne({ _id: supplierId, company: companyId }).lean();
  if (!row) throw new AppError("Invalid vendor selected", 400, "VALIDATION_ERROR");
  return {
    supplierId: row._id,
    supplierCode: row.supplierCode || "",
    supplierName: row.supplierName || "",
  };
}

export async function listSourceListMasters(companyId) {
  return SourceListMaster.find({ company: companyId }).sort({ sourceListCode: 1 }).lean();
}

export async function getSourceListMaster(companyId, id) {
  const doc = await SourceListMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Source List record not found", 404, "NOT_FOUND");
  return doc;
}

export async function createSourceListMaster(companyId, data, actorId) {
  const sourceListCode = trimStr(data?.sourceListCode).toUpperCase();
  if (!sourceListCode) throw new AppError("Source List Code is required", 400, "VALIDATION_ERROR");

  const dup = await SourceListMaster.findOne({ company: companyId, sourceListCode });
  if (dup) throw new AppError(`Source List Code "${sourceListCode}" already exists`, 409, "DUPLICATE");

  const itemRef = await resolveItemRef(companyId, data?.itemType, data?.itemId);
  const supplierRef = await resolveSupplierRef(companyId, data?.supplierId);

  const doc = await SourceListMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    sourceListCode,
    itemType: trimStr(data?.itemType),
    itemId: itemRef.itemId,
    itemCode: itemRef.itemCode,
    itemName: itemRef.itemName,
    supplierId: supplierRef.supplierId,
    supplierCode: supplierRef.supplierCode,
    supplierName: supplierRef.supplierName,
    sourceType: trimStr(data?.sourceType),
    isPreferredVendor: trimStr(data?.isPreferredVendor),
    validFrom: parseOptionalDate(data?.validFrom),
    validTo: parseOptionalDate(data?.validTo),
    status: data?.status === "Inactive" ? "Inactive" : "Active",
  });
  return doc.toObject();
}

export async function updateSourceListMaster(companyId, id, data, actorId) {
  const doc = await SourceListMaster.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Source List record not found", 404, "NOT_FOUND");

  if (data?.sourceListCode !== undefined) {
    const sourceListCode = trimStr(data.sourceListCode).toUpperCase();
    if (!sourceListCode) throw new AppError("Source List Code is required", 400, "VALIDATION_ERROR");
    const dup = await SourceListMaster.findOne({ company: companyId, sourceListCode, _id: { $ne: id } });
    if (dup) throw new AppError(`Source List Code "${sourceListCode}" already exists`, 409, "DUPLICATE");
    doc.sourceListCode = sourceListCode;
  }

  if (data?.itemType !== undefined || data?.itemId !== undefined) {
    const itemRef = await resolveItemRef(
      companyId,
      data?.itemType ?? doc.itemType,
      data?.itemId ?? doc.itemId
    );
    doc.itemType = trimStr(data?.itemType ?? doc.itemType);
    doc.itemId = itemRef.itemId;
    doc.itemCode = itemRef.itemCode;
    doc.itemName = itemRef.itemName;
  }

  if (data?.supplierId !== undefined) {
    const supplierRef = await resolveSupplierRef(companyId, data.supplierId);
    doc.supplierId = supplierRef.supplierId;
    doc.supplierCode = supplierRef.supplierCode;
    doc.supplierName = supplierRef.supplierName;
  }

  if (data?.sourceType !== undefined) doc.sourceType = trimStr(data.sourceType);
  if (data?.isPreferredVendor !== undefined) doc.isPreferredVendor = trimStr(data.isPreferredVendor);
  if (data?.validFrom !== undefined) doc.validFrom = parseOptionalDate(data.validFrom);
  if (data?.validTo !== undefined) doc.validTo = parseOptionalDate(data.validTo);
  if (data?.status !== undefined) doc.status = data.status === "Inactive" ? "Inactive" : "Active";

  doc.updatedBy = actorId;
  await doc.save();
  return doc.toObject();
}

export async function deleteSourceListMaster(companyId, id) {
  const doc = await SourceListMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Source List record not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
