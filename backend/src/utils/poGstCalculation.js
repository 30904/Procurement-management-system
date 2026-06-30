/**
 * Purchase order GST — intra-state (CGST+SGST) vs inter-state (IGST)
 * based on buyer (ship-to / PO location) vs supplier GSTIN state codes.
 */

export function normalizeGstin(gstin) {
  const g = String(gstin || "")
    .trim()
    .toUpperCase()
    .replace(/\s/g, "");
  return g.length === 15 ? g : "";
}

export function gstStateCodeFromGstin(gstin) {
  const g = normalizeGstin(gstin);
  if (!g) return "";
  const code = g.slice(0, 2);
  return /^\d{2}$/.test(code) ? code : "";
}

function normalizeStateName(state) {
  return String(state || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** @returns {"intrastate"|"interstate"} */
export function resolveSupplyType({ buyerGstin, supplierGstin, buyerState, supplierState }) {
  const buyerCode = gstStateCodeFromGstin(buyerGstin);
  const supplierCode = gstStateCodeFromGstin(supplierGstin);
  if (buyerCode && supplierCode) {
    return buyerCode === supplierCode ? "intrastate" : "interstate";
  }
  const bState = normalizeStateName(buyerState);
  const sState = normalizeStateName(supplierState);
  if (bState && sState) {
    return bState === sState ? "intrastate" : "interstate";
  }
  return "intrastate";
}

export function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeTaxSplit(taxableAmount, gstRate, supplyType) {
  const taxable = Number(taxableAmount) || 0;
  const rate = Number(gstRate) || 0;
  if (taxable <= 0 || rate <= 0) {
    return {
      igstRate: 0,
      igstAmt: 0,
      cgstRate: 0,
      cgstAmt: 0,
      sgstRate: 0,
      sgstAmt: 0,
      totalTax: 0,
    };
  }
  if (supplyType === "interstate") {
    const igstAmt = roundMoney((taxable * rate) / 100);
    return {
      igstRate: rate,
      igstAmt,
      cgstRate: 0,
      cgstAmt: 0,
      sgstRate: 0,
      sgstAmt: 0,
      totalTax: igstAmt,
    };
  }
  const halfRate = rate / 2;
  const cgstAmt = roundMoney((taxable * halfRate) / 100);
  const sgstAmt = roundMoney((taxable * halfRate) / 100);
  return {
    igstRate: 0,
    igstAmt: 0,
    cgstRate: halfRate,
    cgstAmt,
    sgstRate: halfRate,
    sgstAmt,
    totalTax: roundMoney(cgstAmt + sgstAmt),
  };
}

function lineTaxableAmount(line) {
  const amount = Number(line.amount);
  if (Number.isFinite(amount) && amount >= 0) return amount;
  const qty = Number(line.qty) || 0;
  const rate = Number(line.rate) || 0;
  return roundMoney(qty * rate);
}

function mergeHsnBucket(map, key, row, tax) {
  const prev = map.get(key) || {
    hsnCode: row.hsnCode,
    gstRate: row.gstRate,
    taxableAmt: 0,
    igstRate: tax.igstRate,
    igstAmt: 0,
    cgstRate: tax.cgstRate,
    cgstAmt: 0,
    sgstRate: tax.sgstRate,
    sgstAmt: 0,
    totalTax: 0,
  };
  prev.taxableAmt = roundMoney(prev.taxableAmt + row.taxable);
  prev.igstAmt = roundMoney(prev.igstAmt + tax.igstAmt);
  prev.cgstAmt = roundMoney(prev.cgstAmt + tax.cgstAmt);
  prev.sgstAmt = roundMoney(prev.sgstAmt + tax.sgstAmt);
  prev.totalTax = roundMoney(prev.totalTax + tax.totalTax);
  map.set(key, prev);
}

const OTH_CHARGES_HSN = "OTH Charges";

/**
 * @param {object} params
 * @param {Array} params.lines PO lines with qty, rate, amount, hsnCode, gstRate
 * @param {Array} [params.incidentalExpenses]
 */
export function computePurchaseOrderGst({
  lines = [],
  incidentalExpenses = [],
  buyerGstin = "",
  supplierGstin = "",
  buyerState = "",
  supplierState = "",
}) {
  const supplyType = resolveSupplyType({ buyerGstin, supplierGstin, buyerState, supplierState });
  const activeLines = (lines || []).filter((l) => Number(l.qty) > 0);

  const maxGstRate =
    activeLines.reduce((max, line) => Math.max(max, Number(line.gstRate) || 0), 0) || 18;

  const enrichedLines = [];
  const hsnMap = new Map();
  let netGoods = 0;

  for (const line of activeLines) {
    const taxable = lineTaxableAmount(line);
    netGoods = roundMoney(netGoods + taxable);
    const tax = computeTaxSplit(taxable, line.gstRate, supplyType);
    const hsnCode = String(line.hsnCode || "").trim() || "—";
    const hKey = `${hsnCode}|${Number(line.gstRate) || 0}`;
    mergeHsnBucket(hsnMap, hKey, { hsnCode, gstRate: Number(line.gstRate) || 0, taxable }, tax);
    enrichedLines.push({
      ...line,
      amount: taxable,
      taxableAmount: taxable,
      ...tax,
    });
  }

  const totalIncidental = (incidentalExpenses || []).reduce((s, row) => {
    const n = Number(row.amount);
    return s + (Number.isNaN(n) ? 0 : n);
  }, 0);
  const incidentalRounded = roundMoney(totalIncidental);

  if (incidentalRounded > 0) {
    const tax = computeTaxSplit(incidentalRounded, maxGstRate, supplyType);
    mergeHsnBucket(
      hsnMap,
      `${OTH_CHARGES_HSN}|${maxGstRate}`,
      { hsnCode: OTH_CHARGES_HSN, gstRate: maxGstRate, taxable: incidentalRounded },
      tax
    );
  }

  const gstSummary = Array.from(hsnMap.values()).sort((a, b) =>
    String(a.hsnCode).localeCompare(String(b.hsnCode))
  );

  const totals = gstSummary.reduce(
    (acc, row) => ({
      taxable: roundMoney(acc.taxable + row.taxableAmt),
      igst: roundMoney(acc.igst + row.igstAmt),
      cgst: roundMoney(acc.cgst + row.cgstAmt),
      sgst: roundMoney(acc.sgst + row.sgstAmt),
      tax: roundMoney(acc.tax + row.totalTax),
    }),
    { taxable: 0, igst: 0, cgst: 0, sgst: 0, tax: 0 }
  );

  const rawTotal = roundMoney(totals.taxable + totals.tax);
  const rounded = Math.round(rawTotal);
  const roundOff = roundMoney(rounded - rawTotal);

  return {
    supplyType,
    buyerGstin: normalizeGstin(buyerGstin),
    supplierGstin: normalizeGstin(supplierGstin),
    buyerState: String(buyerState || "").trim(),
    supplierState: String(supplierState || "").trim(),
    netGoodsValue: netGoods,
    totalIncidental: incidentalRounded,
    totalTaxable: totals.taxable,
    totalIgst: totals.igst,
    totalCgst: totals.cgst,
    totalSgst: totals.sgst,
    totalTax: totals.tax,
    roundOff,
    totalPoValue: rounded,
    gstSummary,
    lines: enrichedLines,
  };
}

export function primarySupplierState(supplier) {
  if (!supplier) return "";
  const billing = Array.isArray(supplier.supplierBillingAddress)
    ? supplier.supplierBillingAddress[0]
    : null;
  const addr = Array.isArray(supplier.supplierAddress) ? supplier.supplierAddress[0] : null;
  return String(billing?.state || addr?.state || "").trim();
}
