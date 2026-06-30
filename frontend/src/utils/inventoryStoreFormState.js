export function emptyInventoryStoreForm() {
  return {
    locationId: "",
    storeCode: "",
    storeName: "",
    isDefault: false,
    status: "Active",
    description: "",
  };
}

export function inventoryStoreDocToForm(doc) {
  if (!doc) return emptyInventoryStoreForm();
  return {
    locationId: doc.locationId ? String(doc.locationId) : "",
    storeCode: doc.storeCode ?? "",
    storeName: doc.storeName ?? "",
    isDefault: !!doc.isDefault,
    status: doc.status ?? "Active",
    description: doc.description ?? "",
  };
}

export function inventoryStoreFormToCreatePayload(form) {
  return {
    locationId: form.locationId,
    storeCode: String(form.storeCode ?? "").trim(),
    storeName: String(form.storeName ?? "").trim(),
    isDefault: !!form.isDefault,
    status: form.status || "Active",
    description: String(form.description ?? "").trim(),
  };
}

export function inventoryStoreFormToUpdatePayload(form) {
  return {
    storeName: String(form.storeName ?? "").trim(),
    isDefault: !!form.isDefault,
    status: form.status || "Active",
    description: String(form.description ?? "").trim(),
  };
}

export function validateInventoryStoreForm(form, { isEdit = false } = {}) {
  const errors = {};
  if (!isEdit && !form.locationId) errors.locationId = "Required";
  if (!isEdit && !String(form.storeCode ?? "").trim()) errors.storeCode = "Required";
  if (!String(form.storeName ?? "").trim()) errors.storeName = "Required";
  if (!form.status) errors.status = "Required";
  return errors;
}
