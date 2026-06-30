import { AppError } from "../utils/AppError.js";
import { applyLocationFilter, assertLocationAccess } from "../utils/locationScope.js";
import { validateTransactionContext } from "../utils/locationGovernance.js";
import { allocateDocNumber, previewDocNumber } from "../utils/docNumber.js";
import { toObjectId } from "../utils/locationScope.js";

export function normalizeLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new AppError("At least one line item is required", 400, "VALIDATION_ERROR");
  }
  return lines.map((row, i) => {
    const qty = Number(row.qty);
    const rate = Number(row.rate ?? 0);
    const amount = Number.isFinite(Number(row.amount)) ? Number(row.amount) : qty * rate;
    return {
      lineNo: i + 1,
      itemId: row.itemId || undefined,
      itemNo: String(row.itemNo ?? "").trim(),
      itemName: String(row.itemName ?? "").trim(),
      description: String(row.description ?? "").trim(),
      tag: String(row.tag ?? "").trim(),
      vbp: Number(row.vbp ?? 0) || 0,
      edd: String(row.edd ?? "").trim(),
      eqt: String(row.eqt ?? "").trim(),
      uom: String(row.uom ?? "").trim(),
      qty: Number.isFinite(qty) ? qty : 0,
      rate: Number.isFinite(rate) ? rate : 0,
      amount,
      hsnCode: String(row.hsnCode ?? "").trim(),
      gstRate: Number(row.gstRate ?? 0),
    };
  });
}

export function sumLines(lines) {
  return lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
}

export function scopedListFilter(companyId, scope, field = "locationId") {
  return applyLocationFilter({ company: companyId }, scope, field);
}

export function resolveTxnLocation(body, scope, options) {
  const ctx = validateTransactionContext(body, scope, options);
  return ctx.locationId;
}

export function resolveTxnContext(body, scope, options) {
  return validateTransactionContext(body, scope, options);
}

export async function nextDocNo(companyId, moduleKey, prefix, locationId, session) {
  return allocateDocNumber(companyId, moduleKey, { prefix, locationId, digits: 6, session });
}

export async function previewDocNo(companyId, moduleKey, prefix, locationId) {
  return previewDocNumber(companyId, moduleKey, { prefix, locationId, digits: 6 });
}

export function assertStoreAccess(companyId, locationId, storeId) {
  return { locationId: toObjectId(locationId), storeId: toObjectId(storeId) };
}

export { assertLocationAccess };
