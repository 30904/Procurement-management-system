import { AppError } from "./AppError.js";

function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

function primaryBillingCountry(supplier) {
  const addr = supplier?.supplierBillingAddress?.[0] || supplier?.supplierAddress?.[0];
  return norm(addr?.country);
}

export function isImportSupplier(supplier) {
  const purchaseType = norm(supplier?.supplierPurchaseType);
  const category = norm(supplier?.categoryType);
  const currency = norm(supplier?.supplierCurrency || "INR");
  const country = primaryBillingCountry(supplier);
  const origin = norm(supplier?.countryOfOrigin);

  if (purchaseType.includes("import") || category.includes("import")) return true;
  if (purchaseType.includes("overseas") || category.includes("overseas")) return true;
  if (currency && currency !== "inr") return true;
  if (country && country !== "india" && country !== "in" && country !== "") return true;
  if (origin && origin !== "india" && origin !== "in" && origin !== "") return true;
  return false;
}

export function isDomesticSupplier(supplier) {
  if (!supplier) return false;
  if (String(supplier.isSupplierActive || "A").toUpperCase() !== "A") return false;
  if (isImportSupplier(supplier)) return false;

  const purchaseType = norm(supplier.supplierPurchaseType);
  const category = norm(supplier.categoryType);
  if (purchaseType.includes("domestic") || category.includes("domestic")) return true;

  const currency = norm(supplier.supplierCurrency || "INR");
  if (currency === "inr") return true;

  const country = primaryBillingCountry(supplier);
  if (!country || country === "india" || country === "in") return true;

  return false;
}

export function assertDomesticPoSupplier(supplier, poChannel) {
  const channel = String(poChannel ?? "").trim().toLowerCase();
  if (channel !== "domestic") return;
  if (!isDomesticSupplier(supplier)) {
    throw new AppError(
      "Selected supplier is not eligible for domestic purchase orders. Update supplier master (INR / India / domestic category) or choose another supplier.",
      400,
      "VALIDATION_ERROR"
    );
  }
}
