import { computeSpoValue, normalizeSpoLine } from "./spoCalculations.js";

export const SPO_LIST_PATH = "purchase/service-po/generate-spo";
export const AMEND_SPO_LIST_PATH = "purchase/service-po/amend-spo";
export const CANCEL_SPO_LIST_PATH = "purchase/service-po/cancel-spo";
export const SPO_CATEGORY_OPTIONS = [
  { value: "Domestic", label: "Domestic" },
  { value: "Import", label: "Import" },
];

let lineKeySeq = 0;
export function nextSpoLineKey() {
  lineKeySeq += 1;
  return `spo-line-${lineKeySeq}`;
}

export function emptySpoLineFromService(svc = {}) {
  const rate = Number(svc.rate) || 0;
  const normalized = normalizeSpoLine(
    {
      serviceId: svc._id || svc.id,
      serviceNo: svc.serviceNo || "",
      sacCode: svc.sacCode || "",
      description: svc.serviceDescription || svc.description || "",
      serviceDetails: "",
      gstRate: Number(svc.gstRate) || 0,
      qty: 1,
      rate,
      discPercent: 0,
    },
    0
  );
  return {
    key: nextSpoLineKey(),
    ...normalized,
    serviceScheduleDate: "",
  };
}

export function emptyServicePurchaseOrderForm() {
  const today = new Date();
  const validity = new Date(today);
  validity.setMonth(validity.getMonth() + 1);
  return {
    spoNo: "",
    spoDate: today.toISOString().slice(0, 10),
    serviceCategory: "Domestic",
    serviceProviderId: "",
    serviceProviderName: "",
    orderReferenceNo: "",
    currency: "INR",
    locationId: "",
    spoRemarks: "",
    spoValidity: validity.toISOString().slice(0, 10),
    paymentTerms: "",
    lines: [],
  };
}

export function servicePurchaseOrderDocToForm(doc) {
  const lines = (doc.lines || []).map((row, i) => {
    const normalized = normalizeSpoLine(row, i);
    const schedule = row.serviceScheduleDate
      ? new Date(row.serviceScheduleDate).toISOString().slice(0, 10)
      : "";
    return { key: nextSpoLineKey(), ...normalized, serviceScheduleDate: schedule };
  });
  return {
    spoNo: doc.spoNo || "",
    spoDate: doc.spoDate ? new Date(doc.spoDate).toISOString().slice(0, 10) : "",
    serviceCategory: doc.serviceCategory || "Domestic",
    serviceProviderId: doc.serviceProviderId ? String(doc.serviceProviderId) : "",
    serviceProviderName: doc.serviceProviderName || "",
    orderReferenceNo: doc.orderReferenceNo || "",
    currency: doc.currency || "INR",
    locationId: doc.locationId ? String(doc.locationId) : "",
    spoRemarks: doc.spoRemarks || "",
    spoValidity: doc.spoValidity ? new Date(doc.spoValidity).toISOString().slice(0, 10) : "",
    paymentTerms: doc.paymentTerms || "",
    lines,
  };
}

export function servicePurchaseOrderFormToPayload(form) {
  return {
    spoDate: form.spoDate,
    serviceCategory: form.serviceCategory,
    serviceProviderId: form.serviceProviderId,
    orderReferenceNo: form.orderReferenceNo,
    currency: form.currency,
    locationId: form.locationId,
    spoRemarks: form.spoRemarks,
    spoValidity: form.spoValidity,
    paymentTerms: form.paymentTerms,
    lines: form.lines.map((row) => ({
      serviceId: row.serviceId,
      serviceNo: row.serviceNo,
      sacCode: row.sacCode,
      description: row.description,
      serviceDetails: row.serviceDetails,
      gstRate: row.gstRate,
      qty: row.qty,
      rate: row.rate,
      discPercent: row.discPercent,
      serviceScheduleDate: row.serviceScheduleDate || undefined,
    })),
  };
}

export function computeFormSpoValue(form) {
  const lines = form.lines.map((row, i) => normalizeSpoLine(row, i));
  return computeSpoValue(lines);
}
