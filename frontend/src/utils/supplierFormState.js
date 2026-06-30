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

export const EMPTY_BANK = {
  befName: "",
  bankName: "",
  accountNumber: "",
  accountType: "",
  bankSwiftCode: "",
};

export const EMPTY_GOV_PROCUREMENT = {
  vendorType: "",
  gemRegistered: "",
  gemRegistrationNumber: "",
  vendorRegistrationDate: "",
  vendorClassification: "",
  msmeEligible: "",
  womenOwnedEnterprise: "",
  startupRegistered: "",
};

export const EMPTY_VENDOR_COMPLIANCE = {
  panVerified: "",
  gstVerified: "",
  bankVerified: "",
  complianceStatus: "Draft",
  lastComplianceReview: "",
  reviewDueDate: "",
  approvedBy: "",
  approvalDate: "",
};

export const EMPTY_VENDOR_PERFORMANCE = {
  vendorScore: 0,
  deliveryRating: 0,
  qualityRating: 0,
  overallRating: 0,
};

function formatDateForInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function parseOptionalDate(val) {
  const text = String(val ?? "").trim();
  if (!text) return null;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapGovProcurement(doc) {
  const g = doc?.govProcurement || {};
  return {
    vendorType: g.vendorType ?? "",
    gemRegistered: g.gemRegistered ?? "",
    gemRegistrationNumber: g.gemRegistrationNumber ?? "",
    vendorRegistrationDate: formatDateForInput(g.vendorRegistrationDate),
    vendorClassification: g.vendorClassification ?? "",
    msmeEligible: g.msmeEligible ?? "",
    womenOwnedEnterprise: g.womenOwnedEnterprise ?? "",
    startupRegistered: g.startupRegistered ?? "",
  };
}

function mapVendorCompliance(doc) {
  const c = doc?.vendorCompliance || {};
  return {
    panVerified: c.panVerified ?? "",
    gstVerified: c.gstVerified ?? "",
    bankVerified: c.bankVerified ?? "",
    complianceStatus: c.complianceStatus ?? "Draft",
    lastComplianceReview: formatDateForInput(c.lastComplianceReview),
    reviewDueDate: formatDateForInput(c.reviewDueDate),
    approvedBy: c.approvedBy ?? "",
    approvalDate: formatDateForInput(c.approvalDate),
  };
}

function mapVendorPerformance(doc) {
  const p = doc?.vendorPerformance || {};
  return {
    vendorScore: Number(p.vendorScore ?? 0) || 0,
    deliveryRating: Number(p.deliveryRating ?? 0) || 0,
    qualityRating: Number(p.qualityRating ?? 0) || 0,
    overallRating: Number(p.overallRating ?? 0) || 0,
  };
}

function govProcurementToPayload(gov) {
  const g = gov || {};
  return {
    vendorType: String(g.vendorType ?? "").trim(),
    gemRegistered: String(g.gemRegistered ?? "").trim(),
    gemRegistrationNumber: String(g.gemRegistrationNumber ?? "").trim(),
    vendorRegistrationDate: parseOptionalDate(g.vendorRegistrationDate),
    vendorClassification: String(g.vendorClassification ?? "").trim(),
    msmeEligible: String(g.msmeEligible ?? "").trim(),
    womenOwnedEnterprise: String(g.womenOwnedEnterprise ?? "").trim(),
    startupRegistered: String(g.startupRegistered ?? "").trim(),
  };
}

function vendorComplianceToPayload(compliance) {
  const c = compliance || {};
  return {
    panVerified: String(c.panVerified ?? "").trim(),
    gstVerified: String(c.gstVerified ?? "").trim(),
    bankVerified: String(c.bankVerified ?? "").trim(),
    complianceStatus: String(c.complianceStatus ?? "Draft").trim() || "Draft",
    lastComplianceReview: parseOptionalDate(c.lastComplianceReview),
    reviewDueDate: parseOptionalDate(c.reviewDueDate),
    approvedBy: String(c.approvedBy ?? "").trim(),
    approvalDate: parseOptionalDate(c.approvalDate),
  };
}

function vendorPerformanceToPayload(performance) {
  const p = performance || {};
  const num = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  };
  return {
    vendorScore: num(p.vendorScore),
    deliveryRating: num(p.deliveryRating),
    qualityRating: num(p.qualityRating),
    overallRating: num(p.overallRating),
  };
}

