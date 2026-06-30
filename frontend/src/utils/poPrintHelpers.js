export function hasRichTextContent(html) {
  if (!String(html ?? "").trim()) return false;
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

export function formatPrintDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatDeliveryDate(eddRaw) {
  const str = String(eddRaw ?? "").trim();
  if (!str) return "";
  try {
    const parsed = JSON.parse(str);
    const first = parsed?.schedules?.[0]?.deliveryDate;
    if (first) return formatPrintDate(first).replace(/\//g, "-");
  } catch {
    /* plain */
  }
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  }
  return str;
}

export function formatPrintMoney(value, empty = "") {
  const n = Number(value);
  if (!Number.isFinite(n) || (n === 0 && empty)) return empty;
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatLocationAddress(loc, company) {
  if (!loc) {
    const a = company?.address || {};
    return [
      company?.companyName,
      [a.line1, a.line2].filter(Boolean).join(", "),
      [a.city, a.state, a.pinCode].filter(Boolean).join(", "),
    ].filter(Boolean);
  }
  const lines = [
    loc.name || loc.locationId || company?.companyName,
    [loc.addressLine1, loc.addressLine2, loc.addressLine3, loc.addressLine4]
      .filter(Boolean)
      .join(", "),
    [loc.cityDistrict, loc.state, loc.pinCode].filter(Boolean).join(", "),
  ].filter(Boolean);
  return lines;
}

/** Bill To / Ship To — legal entity name first, then plant/location, then address lines. */
export function formatBillToAddress(loc, company) {
  const companyName = String(company?.companyName || "").trim();
  if (!loc) {
    return formatLocationAddress(null, company);
  }
  const locationLabel = String(loc.name || loc.locationId || "").trim();
  const addressLine = [loc.addressLine1, loc.addressLine2, loc.addressLine3, loc.addressLine4]
    .filter(Boolean)
    .join(", ");
  const cityLine = [loc.cityDistrict, loc.state, loc.pinCode].filter(Boolean).join(", ");
  const lines = [];
  if (companyName) lines.push(companyName);
  if (
    locationLabel &&
    locationLabel.toLowerCase() !== companyName.toLowerCase()
  ) {
    lines.push(locationLabel);
  }
  if (addressLine) lines.push(addressLine);
  if (cityLine) lines.push(cityLine);
  return lines.filter(Boolean);
}

export function primaryContact(contacts) {
  const c = Array.isArray(contacts) && contacts.length ? contacts[0] : null;
  if (!c) return { phone: "", email: "" };
  return {
    phone: c.mobile || c.phone || "",
    email: c.email || "",
  };
}

export function supplierAddressBlock(supplier) {
  const billing =
    Array.isArray(supplier?.supplierBillingAddress) && supplier.supplierBillingAddress.length
      ? supplier.supplierBillingAddress[0]
      : Array.isArray(supplier?.supplierAddress) && supplier.supplierAddress.length
        ? supplier.supplierAddress[0]
        : null;
  const lines = [
    supplier?.supplierName || "",
    billing
      ? [billing.line1, billing.line2, billing.line3, billing.city, billing.state, billing.pinCode]
          .filter(Boolean)
          .join(", ")
      : "",
  ].filter(Boolean);
  const contact = Array.isArray(supplier?.supplierContactMatrix)
    ? supplier.supplierContactMatrix[0]
    : null;
  return {
    lines,
    phone: contact?.mobile || "",
    email: contact?.email || "",
    gstin: supplier?.gstin || "",
  };
}

/** Max line rows on one A4 print page (items + incidental + optional padding). */
export const PO_PRINT_MAX_LINE_ROWS = 5;

export function buildPrintLineRows(po, { maxRows = PO_PRINT_MAX_LINE_ROWS, padToMax = true } = {}) {
  const rows = [];
  for (const line of po?.lines || []) {
    if (Number(line.qty) <= 0) continue;
    const desc = [line.itemNo, line.itemName, line.description].filter(Boolean).join("\n");
    rows.push({
      key: `line-${line.lineNo}`,
      description: desc,
      deliveryDate: formatDeliveryDate(line.edd),
      hsn: line.hsnCode || "",
      uom: line.uom || "",
      qty: formatPrintMoney(line.qty),
      rate: formatPrintMoney(line.rate),
      disc: "-",
      amount: formatPrintMoney(line.amount),
      isCharge: false,
    });
  }
  for (const exp of po?.incidentalExpenses || []) {
    const amt = Number(exp.amount);
    if (!amt) continue;
    rows.push({
      key: `exp-${exp.description}`,
      description: exp.description || "Other Charges",
      deliveryDate: "",
      hsn: "OTH Charges",
      uom: "",
      qty: "",
      rate: "",
      disc: "-",
      amount: formatPrintMoney(amt),
      isCharge: true,
    });
  }
  if (padToMax && rows.length <= maxRows) {
    while (rows.length < maxRows) {
      rows.push({
        key: `pad-${rows.length}`,
        description: "",
        deliveryDate: "",
        hsn: "",
        uom: "",
        qty: "",
        rate: "",
        disc: "",
        amount: "",
        isCharge: false,
        pad: true,
      });
    }
  }
  return rows;
}

function pushPrintRow(rows, label, value) {
  if (value === null || value === undefined || !String(value).trim()) return;
  rows.push({ label, value: String(value).trim() });
}

/** Optional MPBCDC fields for PO print — only non-empty values. */
export function buildPoMpbcdcPrintRows(po) {
  if (!po) return [];
  const proc = po.procurementReference || {};
  const gov = po.governmentProcurement || {};
  const cap = po.capitalProcurement || {};
  const tracking = po.approvalTracking || {};
  const rows = [];
  const indentNos = (po.sourceIndentNos || []).filter(Boolean).join(", ");

  pushPrintRow(rows, "Purchase Requisition", indentNos);
  pushPrintRow(rows, "Procurement Category", proc.procurementCategory);
  pushPrintRow(rows, "Purchase Type", proc.purchaseType);
  pushPrintRow(rows, "Source List Reference", proc.sourceListLabel || proc.sourceListCode);
  pushPrintRow(rows, "Vendor Evaluation Reference", proc.vendorEvaluationLabel || proc.vendorEvaluationCode);
  pushPrintRow(rows, "Rate Contract Reference", proc.rateContractReference);
  pushPrintRow(rows, "Contract Reference", proc.contractReference);
  pushPrintRow(rows, "Budget Reference", proc.budgetReference);
  pushPrintRow(rows, "GeM Purchase", gov.gemPurchase);
  pushPrintRow(rows, "Tender Purchase", gov.tenderPurchase);
  pushPrintRow(rows, "Emergency Procurement", gov.emergencyProcurement);
  pushPrintRow(rows, "Board Approval Required", gov.boardApprovalRequired);
  pushPrintRow(rows, "Tender Number", gov.tenderNumber);
  pushPrintRow(rows, "GeM Bid Number", gov.gemBidNumber);
  pushPrintRow(rows, "Government Approval Number", gov.governmentApprovalNumber);
  pushPrintRow(rows, "Government Reference", gov.governmentReference);
  pushPrintRow(rows, "Asset Procurement", cap.assetProcurement);
  pushPrintRow(rows, "Asset Reference", cap.assetName || cap.assetCode);
  pushPrintRow(rows, "Capitalization Required", cap.capitalizationRequired);
  pushPrintRow(rows, "Capital Budget Code", cap.capitalBudgetCode);
  pushPrintRow(rows, "Procurement Approval Status", tracking.approvalStatus);
  pushPrintRow(rows, "Approval Authority", tracking.approvalAuthority);
  if (tracking.approvalDate) {
    pushPrintRow(rows, "Approval Date", formatPrintDate(tracking.approvalDate));
  }
  pushPrintRow(rows, "Approval Remarks", tracking.approvalRemarks);
  return rows;
}
