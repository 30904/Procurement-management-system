import { ProspectSupplierMaster } from "../models/ProspectSupplierMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { allocateNextCode, previewNextCode } from "./autoIncrement.service.js";
import { createSupplierMaster } from "./supplierMaster.service.js";
import {
  resolveSupplierCategoryLabel,
  resolveSupplierCategoryModule,
} from "../utils/supplierCategoryModule.js";

const VRN_MODULE = "VRN";

function trimStr(val) {
  return val === undefined || val === null ? "" : String(val).trim();
}

function normalizeAddressList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    line1: trimStr(row?.line1),
    line2: trimStr(row?.line2),
    line3: trimStr(row?.line3),
    line4: trimStr(row?.line4),
    state: trimStr(row?.state),
    city: trimStr(row?.city),
    district: trimStr(row?.district),
    pinCode: trimStr(row?.pinCode),
    country: trimStr(row?.country),
    zone: trimStr(row?.zone),
  }));
}

function normalizeContactList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    name: trimStr(row?.name),
    department: trimStr(row?.department),
    email: trimStr(row?.email),
    mobile: trimStr(row?.mobile),
    designation: trimStr(row?.designation),
  }));
}

function parseRegistrationDate(value) {
  if (!value) throw new AppError("Registration Date is required", 400, "VALIDATION_ERROR");
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError("Invalid registration date", 400, "VALIDATION_ERROR");
  }
  return d;
}

function normalizePayload(data) {
  const assessmentStatus = trimStr(data?.assessmentStatus) || "Pending";
  const allowed = ["Pending", "In Review", "Approved", "Rejected"];
  return {
    registrationDate: data?.registrationDate ? parseRegistrationDate(data.registrationDate) : undefined,
    categoryType: trimStr(data?.categoryType),
    supplierName: trimStr(data?.supplierName),
    gstClassification: trimStr(data?.gstClassification),
    gstin: trimStr(data?.gstin),
    supplierPaymentTerms: trimStr(data?.supplierPaymentTerms),
    isSupplierActive: trimStr(data?.isSupplierActive) || "A",
    supplierBillingAddress: normalizeAddressList(data?.supplierBillingAddress),
    supplierContactMatrix: normalizeContactList(data?.supplierContactMatrix),
    assessmentStatus: allowed.includes(assessmentStatus) ? assessmentStatus : "Pending",
    assessmentNotes: trimStr(data?.assessmentNotes),
    assessedBy: trimStr(data?.assessedBy),
    assessedAt: data?.assessedAt ? new Date(data.assessedAt) : undefined,
  };
}

