import { VendorEvaluationMaster } from "../models/VendorEvaluationMaster.model.js";
import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { trimStr } from "../utils/mpbcdcMasterFields.js";

const CODE_PREFIX = "VE";
const CODE_DIGITS = 4;

function parseWeight(val, fallback = 25) {
  const n = Number(val);
  if (Number.isNaN(n) || n < 0) return fallback;
  return Math.min(100, Math.round(n * 100) / 100);
}

export async function getNextEvaluationCode(companyId) {
  const regex = new RegExp(`^${CODE_PREFIX}\\d{${CODE_DIGITS}}$`, "i");
  const latest = await VendorEvaluationMaster.findOne({ company: companyId, evaluationCode: regex })
    .sort({ evaluationCode: -1 })
    .select({ evaluationCode: 1 })
    .lean();
  let nextNum = 1;
  if (latest?.evaluationCode) {
    const suffix = Number(String(latest.evaluationCode).slice(CODE_PREFIX.length));
    if (Number.isFinite(suffix)) nextNum = suffix + 1;
  }
  return `${CODE_PREFIX}${String(nextNum).padStart(CODE_DIGITS, "0")}`;
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

export async function listVendorEvaluationMasters(companyId) {
  return VendorEvaluationMaster.find({ company: companyId }).sort({ evaluationCode: 1 }).lean();
}

export async function getVendorEvaluationMaster(companyId, id) {
  const doc = await VendorEvaluationMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Vendor Evaluation record not found", 404, "NOT_FOUND");
  return doc;
}

export async function createVendorEvaluationMaster(companyId, data, actorId) {
  const evaluationCode = trimStr(data?.evaluationCode).toUpperCase();
  if (!evaluationCode) throw new AppError("Evaluation Code is required", 400, "VALIDATION_ERROR");

  const dup = await VendorEvaluationMaster.findOne({ company: companyId, evaluationCode });
  if (dup) throw new AppError(`Evaluation Code "${evaluationCode}" already exists`, 409, "DUPLICATE");

  const supplierRef = await resolveSupplierRef(companyId, data?.supplierId);

  const doc = await VendorEvaluationMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    evaluationCode,
    supplierId: supplierRef.supplierId,
    supplierCode: supplierRef.supplierCode,
    supplierName: supplierRef.supplierName,
    priceWeight: parseWeight(data?.priceWeight, 25),
    deliveryWeight: parseWeight(data?.deliveryWeight, 25),
    qualityWeight: parseWeight(data?.qualityWeight, 25),
    complianceWeight: parseWeight(data?.complianceWeight, 25),
    minimumScore: parseWeight(data?.minimumScore, 0),
    status: data?.status === "Inactive" ? "Inactive" : "Active",
  });
  return doc.toObject();
}

export async function updateVendorEvaluationMaster(companyId, id, data, actorId) {
  const doc = await VendorEvaluationMaster.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Vendor Evaluation record not found", 404, "NOT_FOUND");

  if (data?.evaluationCode !== undefined) {
    const evaluationCode = trimStr(data.evaluationCode).toUpperCase();
    if (!evaluationCode) throw new AppError("Evaluation Code is required", 400, "VALIDATION_ERROR");
    const dup = await VendorEvaluationMaster.findOne({ company: companyId, evaluationCode, _id: { $ne: id } });
    if (dup) throw new AppError(`Evaluation Code "${evaluationCode}" already exists`, 409, "DUPLICATE");
    doc.evaluationCode = evaluationCode;
  }

  if (data?.supplierId !== undefined) {
    const supplierRef = await resolveSupplierRef(companyId, data.supplierId);
    doc.supplierId = supplierRef.supplierId;
    doc.supplierCode = supplierRef.supplierCode;
    doc.supplierName = supplierRef.supplierName;
  }

  if (data?.priceWeight !== undefined) doc.priceWeight = parseWeight(data.priceWeight, doc.priceWeight);
  if (data?.deliveryWeight !== undefined) doc.deliveryWeight = parseWeight(data.deliveryWeight, doc.deliveryWeight);
  if (data?.qualityWeight !== undefined) doc.qualityWeight = parseWeight(data.qualityWeight, doc.qualityWeight);
  if (data?.complianceWeight !== undefined) doc.complianceWeight = parseWeight(data.complianceWeight, doc.complianceWeight);
  if (data?.minimumScore !== undefined) doc.minimumScore = parseWeight(data.minimumScore, doc.minimumScore);
  if (data?.status !== undefined) doc.status = data.status === "Inactive" ? "Inactive" : "Active";

  doc.updatedBy = actorId;
  await doc.save();
  return doc.toObject();
}

export async function deleteVendorEvaluationMaster(companyId, id) {
  const doc = await VendorEvaluationMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Vendor Evaluation record not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
