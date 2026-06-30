export function toInputDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyLocationForm() {
  return {
    registrationDate: toInputDate(new Date()),
    name: "",
    isCentral: false,
    usesCompanyGstin: false,
    locationId: "",
    locationType: "",
    operationalCategory: "",
    country: "India",
    state: "",
    cityDistrict: "",
    pinCode: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    addressLine4: "",
    latitude: "",
    longitude: "",
    gstin: "",
    status: "Active",
    contacts: [],
    defaultRMStoreId: "",
    defaultFGStoreId: "",
    defaultScrapStoreId: "",
    enablePurchase: true,
    enableSales: true,
    enableProduction: true,
    enableQuality: true,
    enableMaintenance: true,
  };
}

export function locationDocToForm(doc) {
  if (!doc) return emptyLocationForm();
  const legacy = doc.address || {};
  return {
    registrationDate: toInputDate(doc.registrationDate),
    name: doc.name ?? doc.locationId ?? "",
    isCentral: !!doc.isCentral,
    usesCompanyGstin: !!doc.usesCompanyGstin,
    locationId: doc.locationId ?? "",
    locationType: doc.locationType ?? "",
    operationalCategory: doc.operationalCategory ?? "",
    country: doc.country ?? "India",
    state: doc.state ?? legacy.state ?? "",
    cityDistrict: doc.cityDistrict ?? legacy.city ?? "",
    pinCode: doc.pinCode ?? legacy.pinCode ?? "",
    addressLine1: doc.addressLine1 ?? legacy.line1 ?? "",
    addressLine2: doc.addressLine2 ?? "",
    addressLine3: doc.addressLine3 ?? "",
    addressLine4: doc.addressLine4 ?? "",
    latitude: doc.latitude ?? "",
    longitude: doc.longitude ?? "",
    gstin: doc.gstin ?? "",
    status: doc.status ?? (doc.isActive === false ? "Inactive" : "Active"),
    contacts: Array.isArray(doc.contacts) ? doc.contacts.map((c) => ({ ...c })) : [],
    defaultRMStoreId: doc.defaultRMStoreId ? String(doc.defaultRMStoreId) : "",
    defaultFGStoreId: doc.defaultFGStoreId ? String(doc.defaultFGStoreId) : "",
    defaultScrapStoreId: doc.defaultScrapStoreId ? String(doc.defaultScrapStoreId) : "",
    enablePurchase: doc.enablePurchase !== false,
    enableSales: doc.enableSales !== false,
    enableProduction: doc.enableProduction !== false,
    enableQuality: doc.enableQuality !== false,
    enableMaintenance: doc.enableMaintenance !== false,
  };
}

export function locationFormToPayload(form) {
  return {
    registrationDate: form.registrationDate,
    name: String(form.name ?? form.locationId ?? "").trim(),
    isCentral: !!form.isCentral,
    usesCompanyGstin: !!form.usesCompanyGstin,
    locationId: form.locationId.trim(),
    locationType: form.locationType,
    operationalCategory: form.operationalCategory,
    country: form.country.trim() || "India",
    state: form.state,
    cityDistrict: form.cityDistrict.trim(),
    pinCode: form.pinCode.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim(),
    addressLine3: form.addressLine3.trim(),
    addressLine4: form.addressLine4.trim(),
    latitude: form.latitude.trim(),
    longitude: form.longitude.trim(),
    gstin: form.gstin.trim(),
    status: form.status,
    contacts: form.contacts || [],
    defaultRMStoreId: form.defaultRMStoreId || undefined,
    defaultFGStoreId: form.defaultFGStoreId || undefined,
    defaultScrapStoreId: form.defaultScrapStoreId || undefined,
    enablePurchase: form.enablePurchase !== false,
    enableSales: form.enableSales !== false,
    enableProduction: form.enableProduction !== false,
    enableQuality: form.enableQuality !== false,
    enableMaintenance: form.enableMaintenance !== false,
  };
}

export function validateLocationForm(form) {
  const errors = {};
  if (!form.registrationDate) errors.registrationDate = "Required";
  if (!form.locationId.trim()) errors.locationId = "Required";
  if (!form.locationType) errors.locationType = "Required";
  if (!form.operationalCategory) errors.operationalCategory = "Required";
  if (!form.country.trim()) errors.country = "Required";
  if (!form.state) errors.state = "Required";
  if (!form.cityDistrict.trim()) errors.cityDistrict = "Required";
  if (!form.pinCode.trim()) errors.pinCode = "Required";
  if (!form.addressLine1.trim()) errors.addressLine1 = "Required";
  if (!form.addressLine2.trim()) errors.addressLine2 = "Required";
  if (!form.addressLine3.trim()) errors.addressLine3 = "Required";
  if (!form.latitude.trim()) errors.latitude = "Required";
  if (!form.longitude.trim()) errors.longitude = "Required";
  if (!form.usesCompanyGstin && !form.gstin.trim()) errors.gstin = "Required";
  if (!form.status) errors.status = "Required";
  return errors;
}
