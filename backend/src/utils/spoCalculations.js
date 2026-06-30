export function roundMoney(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.round(x * 100) / 100;
}

export function financialYearSuffix(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const start = m >= 4 ? y : y - 1;
  const end = start + 1;
  return `${String(start).slice(-2)}-${String(end).slice(-2)}`;
}

export function normalizeSpoLine(row, index = 0) {
  const qty = Number(row.qty) || 0;
  const rate = Number(row.rate) || 0;
  const discPercent = Math.min(100, Math.max(0, Number(row.discPercent) || 0));
  const netRate = roundMoney(rate * (1 - discPercent / 100));
  const lineValue = roundMoney(qty * netRate);
  const gstRate = Number(row.gstRate) || 0;
  const taxable = lineValue;
  const gstAmount = roundMoney((taxable * gstRate) / 100);

  return {
    lineNo: row.lineNo || index + 1,
    serviceId: row.serviceId || undefined,
    serviceNo: String(row.serviceNo ?? "").trim(),
    sacCode: String(row.sacCode ?? "").trim(),
    description: String(row.description ?? "").trim(),
    serviceDetails: String(row.serviceDetails ?? "").trim(),
    gstRate,
    qty,
    rate,
    discPercent,
    netRate,
    lineValue,
    taxableAmount: taxable,
    gstAmount,
    serviceScheduleDate: row.serviceScheduleDate ? new Date(row.serviceScheduleDate) : undefined,
  };
}

export function computeSpoValue(lines = []) {
  let totalTaxable = 0;
  let totalGst = 0;
  for (const line of lines) {
    const taxable = Number(line.lineValue) || 0;
    const gstRate = Number(line.gstRate) || 0;
    totalTaxable += taxable;
    totalGst += roundMoney((taxable * gstRate) / 100);
  }
  totalTaxable = roundMoney(totalTaxable);
  totalGst = roundMoney(totalGst);
  return {
    totalTaxable,
    totalGst,
    totalSpoValue: roundMoney(totalTaxable + totalGst),
  };
}
