/** Round to 2 decimal places for display/storage. */
export function roundInv(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.round(x * 100) / 100;
}

/**
 * Inventory level formulas (Smart ERP / planning INL).
 * ADC = AMC / working days
 * Safety Stock = ADC × safety stock period
 * ROL = (ADC × lead time) + safety stock
 * Min = safety stock
 * ROQ = (ADC × procurement period) / procurement frequency
 * Max = ROL + ROQ
 */
export function calculateInventoryLevels(input = {}) {
  const avgMonthlyConsumption = Number(input.avgMonthlyConsumption);
  const workingDaysPerMonth = Number(input.workingDaysPerMonth);
  const procurementLeadTimeDays = Number(input.procurementLeadTimeDays);
  const procurementPeriodDays = Number(input.procurementPeriodDays);
  const procurementFrequency = Number(input.procurementFrequency);
  const safetyStockPeriodDays = Number(input.safetyStockPeriodDays ?? 0);

  if (Number.isNaN(avgMonthlyConsumption) || avgMonthlyConsumption < 0) {
    throw new Error("Average Monthly Consumption must be zero or greater");
  }
  if (!workingDaysPerMonth || workingDaysPerMonth <= 0) {
    throw new Error("Working Days in a month must be greater than zero");
  }
  if (Number.isNaN(procurementLeadTimeDays) || procurementLeadTimeDays < 0) {
    throw new Error("Procurement Lead Time must be zero or greater");
  }
  if (Number.isNaN(procurementPeriodDays) || procurementPeriodDays < 0) {
    throw new Error("Procurement Period must be zero or greater");
  }
  if (!procurementFrequency || procurementFrequency <= 0) {
    throw new Error("Procurement Frequency must be greater than zero");
  }
  if (Number.isNaN(safetyStockPeriodDays) || safetyStockPeriodDays < 0) {
    throw new Error("Safety Stock Period must be zero or greater");
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

export function hasInventoryLevelData(doc) {
  if (!doc?.inventoryLevels?.configured) return false;
  const { minLevel, maxLevel, rol } = doc.inventoryLevels;
  return [minLevel, maxLevel, rol].some((v) => v !== undefined && v !== null && v !== "");
}
