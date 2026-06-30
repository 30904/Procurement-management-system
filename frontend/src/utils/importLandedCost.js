/**
 * Landed cost for import POs — stored on PO poTerms.landedCost (same PurchaseOrder collection).
 * Configuration: supplier currency/INCOTerms on Supplier Master;
 * charge types via Data Management → Incidental Expenses (optional alignment).
 */

export const DEFAULT_LANDED_COST = {
  exchangeRate: "",
  freight: "",
  insurance: "",
  customsDuty: "",
  clearingCharges: "",
  portCharges: "",
  otherCharges: "",
};

export function emptyLandedCost() {
  return { ...DEFAULT_LANDED_COST };
}

export function landedCostFromPoTerms(poTerms = {}) {
  const lc = poTerms?.landedCost && typeof poTerms.landedCost === "object" ? poTerms.landedCost : {};
  return {
    exchangeRate: lc.exchangeRate ?? poTerms?.importMeta?.exchangeRate ?? "",
    freight: lc.freight ?? "",
    insurance: lc.insurance ?? "",
    customsDuty: lc.customsDuty ?? "",
    clearingCharges: lc.clearingCharges ?? "",
    portCharges: lc.portCharges ?? "",
    otherCharges: lc.otherCharges ?? "",
  };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Sum line amounts in supplier currency (qty × rate). */
export function sumLineGoodsValue(lines = []) {
  return lines.reduce((s, row) => {
    const qty = num(row.qty);
    if (qty <= 0) return s;
    const rate = num(row.rate);
    const amount = num(row.amount);
    return s + (amount > 0 ? amount : qty * rate);
  }, 0);
}

/**
 * Compute landed cost totals for display and persistence.
 * @param {{ lines, landedCost, currency, incidentalTotal? }} params
 */
export function computeImportLandedCost({
  lines = [],
  landedCost = {},
  currency = "USD",
  incidentalTotal = 0,
}) {
  const goodsValueFc = sumLineGoodsValue(lines);
  const cur = String(currency || "USD").trim().toUpperCase();
  const rate =
    cur === "INR"
      ? 1
      : Math.max(0, num(landedCost.exchangeRate)) || 1;

  const freight = num(landedCost.freight);
  const insurance = num(landedCost.insurance);
  const customsDuty = num(landedCost.customsDuty);
  const clearingCharges = num(landedCost.clearingCharges);
  const portCharges = num(landedCost.portCharges);
  const otherCharges = num(landedCost.otherCharges);

  const importChargesFc = freight + insurance + customsDuty + clearingCharges + portCharges + otherCharges;
  const goodsValueInr = goodsValueFc * rate;
  const importChargesInr = importChargesFc * rate;
  const incidentalInr = num(incidentalTotal) * (cur === "INR" ? 1 : rate);
  const totalLandedCostInr = goodsValueInr + importChargesInr + incidentalInr;

  return {
    currency: cur,
    exchangeRate: rate,
    goodsValueFc,
    importChargesFc,
    goodsValueInr,
    importChargesInr,
    incidentalInr,
    totalLandedCostInr,
    breakdown: {
      freight,
      insurance,
      customsDuty,
      clearingCharges,
      portCharges,
      otherCharges,
    },
  };
}

export function formatFc(amount, currency = "USD") {
  const cur = String(currency || "USD").toUpperCase();
  const sym = cur === "INR" ? "₹" : cur === "USD" ? "$" : cur === "EUR" ? "€" : `${cur} `;
  return `${sym}${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
