function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function newKey() {
  return `rfq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyRfqVendor() {
  return {
    key: newKey(),
    supplierId: "",
    supplierCode: "",
    supplierName: "",
    preferred: false,
    sourceListCode: "",
    vendorRating: "",
    msme: "",
    gemRegistered: "",
    contactPerson: "",
    email: "",
    mobile: "",
  };
}

export function emptyRfqLine() {
  return {
    key: newKey(),
    lineType: "Material",
    itemId: "",
    itemNo: "",
    itemName: "",
    serviceId: "",
    serviceCode: "",
    serviceName: "",
    description: "",
    uom: "",
    qty: "",
    expectedDelivery: "",
    technicalSpecification: "",
    drawingReference: "",
    attachmentNote: "",
    lineRemarks: "",
  };
}

export function emptyRfqForm(buyerName = "") {
  return {
    rfqNo: "",
    rfqDate: todayIsoDate(),
    rfqType: "Material",
    department: "",
    procurementCategory: "",
    purchaseType: "Domestic",
    currency: "INR",
    referencePrId: "",
    referencePrNo: "",
    referencePlanningRef: "",
    requiredDeliveryDate: "",
    closingDate: "",
    buyer: buyerName,
    remarks: "",
    terms: "",
    vendors: [],
    lines: [emptyRfqLine()],
  };
}

export function vendorFromSupplier(supplier, preferred = false) {
  const gov = supplier?.govProcurement || {};
  const perf = supplier?.vendorPerformance || {};
  const contacts = Array.isArray(supplier?.contacts) ? supplier.contacts : [];
  const primary = contacts[0] || {};
  return {
    key: newKey(),
    supplierId: supplier._id || supplier.id || "",
    supplierCode: supplier.supplierCode || "",
    supplierName: supplier.supplierName || "",
    preferred,
    sourceListCode: "",
    vendorRating: perf.overallRating ?? perf.vendorScore ?? "",
    msme: gov.msmeEligible || "",
    gemRegistered: gov.gemRegistered || "",
    contactPerson: primary.name || "",
    email: primary.email || supplier.email || "",
    mobile: primary.mobile || supplier.mobile || "",
  };
}

export function emptyRfqLineFromItem(item) {
  return {
    key: newKey(),
    lineType: "Material",
    itemId: item._id || item.id || "",
    itemNo: item.itemNo || item.itemCode || "",
    itemName: item.itemName || item.description || "",
    serviceId: "",
    serviceCode: "",
    serviceName: "",
    description: item.description || item.itemName || "",
    uom: item.uom || item.unit || "",
    qty: "",
    expectedDelivery: "",
    technicalSpecification: "",
    drawingReference: "",
    attachmentNote: "",
    lineRemarks: "",
  };
}

export function emptyRfqLineFromService(service) {
  return {
    key: newKey(),
    lineType: "Service",
    itemId: "",
    itemNo: "",
    itemName: "",
    serviceId: service._id || service.id || "",
    serviceCode: service.serviceCode || "",
    serviceName: service.serviceName || service.description || "",
    description: service.description || service.serviceName || "",
    uom: service.uom || "NOS",
    qty: "",
    expectedDelivery: "",
    technicalSpecification: "",
    drawingReference: "",
    attachmentNote: "",
    lineRemarks: "",
  };
}

export function rfqDocToForm(doc) {
  const vendors = (Array.isArray(doc.vendors) ? doc.vendors : []).map((v) => ({
    key: newKey(),
    supplierId: v.supplierId ? String(v.supplierId) : "",
    supplierCode: v.supplierCode || "",
    supplierName: v.supplierName || "",
    preferred: Boolean(v.preferred),
    sourceListCode: v.sourceListCode || "",
    vendorRating: v.vendorRating ?? "",
    msme: v.msme || "",
    gemRegistered: v.gemRegistered || "",
    contactPerson: v.contactPerson || "",
    email: v.email || "",
    mobile: v.mobile || "",
  }));
  const lines = (Array.isArray(doc.lines) ? doc.lines : []).map((l) => ({
    key: newKey(),
    lineType: l.lineType || "Material",
    itemId: l.itemId ? String(l.itemId) : "",
    itemNo: l.itemNo || "",
    itemName: l.itemName || "",
    serviceId: l.serviceId ? String(l.serviceId) : "",
    serviceCode: l.serviceCode || "",
    serviceName: l.serviceName || "",
    description: l.description || "",
    uom: l.uom || "",
    qty: l.qty ?? "",
    expectedDelivery: toInputDate(l.expectedDelivery),
    technicalSpecification: l.technicalSpecification || "",
    drawingReference: l.drawingReference || "",
    attachmentNote: l.attachmentNote || "",
    lineRemarks: l.lineRemarks || "",
  }));
  return {
    rfqNo: doc.rfqNo || "",
    rfqDate: toInputDate(doc.rfqDate) || todayIsoDate(),
    rfqType: doc.rfqType || "Material",
    department: doc.department || "",
    procurementCategory: doc.procurementCategory || "",
    purchaseType: doc.purchaseType || "Domestic",
    currency: doc.currency || "INR",
    referencePrId: doc.referencePrId ? String(doc.referencePrId) : "",
    referencePrNo: doc.referencePrNo || "",
    referencePlanningRef: doc.referencePlanningRef || "",
    requiredDeliveryDate: toInputDate(doc.requiredDeliveryDate),
    closingDate: toInputDate(doc.closingDate),
    buyer: doc.buyer || "",
    remarks: doc.remarks || "",
    terms: doc.terms || "",
    vendors: vendors.length ? vendors : [],
    lines: lines.length ? lines : [emptyRfqLine()],
  };
}

export function rfqFormToPayload(form) {
  return {
    rfqDate: form.rfqDate,
    rfqType: form.rfqType,
    department: form.department,
    procurementCategory: form.procurementCategory,
    purchaseType: form.purchaseType,
    currency: form.currency,
    referencePrId: form.referencePrId || undefined,
    referencePrNo: form.referencePrNo,
    referencePlanningRef: form.referencePlanningRef,
    requiredDeliveryDate: form.requiredDeliveryDate || undefined,
    closingDate: form.closingDate || undefined,
    buyer: form.buyer,
    remarks: form.remarks,
    terms: form.terms,
    vendors: (form.vendors || []).map((v) => ({
      supplierId: v.supplierId || undefined,
      supplierCode: v.supplierCode,
      supplierName: v.supplierName,
      preferred: Boolean(v.preferred),
      sourceListCode: v.sourceListCode,
      vendorRating: Number(v.vendorRating) || 0,
      msme: v.msme,
      gemRegistered: v.gemRegistered,
      contactPerson: v.contactPerson,
      email: v.email,
      mobile: v.mobile,
    })),
    lines: (form.lines || [])
      .filter((l) => Number(l.qty) > 0)
      .map((l) => ({
        lineType: l.lineType || "Material",
        itemId: l.lineType === "Material" ? l.itemId || undefined : undefined,
        itemNo: l.itemNo,
        itemName: l.itemName,
        serviceId: l.lineType === "Service" ? l.serviceId || undefined : undefined,
        serviceCode: l.serviceCode,
        serviceName: l.serviceName,
        description: l.description,
        uom: l.uom,
        qty: Number(l.qty),
        expectedDelivery: l.expectedDelivery || undefined,
        technicalSpecification: l.technicalSpecification,
        drawingReference: l.drawingReference,
        attachmentNote: l.attachmentNote,
        lineRemarks: l.lineRemarks,
      })),
  };
}

export function computeRfqTotalQty(lines) {
  return (lines || []).reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
}
