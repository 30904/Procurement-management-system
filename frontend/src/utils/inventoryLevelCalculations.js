export function roundInv(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.round(x * 100) / 100;
}

export function calculateInventoryLevels(input = {}) {
  const avgMonthlyConsumption = Number(input.avgMonthlyConsumption);
  const workingDaysPerMonth = Number(input.workingDaysPerMonth);
  const procurementLeadTimeDays = Number(input.procurementLeadTimeDays);
  const procurementPeriodDays = Number(input.procurementPeriodDays);
  const procurementFrequency = Number(input.procurementFrequency);
  const safetyStockPeriodDays = Number(input.safetyStockPeriodDays ?? 0);

  if (Number.isNaN(avgMonthlyConsumption) || avgMonthlyConsumption < 0) {
    return { error: "Average Monthly Consumption must be zero or greater" };
  }
  if (!workingDaysPerMonth || workingDaysPerMonth <= 0) {
    return { error: "Working Days in a month must be greater than zero" };
  }
  if (!procurementFrequency || procurementFrequency <= 0) {
    return { error: "Procurement Frequency must be greater than zero" };
  }

  const adc = roundInv(avgMonthlyConsumption / workingDaysPerMonth);
  const safetyStock = roundInv(adc * safetyStockPeriodDays);
  const rol = roundInv(adc * procurementLeadTimeDays + safetyStock);
  const minLevel = safetyStock;
  const roq = roundInv((adc * procurementPeriodDays) / procurementFrequency);
  const maxLevel = roundInv(rol + roq);

  return {
    avgMonthlyConsumption: roundInv(avgMonthlyConsumption),
    workingDaysPerMonth,
    procurementLeadTimeDays,
    procurementPeriodDays,
    procurementFrequency,
    safetyStockPeriodDays,
    adc,
    safetyStock,
    rol,
    minLevel,
    roq,
    maxLevel,
  };
}

export const EMPTY_INVENTORY_LEVEL_INPUT = {
  avgMonthlyConsumption: "",
  workingDaysPerMonth: "",
  procurementLeadTimeDays: "",
  procurementPeriodDays: "",
  procurementFrequency: "",
  safetyStockPeriodDays: "",
};

export function inventoryInputFromRow(row) {
  const inv = row?.inventoryLevels || {};
  return {
    avgMonthlyConsumption:
      inv.avgMonthlyConsumption !== undefined && inv.avgMonthlyConsumption !== null
        ? String(inv.avgMonthlyConsumption)
        : "",
    workingDaysPerMonth:
      inv.workingDaysPerMonth !== undefined && inv.workingDaysPerMonth !== null
        ? String(inv.workingDaysPerMonth)
        : "",
    procurementLeadTimeDays:
      inv.procurementLeadTimeDays !== undefined && inv.procurementLeadTimeDays !== null
        ? String(inv.procurementLeadTimeDays)
        : "",
    procurementPeriodDays:
      inv.procurementPeriodDays !== undefined && inv.procurementPeriodDays !== null
        ? String(inv.procurementPeriodDays)
        : "",
    procurementFrequency:
      inv.procurementFrequency !== undefined && inv.procurementFrequency !== null
        ? String(inv.procurementFrequency)
        : "",
    safetyStockPeriodDays:
      inv.safetyStockPeriodDays !== undefined && inv.safetyStockPeriodDays !== null
        ? String(inv.safetyStockPeriodDays)
        : "",
  };
}
