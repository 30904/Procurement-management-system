import { AppError } from "./AppError.js";
import { isDomesticSupplier, isImportSupplier } from "./domesticSupplier.js";

function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

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

export function assertImportPoSupplier(supplier, poChannel) {
  const channel = String(poChannel ?? "").trim().toLowerCase();
  if (channel !== "import") return;
  if (!isImportPoSupplier(supplier)) {
    throw new AppError(
      "Selected supplier is not eligible for import purchase orders. Tag supplier as import/overseas, set non-INR currency, or foreign country on supplier master.",
      400,
      "VALIDATION_ERROR"
    );
  }
}
