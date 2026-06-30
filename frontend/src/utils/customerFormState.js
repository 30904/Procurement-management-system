export const EMPTY_ADDRESS = {
  line1: "",
  line2: "",
  line3: "",
  line4: "",
  state: "",
  city: "",
  district: "",
  pinCode: "",
  country: "",
  zone: "",
};

export function emptyCustomerForm() {
  return {
    customerCode: "",
    categoryType: "",
    customerNameOnTaxInvoice: "",
    customerVendorCode: "",
    customerNameLegalEntity: "",
    plantNameLocation: "",
    plantCodeId: "",
    customerNickName: "",
    gstClassification: "",
    gstin: "",
    customerCIN: "",
    customerCurrency: "INR",
    creditLimit: "",
    customerPaymentTerms: "",
    customerFreightTerms: "",
    isCustomerActive: "A",
    customerBillingAddress: [{ ...EMPTY_ADDRESS }],
    customerShippingAddress: [],
    customerContactMatrix: [],
  };
}

export function resolveCustomerCategoryValue(categoryType, options = []) {
  const key = String(categoryType ?? "").trim();
  if (!key) return "";
  const byValue = options.find((o) => o.value === key);
  if (byValue) return byValue.value;
  const byLabel = options.find((o) => o.label === key);
  if (byLabel) return byLabel.value;
  return key;
}

export function customerCategoryDisplayLabel(form, options = []) {
  const key = String(form?.categoryType ?? "").trim();
  if (!key) return "";
  const match = options.find((o) => o.value === key || o.label === key);
  return match?.label || key;
}

export function customerDocToForm(doc) {
  if (!doc) return emptyCustomerForm();

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
      : [];

  return {
    customerCode: doc.customerCode ?? "",
    categoryType: doc.categoryType ?? "",
    customerNameOnTaxInvoice: doc.customerNameOnTaxInvoice ?? "",
    customerVendorCode: doc.customerVendorCode ?? "",
    customerNameLegalEntity: doc.customerNameLegalEntity ?? "",
    plantNameLocation: doc.plantNameLocation ?? "",
    plantCodeId: doc.plantCodeId ?? "",
    customerNickName: doc.customerNickName ?? "",
    gstClassification: doc.gstClassification ?? "",
    gstin: doc.gstin ?? "",
    customerCIN: doc.customerCIN ?? "",
    customerCurrency: doc.customerCurrency ?? "INR",
    creditLimit:
      doc.creditLimit === null || doc.creditLimit === undefined ? "" : String(doc.creditLimit),
    customerPaymentTerms: doc.customerPaymentTerms ?? "",
    customerFreightTerms: doc.customerFreightTerms ?? "",
    isCustomerActive: doc.isCustomerActive ?? "A",
    customerBillingAddress: mapAddr(doc.customerBillingAddress).length
      ? mapAddr(doc.customerBillingAddress)
      : [{ ...EMPTY_ADDRESS }],
    customerShippingAddress: mapAddr(doc.customerShippingAddress),
    customerContactMatrix: Array.isArray(doc.customerContactMatrix)
      ? doc.customerContactMatrix.map((c) => ({
          name: c.name ?? "",
          department: c.department ?? "",
          email: c.email ?? "",
          mobile: c.mobile ?? "",
          designation: c.designation ?? "",
        }))
      : [],
  };
}

export function customerFormToPayload(form) {
  return {
    customerCode: form.customerCode?.trim(),
    categoryType: form.categoryType?.trim(),
    customerNameOnTaxInvoice: form.customerNameOnTaxInvoice?.trim(),
    customerVendorCode: form.customerVendorCode?.trim(),
    customerNameLegalEntity: form.customerNameLegalEntity?.trim(),
    plantNameLocation: form.plantNameLocation?.trim(),
    plantCodeId: form.plantCodeId?.trim(),
    customerNickName: form.customerNickName?.trim(),
    gstClassification: form.gstClassification?.trim(),
    gstin: form.gstin?.trim(),
    customerCIN: form.customerCIN?.trim(),
    customerCurrency: form.customerCurrency?.trim() || "INR",
    creditLimit: form.creditLimit,
    customerPaymentTerms: form.customerPaymentTerms?.trim(),
    customerFreightTerms: form.customerFreightTerms?.trim(),
    isCustomerActive: form.isCustomerActive || "A",
    customerBillingAddress: form.customerBillingAddress,
    customerShippingAddress: form.customerShippingAddress,
    customerContactMatrix: form.customerContactMatrix,
  };
}
