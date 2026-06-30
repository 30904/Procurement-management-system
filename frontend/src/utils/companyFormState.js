/** @param {Date|string|undefined|null} value */
export function toInputDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyCompanyForm() {
  return {
    registrationNo: "",
    registrationDate: "",
    companyName: "",
    displayName: "",
    companyCode: "",
    constitutionOfBusiness: "",
    corporateIdentificationNo: "",
    dateOfIncorporation: "",
    natureOfBusiness: "",
    typeOfIndustry: "",
    companyPan: "",
    tan: "",
    msmeClassification: "",
    udyamRegistrationNo: "",
    gstClassification: "",
    locationsServedCount: "",
    status: "Active",
    contactEmail: "",
    contactMobile: "",
    contactWebsite: "",
    addressLine1: "",
    addressCity: "",
    addressState: "",
    addressPinCode: "",
  };
}

/** @param {Record<string, unknown>|null|undefined} doc */
export function companyDocToForm(doc) {
  if (!doc) return emptyCompanyForm();
  return {
    registrationNo: doc.registrationNo ?? "",
    registrationDate: toInputDate(doc.registrationDate),
    companyName: doc.companyName ?? "",
    displayName: doc.displayName ?? "",
    companyCode: doc.companyCode ?? "",
    constitutionOfBusiness: doc.constitutionOfBusiness ?? "",
    corporateIdentificationNo: doc.corporateIdentificationNo ?? "",
    dateOfIncorporation: toInputDate(doc.dateOfIncorporation),
    natureOfBusiness: doc.natureOfBusiness ?? "",
    typeOfIndustry: doc.typeOfIndustry ?? "",
    companyPan: doc.companyPan ?? "",
    tan: doc.tan ?? "",
    msmeClassification: doc.msmeClassification ?? "",
    udyamRegistrationNo: doc.udyamRegistrationNo ?? "",
    gstClassification: doc.gstClassification ?? "",
    locationsServedCount:
      doc.locationsServedCount != null && doc.locationsServedCount !== ""
        ? String(doc.locationsServedCount)
        : "",
    status: doc.status ?? (doc.isActive === false ? "Inactive" : "Active"),
    contactEmail: doc.contact?.email ?? "",
    contactMobile: doc.contact?.mobile ?? "",
    contactWebsite: doc.contact?.website ?? "",
    addressLine1: doc.address?.line1 ?? "",
    addressCity: doc.address?.city ?? "",
    addressState: doc.address?.state ?? "",
    addressPinCode: doc.address?.pinCode ?? "",
  };
}

/** @param {ReturnType<typeof emptyCompanyForm>} form */
export function companyFormToPayload(form) {
  return {
    registrationNo: form.registrationNo.trim(),
    registrationDate: form.registrationDate || null,
    companyName: form.companyName.trim(),
    displayName: form.displayName.trim(),
    companyCode: form.companyCode.trim(),
    constitutionOfBusiness: form.constitutionOfBusiness,
    corporateIdentificationNo: form.corporateIdentificationNo.trim(),
    dateOfIncorporation: form.dateOfIncorporation || null,
    natureOfBusiness: form.natureOfBusiness,
    typeOfIndustry: form.typeOfIndustry,
    companyPan: form.companyPan.trim(),
    tan: form.tan.trim(),
    msmeClassification: form.msmeClassification,
    udyamRegistrationNo: form.udyamRegistrationNo.trim(),
    gstClassification: form.gstClassification,
    locationsServedCount:
      form.locationsServedCount === "" ? null : Number(form.locationsServedCount),
    status: form.status,
    address: {
      line1: form.addressLine1.trim(),
      city: form.addressCity.trim(),
      state: form.addressState.trim(),
      pinCode: form.addressPinCode.trim(),
    },
    contact: {
      email: form.contactEmail.trim(),
      mobile: form.contactMobile.trim(),
      website: form.contactWebsite.trim(),
    },
  };
}

/** @param {ReturnType<typeof emptyCompanyForm>} form */
export function validateCompanyForm(form) {
  const errors = {};
  if (!form.registrationNo.trim()) errors.registrationNo = "Required";
  if (!form.registrationDate) errors.registrationDate = "Required";
  if (!form.companyName.trim()) errors.companyName = "Required";
  if (!form.companyCode.trim()) errors.companyCode = "Required";
  if (!form.constitutionOfBusiness) errors.constitutionOfBusiness = "Required";
  if (!form.corporateIdentificationNo.trim()) {
    errors.corporateIdentificationNo = "Required";
  }
  if (!form.dateOfIncorporation) errors.dateOfIncorporation = "Required";
  if (!form.typeOfIndustry) errors.typeOfIndustry = "Required";
  if (!form.companyPan.trim()) errors.companyPan = "Required";
  if (!form.gstClassification) errors.gstClassification = "Required";
  if (!form.status) errors.status = "Required";
  return errors;
}