function validateProspectPayload(payload, { isCreate }) {
  if (isCreate && !payload.registrationDate) {
    throw new AppError("Registration Date is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.supplierName) {
    throw new AppError("Supplier Name is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.gstClassification) {
    throw new AppError("GST Classification is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.gstin) {
    throw new AppError("GSTIN is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.supplierPaymentTerms) {
    throw new AppError("Payment Terms is required", 400, "VALIDATION_ERROR");
  }
  const billing = payload.supplierBillingAddress?.[0];
  if (!billing?.country) throw new AppError("Country is required", 400, "VALIDATION_ERROR");
  if (!billing?.state) throw new AppError("State/Province is required", 400, "VALIDATION_ERROR");
  if (!billing?.city) throw new AppError("City/District is required", 400, "VALIDATION_ERROR");
  if (!billing?.pinCode) throw new AppError("Pin Code is required", 400, "VALIDATION_ERROR");
  if (!billing?.line1) throw new AppError("Address Line 1 is required", 400, "VALIDATION_ERROR");
}

export async function previewRegistrationNo(companyId) {
  const preview = await previewNextCode(companyId, VRN_MODULE);
  return { registrationNo: preview.code };
}

export async function listProspectSuppliers(companyId) {
  return ProspectSupplierMaster.find({ company: companyId })
    .sort({ registrationDate: -1, registrationNo: -1 })
    .lean();
}

export async function getProspectSupplier(companyId, id) {
  const doc = await ProspectSupplierMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Prospect supplier not found", 404, "NOT_FOUND");
  return doc;
}

export async function createProspectSupplier(companyId, data, actorId) {
  const payload = normalizePayload(data);
  validateProspectPayload(payload, { isCreate: true });

  const registrationNo = await allocateNextCode(companyId, VRN_MODULE);
  const existing = await ProspectSupplierMaster.findOne({ company: companyId, registrationNo });
  if (existing) {
    throw new AppError(`Registration No. "${registrationNo}" already exists`, 409, "DUPLICATE");
  }

  const doc = await ProspectSupplierMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    registrationNo,
    registrationDate: payload.registrationDate,
    categoryType: payload.categoryType,
    supplierName: payload.supplierName,
    gstClassification: payload.gstClassification,
    gstin: payload.gstin,
    supplierPaymentTerms: payload.supplierPaymentTerms,
    isSupplierActive: payload.isSupplierActive,
    supplierBillingAddress: payload.supplierBillingAddress,
    supplierContactMatrix: payload.supplierContactMatrix,
    assessmentStatus: payload.assessmentStatus,
    assessmentNotes: payload.assessmentNotes,
    assessedBy: payload.assessedBy,
    assessedAt: payload.assessedAt,
  });

  return doc.toObject();
}

export async function updateProspectSupplier(companyId, id, data, actorId) {
  const doc = await ProspectSupplierMaster.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Prospect supplier not found", 404, "NOT_FOUND");

  const payload = normalizePayload({ ...doc.toObject(), ...data });
  validateProspectPayload(payload, { isCreate: false });

  Object.assign(doc, {
    ...payload,
    registrationNo: doc.registrationNo,
    registrationDate: payload.registrationDate || doc.registrationDate,
    updatedBy: actorId,
  });
  await doc.save();
  return doc.toObject();
}

export async function deleteProspectSupplier(companyId, id) {
  const doc = await ProspectSupplierMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Prospect supplier not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}

function prospectToSupplierPayload(prospect) {
  const billing = prospect.supplierBillingAddress?.[0] || {};
  return {
    categoryType: prospect.categoryType,
    supplierName: prospect.supplierName,
    gstClassification: prospect.gstClassification,
    gstin: prospect.gstin,
    supplierPaymentTerms: prospect.supplierPaymentTerms,
    isSupplierActive: prospect.isSupplierActive || "A",
    supplierBillingAddress: prospect.supplierBillingAddress,
    supplierContactMatrix: prospect.supplierContactMatrix,
    supplierCurrency: "INR",
    supplierINCOTerms: "EXW – Ex-Warehouse",
    supplierCompanyType: "PVT LTD",
    supplierType: "Manufacturer",
    countryOfOrigin: billing.country || "",
    supplierCIN: prospect.gstin?.slice(2, 12) || "",
    supplierMSMENo: "",
    supplierNickName: "",
    supplierBankDetails: [],
    supplierShippingAddress: [],
  };
}

export async function convertProspectToSupplier(companyId, id, actorId) {
  const prospect = await ProspectSupplierMaster.findOne({ _id: id, company: companyId });
  if (!prospect) throw new AppError("Prospect supplier not found", 404, "NOT_FOUND");

  if (!prospect.categoryType?.trim()) {
    throw new AppError(
      "Supplier Category is required before conversion. Edit the prospect and select a category.",
      400,
      "VALIDATION_ERROR"
    );
  }

  const moduleKey = await resolveSupplierCategoryModule(companyId, prospect.categoryType);
  if (!moduleKey) {
    throw new AppError("Invalid Supplier Category for conversion", 400, "VALIDATION_ERROR");
  }

  const supplierPayload = prospectToSupplierPayload(prospect.toObject());
  const categoryLabel = await resolveSupplierCategoryLabel(companyId, prospect.categoryType);
  supplierPayload.categoryType = categoryLabel || prospect.categoryType;
  supplierPayload.supplierPurchaseType = categoryLabel || prospect.categoryType;

  const supplier = await createSupplierMaster(companyId, supplierPayload, actorId);
  await ProspectSupplierMaster.deleteOne({ _id: prospect._id, company: companyId });

  return {
    prospectRegistrationNo: prospect.registrationNo,
    supplier,
  };
}
