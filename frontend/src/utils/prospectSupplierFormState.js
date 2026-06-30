import { EMPTY_ADDRESS } from "./supplierFormState.js";

export { EMPTY_ADDRESS };

export function emptyProspectForm() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    registrationNo: "",
    registrationDate: today,
    categoryType: "",
    supplierName: "",
    gstClassification: "",
    gstin: "",
    supplierPaymentTerms: "",
    isSupplierActive: "A",
    supplierBillingAddress: [{ ...EMPTY_ADDRESS }],
    supplierContactMatrix: [],
    assessmentStatus: "Pending",
    assessmentNotes: "",
    assessedBy: "",
    assessedAt: "",
  };
}

export function prospectDocToForm(doc) {
  if (!doc) return emptyProspectForm();
  const mapAddr = (list) =>
    Array.isArray(list) && list.length
      ? list.map((a) => ({
          line1: a.line1 ?? "",
          line2: a.line2 ?? "",
          line3: a.line3 ?? "",
          line4: a.line4 ?? "",
          state: a.state ?? "",
          city: a.city ?? "",
          district: a.district ?? "",
          pinCode: a.pinCode ?? "",
          country: a.country ?? "",
          zone: a.zone ?? "",
        }))
      : [{ ...EMPTY_ADDRESS }];

  return {
    registrationNo: doc.registrationNo ?? "",
    registrationDate: doc.registrationDate
      ? new Date(doc.registrationDate).toISOString().slice(0, 10)
      : "",
    categoryType: doc.categoryType ?? "",
    supplierName: doc.supplierName ?? "",
    gstClassification: doc.gstClassification ?? "",
    gstin: doc.gstin ?? "",
    supplierPaymentTerms: doc.supplierPaymentTerms ?? "",
    isSupplierActive: doc.isSupplierActive ?? "A",
    supplierBillingAddress: mapAddr(doc.supplierBillingAddress),
    supplierContactMatrix: Array.isArray(doc.supplierContactMatrix)
      ? doc.supplierContactMatrix.map((c) => ({
          name: c.name ?? "",
          department: c.department ?? "",
          email: c.email ?? "",
          mobile: c.mobile ?? "",
          designation: c.designation ?? "",
        }))
      : [],
    assessmentStatus: doc.assessmentStatus ?? "Pending",
    assessmentNotes: doc.assessmentNotes ?? "",
    assessedBy: doc.assessedBy ?? "",
    assessedAt: doc.assessedAt
      ? new Date(doc.assessedAt).toISOString().slice(0, 10)
      : "",
  };
}

export function prospectFormToPayload(form) {
  return {
    registrationDate: form.registrationDate,
    categoryType: form.categoryType?.trim(),
    supplierName: form.supplierName?.trim(),
    gstClassification: form.gstClassification?.trim(),
    gstin: form.gstin?.trim(),
    supplierPaymentTerms: form.supplierPaymentTerms?.trim(),
    isSupplierActive: form.isSupplierActive || "A",
    supplierBillingAddress: form.supplierBillingAddress,
    supplierContactMatrix: form.supplierContactMatrix,
    assessmentStatus: form.assessmentStatus || "Pending",
    assessmentNotes: form.assessmentNotes?.trim(),
    assessedBy: form.assessedBy?.trim(),
    assessedAt: form.assessedAt || undefined,
  };
}
