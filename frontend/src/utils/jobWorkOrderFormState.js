import { computeJwoValue, normalizeJwoLine } from "./jwoCalculations.js";

export const JWO_LIST_PATH = "purchase/job-work/generate-jwo";

export const JWO_TYPE_OPTIONS = [
  { value: "Standard", label: "Standard" },
  { value: "Rework", label: "Rework" },
  { value: "Subcontract", label: "Subcontract" },
];

export function emptyJwoTerms() {
  const today = new Date();
  const validity = new Date(today);
  validity.setMonth(validity.getMonth() + 1);
  return {
    shipToLocationId: "",
    shipToLocationLabel: "",
    modeOfTransport: "",
    freightTerms: "",
    transporterId: "",
    transporterName: "",
    paymentTerms: "",
    jwoValidity: validity.toISOString().slice(0, 10),
  };
}

let lineKeySeq = 0;
export function nextJwoLineKey() {
  lineKeySeq += 1;
  return `jwo-line-${lineKeySeq}`;
}

export function emptyJwoLineFromItem(item = {}) {
  const normalized = normalizeJwoLine(
    {
      jwiId: item._id || item.id,
      jwiNo: item.itemNo || "",
      jwiItemName: item.itemName || "",
      jwiItemDescription: item.itemDescription || "",
      serviceDescription: "",
      sacCode: item.hsnCode || "",
      uom: item.uom || "",
      gstRate: Number(item.gstRate) || 0,
      qty: 1,
      rate: 0,
    },
    0
  );
  return { key: nextJwoLineKey(), ...normalized, scheduleDate: "" };
}

export function emptyJobWorkOrderForm() {
  const today = new Date();
  return {
    jwoNo: "",
    jwoDate: today.toISOString().slice(0, 10),
    jwoType: "Standard",
    jobWorkerId: "",
    jobWorkerCode: "",
    jobWorkerName: "",
    orderReferenceNo: "",
    currency: "INR",
    locationId: "",
    jwoRemarks: "",
    jwoTerms: emptyJwoTerms(),
    lines: [],
  };
}

export function jobWorkOrderDocToForm(doc) {
  const terms = { ...emptyJwoTerms(), ...(doc.jwoTerms || {}) };
  if (doc.jwoValidity) {
    terms.jwoValidity = new Date(doc.jwoValidity).toISOString().slice(0, 10);
  }
  const lines = (doc.lines || []).map((row, i) => {
    const normalized = normalizeJwoLine(row, i);
    const schedule = row.scheduleDate
      ? new Date(row.scheduleDate).toISOString().slice(0, 10)
      : "";
    return { key: nextJwoLineKey(), ...normalized, scheduleDate: schedule };
  });
  return {
    jwoNo: doc.jwoNo || "",
    jwoDate: doc.jwoDate ? new Date(doc.jwoDate).toISOString().slice(0, 10) : "",
    jwoType: doc.jwoType || "Standard",
    jobWorkerId: doc.jobWorkerId ? String(doc.jobWorkerId) : "",
    jobWorkerCode: doc.jobWorkerCode || "",
    jobWorkerName: doc.jobWorkerName || "",
    orderReferenceNo: doc.orderReferenceNo || "",
    currency: doc.currency || "INR",
    locationId: doc.locationId ? String(doc.locationId) : "",
    jwoRemarks: doc.jwoRemarks || "",
    jwoTerms: terms,
    lines,
  };
}

export function jobWorkOrderFormToPayload(form) {
  const terms = form.jwoTerms || emptyJwoTerms();
  return {
    jwoDate: form.jwoDate,
    jwoType: form.jwoType,
    jobWorkerId: form.jobWorkerId,
    orderReferenceNo: form.orderReferenceNo,
    currency: form.currency,
    locationId: form.locationId,
    jwoRemarks: form.jwoRemarks,
    jwoValidity: terms.jwoValidity,
    paymentTerms: terms.paymentTerms,
    jwoTerms: terms,
    lines: form.lines.map((row) => ({
      jwiId: row.jwiId,
      jwiNo: row.jwiNo,
      jwiItemName: row.jwiItemName,
      jwiItemDescription: row.jwiItemDescription,
      serviceDescription: row.serviceDescription,
      sacCode: row.sacCode,
      uom: row.uom,
      gstRate: row.gstRate,
      qty: row.qty,
      rate: row.rate,
      scheduleDate: row.scheduleDate || undefined,
    })),
  };
}

export function computeFormJwoValue(form) {
  return computeJwoValue(form.lines || []);
}
