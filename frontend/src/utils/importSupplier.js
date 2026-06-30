import { isDomesticSupplier, isImportSupplier } from "./domesticSupplier.js";

function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

/** Supplier eligible for Purchase Order (Import). */
export function isImportPoSupplier(supplier) {
  if (!supplier) return false;
  if (String(supplier.isSupplierActive || "A").toUpperCase() !== "A") return false;
  if (isDomesticSupplier(supplier)) return false;
  if (isImportSupplier(supplier)) return true;

  const purchaseType = norm(supplier.supplierPurchaseType);
  const category = norm(supplier.categoryType);
  if (purchaseType.includes("import") || category.includes("import")) return true;
  if (purchaseType.includes("overseas") || category.includes("overseas")) return true;

  const currency = norm(supplier.supplierCurrency || "");
  if (currency && currency !== "inr") return true;

  return false;
}

export function filterImportSuppliers(suppliers = []) {
  return suppliers.filter(isImportPoSupplier);
}
