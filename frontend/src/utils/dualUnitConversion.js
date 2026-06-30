/**
 * Dual unit: 1 primary (U1) = conversionFactor × secondary (U2).
 * Inventory levels are stored in the item's primary UoM.
 */

export function isDualUnitConfigured(dualUnit) {
  if (!dualUnit?.enabled) return false;
  const factor = Number(dualUnit.conversionFactor);
  return Boolean(dualUnit.primaryUnit && dualUnit.secondaryUnit) && factor > 0;
}

/** @param {'primary' | 'secondary'} view */
export function isSecondaryView(view) {
  return view === "secondary";
}

export function getDisplayUom(row, view = "primary") {
  const dual = row?.dualUnit;
  if (isSecondaryView(view) && isDualUnitConfigured(dual)) {
    return dual.secondaryUnit;
  }
  return row?.uom || dual?.primaryUnit || "";
}

export function convertStoredQtyToView(value, dualUnit, view = "primary") {
  if (value === null || value === undefined || value === "") return value;
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (!isSecondaryView(view) || !isDualUnitConfigured(dualUnit)) return n;
  const factor = Number(dualUnit.conversionFactor);
  return n * factor;
}

export function convertViewQtyToStored(value, dualUnit, view = "primary") {
  if (value === null || value === undefined || value === "") return value;
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (!isSecondaryView(view) || !isDualUnitConfigured(dualUnit)) return n;
  const factor = Number(dualUnit.conversionFactor);
  return n / factor;
}

export function toggleDucView(currentView) {
  return isSecondaryView(currentView) ? "primary" : "secondary";
}
