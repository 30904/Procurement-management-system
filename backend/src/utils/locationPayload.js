export function buildLocationPayload(body) {
  const b = body ?? {};
  return {
    registrationDate: b.registrationDate,
    name: String(b.name ?? b.locationId ?? "").trim(),
    isCentral: Boolean(b.isCentral),
    usesCompanyGstin: Boolean(b.usesCompanyGstin),
    gstinEffectiveFrom: b.gstinEffectiveFrom || undefined,
    defaultRMStoreId: b.defaultRMStoreId || undefined,
    defaultFGStoreId: b.defaultFGStoreId || undefined,
    defaultScrapStoreId: b.defaultScrapStoreId || undefined,
    enablePurchase: b.enablePurchase !== false,
    enableSales: b.enableSales !== false,
    enableProduction: b.enableProduction !== false,
    enableQuality: b.enableQuality !== false,
    enableMaintenance: b.enableMaintenance !== false,
    locationId: String(b.locationId ?? "").trim(),
    locationType: String(b.locationType ?? "").trim(),
    operationalCategory: String(b.operationalCategory ?? "").trim(),
    country: String(b.country ?? "India").trim(),
    state: String(b.state ?? "").trim(),
    cityDistrict: String(b.cityDistrict ?? "").trim(),
    pinCode: String(b.pinCode ?? "").trim(),
    addressLine1: String(b.addressLine1 ?? "").trim(),
    addressLine2: String(b.addressLine2 ?? "").trim(),
    addressLine3: String(b.addressLine3 ?? "").trim(),
    addressLine4: String(b.addressLine4 ?? "").trim(),
    latitude: String(b.latitude ?? "").trim(),
    longitude: String(b.longitude ?? "").trim(),
    gstin: String(b.gstin ?? "").trim().toUpperCase(),
    status: String(b.status ?? "Active").trim(),
    contacts: Array.isArray(b.contacts)
      ? b.contacts.map((c) => ({
          name: String(c?.name ?? "").trim(),
          mobile: String(c?.mobile ?? "").trim(),
          email: String(c?.email ?? "").trim(),
          designation: String(c?.designation ?? "").trim(),
        }))
      : [],
  };
}

export function applyLocationPayload(doc, payload) {
  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.isCentral !== undefined) doc.isCentral = payload.isCentral;
  if (payload.usesCompanyGstin !== undefined) doc.usesCompanyGstin = payload.usesCompanyGstin;
  if (payload.gstinEffectiveFrom) {
    const d = new Date(payload.gstinEffectiveFrom);
    if (!Number.isNaN(d.getTime())) doc.gstinEffectiveFrom = d;
  }
  doc.locationId = payload.locationId;
  doc.locationType = payload.locationType;
  doc.operationalCategory = payload.operationalCategory;
  doc.country = payload.country;
  doc.state = payload.state;
  doc.cityDistrict = payload.cityDistrict;
  doc.pinCode = payload.pinCode;
  doc.addressLine1 = payload.addressLine1;
  doc.addressLine2 = payload.addressLine2;
  doc.addressLine3 = payload.addressLine3;
  doc.addressLine4 = payload.addressLine4;
  doc.latitude = payload.latitude;
  doc.longitude = payload.longitude;
  doc.gstin = payload.gstin;
  doc.status = payload.status;
  doc.isActive = payload.status.toLowerCase() === "active";
  doc.contacts = payload.contacts;
  if (payload.defaultRMStoreId !== undefined) doc.defaultRMStoreId = payload.defaultRMStoreId || undefined;
  if (payload.defaultFGStoreId !== undefined) doc.defaultFGStoreId = payload.defaultFGStoreId || undefined;
  if (payload.defaultScrapStoreId !== undefined) doc.defaultScrapStoreId = payload.defaultScrapStoreId || undefined;
  if (payload.enablePurchase !== undefined) doc.enablePurchase = payload.enablePurchase;
  if (payload.enableSales !== undefined) doc.enableSales = payload.enableSales;
  if (payload.enableProduction !== undefined) doc.enableProduction = payload.enableProduction;
  if (payload.enableQuality !== undefined) doc.enableQuality = payload.enableQuality;
  if (payload.enableMaintenance !== undefined) doc.enableMaintenance = payload.enableMaintenance;
  if (payload.registrationDate) {
    const d = new Date(payload.registrationDate);
    if (!Number.isNaN(d.getTime())) doc.registrationDate = d;
  }
}
