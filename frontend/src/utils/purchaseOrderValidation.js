import { primaryEddFromSchedules } from "./purchaseOrderFormState.js";

export function hasLineQtyEntered(row) {
  const qty = Number(String(row.qty ?? "").trim());
  return Number.isFinite(qty) && qty > 0;
}

/** Supplier catalogue row or line removed from PO (qty blank or zero). */
export function isLineExcludedFromPo(row) {
  const qtyRaw = String(row.qty ?? "").trim();
  if (!qtyRaw) return true;
  const qtyNum = Number(qtyRaw);
  return qtyNum === 0;
}

export function lineHasEdd(row) {
  if (String(row.edd ?? "").trim()) return true;
  return Boolean(primaryEddFromSchedules(row.eddSchedules));
}

export function createEmptyPurchaseOrderValidation() {
  return {
    poNo: "",
    supplierName: "",
    poType: "",
    poDate: "",
    location: "",
    shipToLocation: "",
    linesGeneral: "",
    lineByKey: {},
    summary: [],
    hasErrors: false,
  };
}

/**
 * Client-side validation before save (header, terms, and line rules).
 */
export function validatePurchaseOrderForm(form, { activeLocationId, isBlanketPo } = {}) {
  const errors = createEmptyPurchaseOrderValidation();
  const summary = [];

  if (!String(form.poNo ?? "").trim()) {
    errors.poNo = "PO number is not available. Check location and auto-increment setup.";
    summary.push("PO number missing.");
  }
  if (!form.supplierId) {
    errors.supplierName = "Supplier is required.";
    summary.push("Select supplier.");
  }
  if (!form.poType?.trim()) {
    errors.poType = "PO Type is required.";
    summary.push("Select PO Type.");
  }
  if (!form.poDate) {
    errors.poDate = "PO Date is required.";
    summary.push("Select PO Date.");
  } else {
    const d = new Date(form.poDate);
    if (Number.isNaN(d.getTime())) {
      errors.poDate = "PO Date is invalid.";
      summary.push("Invalid PO Date.");
    }
  }
  if (!activeLocationId) {
    errors.location = "Active location is required (use header location).";
    summary.push("Select active location.");
  }
  if (!form.poTerms?.shipToLocation?.trim() && !form.poTerms?.shipToLocationId) {
    errors.shipToLocation = "Ship-To location is required in PO Terms.";
    summary.push("Add Ship-To location in PO Terms.");
  }

  const lineByKey = {};
  const lines = Array.isArray(form.lines) ? form.lines : [];
  if (!form.supplierId) {
    errors.linesGeneral = errors.linesGeneral || "Select a supplier to load items.";
  } else if (!lines.length) {
    errors.linesGeneral = "No materials are linked to this supplier.";
    summary.push("Load supplier items.");
  }

  let hasPositiveQty = false;
  for (const row of lines) {
    if (isLineExcludedFromPo(row)) continue;

    const rowErrors = {};
    const qtyRaw = String(row.qty ?? "").trim();
    const rateRaw = String(row.rate ?? "").trim();
    const qtyNum = Number(qtyRaw);
    const rateNum = Number(rateRaw);
    const rateProvided = rateRaw !== "";
    const qtyPositive = Number.isFinite(qtyNum) && qtyNum > 0;
    const ratePositive = rateProvided && Number.isFinite(rateNum) && rateNum > 0;

    hasPositiveQty = true;

    if (!qtyPositive) {
      rowErrors.qty = "Qty must be greater than 0.";
    }
    if (rateProvided && (!Number.isFinite(rateNum) || rateNum <= 0)) {
      rowErrors.rate = "Rate must be greater than 0.";
    }
    if (qtyPositive && !ratePositive) {
      rowErrors.rate = "Rate is required when qty is entered.";
    }
    if (!isBlanketPo && qtyPositive && !lineHasEdd(row)) {
      rowErrors.edd = "EDD is required for lines with quantity.";
    }

    if (Object.keys(rowErrors).length) {
      lineByKey[row.key] = rowErrors;
    }
  }

  if (form.supplierId && lines.length && !hasPositiveQty) {
    errors.linesGeneral = "Enter PO Qty for at least one line item.";
    summary.push("Enter PO Qty on item lines.");
  }

  errors.lineByKey = lineByKey;
  errors.summary = summary;
  errors.hasErrors = Boolean(
    errors.poNo ||
      errors.supplierName ||
      errors.poType ||
      errors.poDate ||
      errors.location ||
      errors.shipToLocation ||
      errors.linesGeneral ||
      Object.keys(lineByKey).length
  );
  return errors;
}
