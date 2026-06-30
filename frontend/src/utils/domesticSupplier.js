/**
 * Identifies suppliers eligible for Purchase Order (Domestic).
 * Uses master fields already on SupplierMaster — no separate collection.
 */

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
  const incoterm = norm(supplier?.supplierINCOTerms);
  const currency = norm(supplier?.supplierCurrency || "INR");
  const country = primaryBillingCountry(supplier);
  const origin = norm(supplier?.countryOfOrigin);

  if (purchaseType.includes("import") || category.includes("import")) return true;
  if (purchaseType.includes("overseas") || category.includes("overseas")) return true;
  if (incoterm && !["exw", "fca", "cpt", "cip", "dap", "dpu", "ddp"].includes(incoterm.slice(0, 3))) {
    /* uncommon incoterm text — treat explicit import keywords only */
  }
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

export function filterDomesticSuppliers(suppliers = []) {
  return suppliers.filter(isDomesticSupplier);
}

export function formatSupplierAddressLine(supplier) {
  const addr = supplier?.supplierBillingAddress?.[0] || supplier?.supplierAddress?.[0];
  if (!addr) return "";
  return [addr.line1, addr.line2, addr.city, addr.state, addr.pinCode]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

export function primarySupplierContact(supplier) {
  const c = supplier?.supplierContactMatrix?.[0];
  if (!c) return null;
  return {
    name: c.name || "",
    designation: c.designation || "",
    email: c.email || "",
    mobile: c.mobile || "",
  };
}