export function emptySupplierForm() {
  return {
    supplierCode: "",
    supplierName: "",
    supplierPurchaseType: "",
    isSupplierActive: "A",
    supplierCompanyType: "",
    supplierCurrency: "USD",
    supplierINCOTerms: "",
    supplierPaymentTerms: "",
    countryOfOrigin: "",
    supplierType: "",
    categoryType: "",
    supplierNickName: "",
    supplierVendorCode: "",
    supplierWebsite: "",
    supplierCIN: "",
    supplierURD: "",
    supplierMSMENo: "",
    supplierLeadTimeInDays: "",
    gstClassification: "",
    gstin: "",
    supplierBillingAddress: [{ ...EMPTY_ADDRESS }],
    supplierBankDetails: [{ ...EMPTY_BANK }],
    supplierAddress: [],
    supplierShippingAddress: [],
    supplierContactMatrix: [],
    govProcurement: { ...EMPTY_GOV_PROCUREMENT },
    vendorCompliance: { ...EMPTY_VENDOR_COMPLIANCE },
    vendorPerformance: { ...EMPTY_VENDOR_PERFORMANCE },
  };
}

/** Map stored category (module code or master-data label) to dropdown value. */
export function resolveSupplierCategoryValue(categoryType, options = []) {
  const key = String(categoryType ?? "").trim();
  if (!key) return "";
  const byValue = options.find((o) => o.value === key);
  if (byValue) return byValue.value;
  const byLabel = options.find((o) => o.label === key);
  if (byLabel) return byLabel.value;
  return key;
}

export function supplierCategoryDisplayLabel(form, options = []) {
  const key = String(form?.categoryType ?? "").trim();
  if (!key) return form?.supplierPurchaseType ?? "";
  const match = options.find((o) => o.value === key || o.label === key);
  return match?.label || form?.supplierPurchaseType || key;
}

