import { ACTIVE_INACTIVE_OPTIONS } from "../config/mpbcdcMasterOptions.js";

export { ACTIVE_INACTIVE_OPTIONS };

export function emptyVendorEvaluationForm() {
  return {
    evaluationCode: "",
    supplierId: "",
    supplierCode: "",
    supplierName: "",
    priceWeight: "25",
    deliveryWeight: "25",
    qualityWeight: "25",
    complianceWeight: "25",
    minimumScore: "",
    status: "Active",
  };
}

export function vendorEvaluationDocToForm(doc) {
  if (!doc) return emptyVendorEvaluationForm();
  return {
    evaluationCode: doc.evaluationCode ?? "",
    supplierId: doc.supplierId != null ? String(doc.supplierId) : "",
    supplierCode: doc.supplierCode ?? "",
    supplierName: doc.supplierName ?? "",
    priceWeight: String(doc.priceWeight ?? 25),
    deliveryWeight: String(doc.deliveryWeight ?? 25),
    qualityWeight: String(doc.qualityWeight ?? 25),
    complianceWeight: String(doc.complianceWeight ?? 25),
    minimumScore: doc.minimumScore != null ? String(doc.minimumScore) : "",
    status: doc.status || "Active",
  };
}

export function vendorEvaluationFormToPayload(form) {
  return {
    evaluationCode: form.evaluationCode?.trim().toUpperCase(),
    supplierId: form.supplierId || undefined,
    priceWeight: Number(form.priceWeight || 25),
    deliveryWeight: Number(form.deliveryWeight || 25),
    qualityWeight: Number(form.qualityWeight || 25),
    complianceWeight: Number(form.complianceWeight || 25),
    minimumScore: form.minimumScore === "" ? 0 : Number(form.minimumScore),
    status: form.status || "Active",
  };
}
