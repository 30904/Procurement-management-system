import { EMPTY_LOGISTICS_MPBCDC } from "../config/mpbcdcMasterOptions.js";

export const EMPTY_ADDRESS = {
  line1: "",
  line2: "",
  line3: "",
  line4: "",
  state: "",
  city: "",
  district: "",
  pinCode: "",
  country: "",
  zone: "",
};

export const EMPTY_CONTACT = {
  name: "",
  department: "",
  designation: "",
  mobile: "",
  email: "",
};

export const EMPTY_BANK = {
  befName: "",
  bankName: "",
  accountType: "",
  accountNumber: "",
  ifsCode: "",
  bankSwiftCode: "",
};

export const EMPTY_VEHICLE = {
  vehicleNo: "",
};

function mapLogisticsMpbcdc(doc) {
  const l = doc?.mpbcdcLogistics || {};
  return {
    transportCategory: l.transportCategory ?? "",
    serviceCoverage: l.serviceCoverage ?? "",
    gemRegistered: l.gemRegistered ?? "",
    approvalStatus: l.approvalStatus ?? "Draft",
  };
}

export function emptyLogisticsForm() {
  return {
    lspCode: "",
    categoryType: "",
    lspNameLegalEntity: "",
    lspNickName: "",
    gstClassification: "",
    gstin: "",
    lspCIN: "",
    rcmApplicability: "",
    lspCurrency: "INR",
    lspPaymentTerms: "",
    freightServiceType: "",
    isLspActive: "A",
    lspAddress: [{ ...EMPTY_ADDRESS }],
    lspContactMatrix: [],
    lspBankDetails: [],
    lspVehicleDetails: [],
    mpbcdcLogistics: { ...EMPTY_LOGISTICS_MPBCDC },
  };
}

export function resolveLogisticsCategoryValue(categoryType, options = []) {
  const key = String(categoryType ?? "").trim();
  if (!key) return "";
  const byValue = options.find((o) => o.value === key);
  if (byValue) return byValue.value;
  const byLabel = options.find((o) => o.label === key);
  if (byLabel) return byLabel.value;
  return key;
}

export function logisticsCategoryDisplayLabel(form, options = []) {
  const key = String(form?.categoryType ?? "").trim();
  if (!key) return "";
  const match = options.find((o) => o.value === key || o.label === key);
  return match?.label || key;
}

export function logisticsDocToForm(doc) {
  if (!doc) return emptyLogisticsForm();
  return {
    lspCode: doc.lspCode ?? "",
    categoryType: doc.categoryType ?? "",
    lspNameLegalEntity: doc.lspNameLegalEntity ?? "",
    lspNickName: doc.lspNickName ?? "",
    gstClassification: doc.gstClassification ?? "",
    gstin: doc.gstin ?? "",
    lspCIN: doc.lspCIN ?? "",
    rcmApplicability: doc.rcmApplicability ?? "",
    lspCurrency: doc.lspCurrency ?? "INR",
    lspPaymentTerms: doc.lspPaymentTerms ?? "",
    freightServiceType: doc.freightServiceType ?? "",
    isLspActive: doc.isLspActive ?? "A",
    lspAddress:
      Array.isArray(doc.lspAddress) && doc.lspAddress.length
        ? doc.lspAddress.map((a) => ({
            line1: a.line1 ?? "",
            line2: a.line2 ?? "",
            line3: a.line3 ?? "",
            line4: a.line4 ?? "",
            state: a.state ?? "",
            city: a.city ?? "",
            district: a.district ?? "",
            pinCode: a.pinCode ?? "",
            country: a.country ?? "",
            zone: a.zone ?? "",
          }))
        : [{ ...EMPTY_ADDRESS }],
    lspContactMatrix: Array.isArray(doc.lspContactMatrix)
      ? doc.lspContactMatrix.map((c) => ({
          name: c.name ?? "",
          department: c.department ?? "",
          designation: c.designation ?? "",
          mobile: c.mobile ?? "",
          email: c.email ?? "",
        }))
      : [],
    lspBankDetails: Array.isArray(doc.lspBankDetails)
      ? doc.lspBankDetails.map((b) => ({
          befName: b.befName ?? "",
          bankName: b.bankName ?? "",
          accountType: b.accountType ?? "",
          accountNumber: b.accountNumber ?? "",
          ifsCode: b.ifsCode ?? "",
          bankSwiftCode: b.bankSwiftCode ?? "",
        }))
      : [],
    lspVehicleDetails: Array.isArray(doc.lspVehicleDetails)
      ? doc.lspVehicleDetails.map((v) => ({ vehicleNo: v.vehicleNo ?? "" }))
      : [],
    mpbcdcLogistics: mapLogisticsMpbcdc(doc),
  };
}

export function logisticsFormToPayload(form) {
  return {
    lspCode: form.lspCode?.trim(),
    categoryType: form.categoryType?.trim(),
    lspNameLegalEntity: form.lspNameLegalEntity?.trim(),
    lspNickName: form.lspNickName?.trim(),
    gstClassification: form.gstClassification?.trim(),
    gstin: form.gstin?.trim(),
    lspCIN: form.lspCIN?.trim(),
    rcmApplicability: form.rcmApplicability?.trim(),
    lspCurrency: form.lspCurrency?.trim() || "INR",
    lspPaymentTerms: form.lspPaymentTerms?.trim(),
    freightServiceType: form.freightServiceType?.trim(),
    isLspActive: form.isLspActive || "A",
    lspAddress: form.lspAddress,
    lspContactMatrix: form.lspContactMatrix,
    lspBankDetails: form.lspBankDetails,
    lspVehicleDetails: form.lspVehicleDetails,
    mpbcdcLogistics: {
      transportCategory: form.mpbcdcLogistics?.transportCategory?.trim() || "",
      serviceCoverage: form.mpbcdcLogistics?.serviceCoverage?.trim() || "",
      gemRegistered: form.mpbcdcLogistics?.gemRegistered?.trim() || "",
      approvalStatus: form.mpbcdcLogistics?.approvalStatus?.trim() || "Draft",
    },
  };
}
