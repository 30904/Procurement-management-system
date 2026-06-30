import {
  ACTIVE_INACTIVE_OPTIONS,
  SOURCE_ITEM_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from "../config/mpbcdcMasterOptions.js";

export { SOURCE_ITEM_TYPE_OPTIONS, SOURCE_TYPE_OPTIONS, YES_NO_OPTIONS, ACTIVE_INACTIVE_OPTIONS };

function formatDateForInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function emptySourceListForm() {
  return {
    sourceListCode: "",
    itemType: "",
    itemId: "",
    itemCode: "",
    itemName: "",
    supplierId: "",
    supplierCode: "",
    supplierName: "",
    sourceType: "",
    isPreferredVendor: "",
    validFrom: "",
    validTo: "",
    status: "Active",
  };
}

export function sourceListDocToForm(doc) {
  if (!doc) return emptySourceListForm();
  return {
    sourceListCode: doc.sourceListCode ?? "",
    itemType: doc.itemType ?? "",
    itemId: doc.itemId != null ? String(doc.itemId) : "",
    itemCode: doc.itemCode ?? "",
    itemName: doc.itemName ?? "",
    supplierId: doc.supplierId != null ? String(doc.supplierId) : "",
    supplierCode: doc.supplierCode ?? "",
    supplierName: doc.supplierName ?? "",
    sourceType: doc.sourceType ?? "",
    isPreferredVendor: doc.isPreferredVendor ?? "",
    validFrom: formatDateForInput(doc.validFrom),
    validTo: formatDateForInput(doc.validTo),
    status: doc.status || "Active",
  };
}

export function sourceListFormToPayload(form) {
  return {
    sourceListCode: form.sourceListCode?.trim().toUpperCase(),
    itemType: form.itemType?.trim() || "",
    itemId: form.itemId || undefined,
    supplierId: form.supplierId || undefined,
    sourceType: form.sourceType?.trim() || "",
    isPreferredVendor: form.isPreferredVendor?.trim() || "",
    validFrom: form.validFrom || undefined,
    validTo: form.validTo || undefined,
    status: form.status || "Active",
  };
}
