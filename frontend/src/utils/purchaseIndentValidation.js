import { computeIndentTotalQty } from "./purchaseIndentFormState.js";

export function createEmptyPurchaseIndentValidation() {
  return {
    hasErrors: false,
    summary: [],
    indentDate: "",
    department: "",
    requestedBy: "",
    linesGeneral: "",
  };
}

export function validatePurchaseIndentForm(form, { activeLocationId } = {}) {
  const errors = createEmptyPurchaseIndentValidation();
  const summary = [];

  if (!activeLocationId) {
    summary.push("Select a working location in the header.");
  }
  if (!String(form.indentNo ?? "").trim()) {
    summary.push("Indent number is required.");
  }
  if (!form.indentDate) {
    errors.indentDate = "Indent date is required.";
    summary.push("Indent date is required.");
  }
  if (!String(form.department ?? "").trim()) {
    errors.department = "Department is required.";
    summary.push("Department is required.");
  }
  if (!String(form.requestedBy ?? "").trim()) {
    errors.requestedBy = "Requested by is required.";
    summary.push("Requested by is required.");
  }

  const linesWithQty = (form.lines || []).filter((row) => Number(row.qty) > 0);
  if (!linesWithQty.length) {
    errors.linesGeneral = "Enter quantity on at least one line.";
    summary.push("At least one line with quantity is required.");
  } else {
    for (const row of linesWithQty) {
      const label = row.itemNo || row.itemName || "line";
      if (!Number.isFinite(Number(row.qty)) || Number(row.qty) <= 0) {
        errors.linesGeneral = `Invalid quantity on ${label}.`;
        summary.push(`Invalid quantity on ${label}.`);
        break;
      }
    }
  }

  errors.summary = summary;
  errors.hasErrors = summary.length > 0;
  return errors;
}

export function hasIndentLineQty(row) {
  return Number(row?.qty) > 0;
}

export { computeIndentTotalQty };
