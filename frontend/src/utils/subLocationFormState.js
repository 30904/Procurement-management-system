export function emptySubLocationForm() {
  return {
    parentLocation: "",
    subLocationName: "",
    subLocationId: "",
    locationType: "",
    operationalCategory: "",
    gstin: "",
    status: "Active",
    description: "",
  };
}

export function subLocationDocToForm(doc) {
  if (!doc) return emptySubLocationForm();
  const parentId =
    doc.parentLocation?._id ||
    doc.parentLocation?.id ||
    doc.locationId ||
    doc.parentLocation ||
    "";
  return {
    parentLocation: String(parentId),
    subLocationName: doc.subLocationName ?? doc.subLocationId ?? "",
    subLocationId: doc.subLocationId ?? "",
    locationType: doc.locationType ?? "",
    operationalCategory: doc.operationalCategory ?? "",
    gstin: doc.gstin ?? "",
    status: doc.status ?? (doc.isActive === false ? "Inactive" : "Active"),
    description: doc.description ?? "",
  };
}

export function subLocationFormToPayload(form) {
  const name = String(form.subLocationName ?? form.subLocationId ?? "").trim();
  return {
    parentLocation: form.parentLocation,
    locationId: form.parentLocation,
    subLocationName: name,
    subLocationId: form.subLocationId.trim() || name,
    locationType: form.locationType,
    operationalCategory: form.operationalCategory,
    gstin: form.gstin.trim(),
    status: form.status,
    description: form.description.trim(),
  };
}

export function validateSubLocationForm(form) {
  const errors = {};
  if (!form.parentLocation) errors.parentLocation = "Required";
  if (!form.subLocationId.trim()) errors.subLocationId = "Required";
  if (!form.locationType) errors.locationType = "Required";
  if (!form.operationalCategory) errors.operationalCategory = "Required";
  if (!form.gstin.trim()) errors.gstin = "Required";
  if (!form.status) errors.status = "Required";
  return errors;
}