export function supplierDocToForm(doc) {
  if (!doc) return emptySupplierForm();

  const mapAddr = (list) =>
    Array.isArray(list) && list.length
      ? list.map((a) => ({
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
      : [];

  return {
    supplierCode: doc.supplierCode ?? "",
    supplierName: doc.supplierName ?? "",
    supplierPurchaseType: doc.supplierPurchaseType ?? "",
    isSupplierActive: doc.isSupplierActive ?? "A",
    supplierCompanyType: doc.supplierCompanyType ?? "",
    supplierCurrency: doc.supplierCurrency ?? "USD",
    supplierINCOTerms: doc.supplierINCOTerms ?? "",
    supplierPaymentTerms: doc.supplierPaymentTerms ?? "",
    countryOfOrigin: doc.countryOfOrigin ?? "",
    supplierType: doc.supplierType ?? "",
    categoryType: doc.categoryType ?? "",
    supplierNickName: doc.supplierNickName ?? "",
    supplierVendorCode: doc.supplierVendorCode ?? "",
    supplierWebsite: doc.supplierWebsite ?? "",
    supplierCIN: doc.supplierCIN ?? "",
    supplierURD: doc.supplierURD ?? "",
    supplierMSMENo: doc.supplierMSMENo ?? "",
    supplierLeadTimeInDays:
      doc.supplierLeadTimeInDays === null || doc.supplierLeadTimeInDays === undefined
        ? ""
        : String(doc.supplierLeadTimeInDays),
    gstClassification: doc.gstClassification ?? "",
    gstin: doc.gstin ?? "",
    supplierBillingAddress: mapAddr(doc.supplierBillingAddress).length
      ? mapAddr(doc.supplierBillingAddress)
      : [{ ...EMPTY_ADDRESS }],
    supplierBankDetails:
      Array.isArray(doc.supplierBankDetails) && doc.supplierBankDetails.length
        ? doc.supplierBankDetails.map((b) => ({
            befName: b.befName ?? "",
            bankName: b.bankName ?? "",
            accountNumber: b.accountNumber ?? "",
            accountType: b.accountType ?? "",
            bankSwiftCode: b.bankSwiftCode ?? "",
          }))
        : [{ ...EMPTY_BANK }],
    supplierAddress: mapAddr(doc.supplierAddress),
    supplierShippingAddress: mapAddr(doc.supplierShippingAddress),
    supplierContactMatrix: Array.isArray(doc.supplierContactMatrix)
      ? doc.supplierContactMatrix.map((c) => ({
          name: c.name ?? "",
          email: c.email ?? "",
          mobile: c.mobile ?? "",
          designation: c.designation ?? "",
        }))
      : [],
    govProcurement: mapGovProcurement(doc),
    vendorCompliance: mapVendorCompliance(doc),
    vendorPerformance: mapVendorPerformance(doc),
  };
}

export function supplierFormToPayload(form) {
  return {
    supplierCode: form.supplierCode?.trim(),
    supplierName: form.supplierName?.trim(),
    supplierPurchaseType: form.supplierPurchaseType?.trim(),
    isSupplierActive: form.isSupplierActive || "A",
    supplierCompanyType: form.supplierCompanyType?.trim(),
    supplierCurrency: form.supplierCurrency?.trim() || "USD",
    supplierINCOTerms: form.supplierINCOTerms?.trim(),
    supplierPaymentTerms: form.supplierPaymentTerms?.trim(),
    countryOfOrigin: form.countryOfOrigin?.trim(),
    supplierType: form.supplierType?.trim(),
    categoryType: form.categoryType?.trim(),
    supplierNickName: form.supplierNickName?.trim(),
    supplierVendorCode: form.supplierVendorCode?.trim(),
    supplierWebsite: form.supplierWebsite?.trim(),
    supplierCIN: form.supplierCIN?.trim(),
    supplierURD: form.supplierURD?.trim(),
    supplierMSMENo: form.supplierMSMENo?.trim(),
    supplierLeadTimeInDays: form.supplierLeadTimeInDays,
    gstClassification: form.gstClassification?.trim(),
    gstin: form.gstin?.trim(),
    supplierBillingAddress: form.supplierBillingAddress,
    supplierBankDetails: form.supplierBankDetails,
    supplierAddress: form.supplierAddress,
    supplierShippingAddress: form.supplierShippingAddress,
    supplierContactMatrix: form.supplierContactMatrix,
    govProcurement: govProcurementToPayload(form.govProcurement),
    vendorCompliance: vendorComplianceToPayload(form.vendorCompliance),
    vendorPerformance: vendorPerformanceToPayload(form.vendorPerformance),
  };
}

export function buildSupplierDevFillForm() {
  const suffix = String(Date.now()).slice(-4);
  return {
    ...emptySupplierForm(),
    supplierCode: "",
    supplierName: "Dev Test Supplier Ltd",
    supplierPurchaseType: "Imports Goods Manufacturer",
    categoryType: "IGM",
    isSupplierActive: "A",
    supplierCompanyType: "PVT LTD",
    supplierCurrency: "USD",
    supplierINCOTerms: "EXW – Ex-Warehouse",
    supplierPaymentTerms: "100% Advance",
    supplierType: "Manufacturer",
    supplierBillingAddress: [
      {
        line1: "123 Demo Street",
        line2: "Industrial Area",
        line3: "",
        line4: "",
        state: "California",
        city: "San Jose",
        district: "",
        pinCode: "95110",
        country: "United States",
        zone: "",
      },
    ],
    supplierBankDetails: [
      {
        befName: "Dev Test Supplier Ltd",
        bankName: "Demo International Bank",
        accountNumber: "1234567890",
        accountType: "Current",
        bankSwiftCode: "DEMOUS33",
      },
    ],
  };
}
