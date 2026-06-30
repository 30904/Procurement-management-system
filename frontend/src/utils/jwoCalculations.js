export function roundMoney(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.round(x * 100) / 100;
}

export function normalizeJwoLine(row, index = 0) {
  const qty = Number(row.qty) || 0;
  const rate = Number(row.rate) || 0;
  const jwoAmount = roundMoney(qty * rate);
  const gstRate = Number(row.gstRate) || 0;

  return {
    lineNo: row.lineNo || index + 1,
    jwiId: row.jwiId,
    jwiNo: String(row.jwiNo ?? "").trim(),
    jwiItemName: String(row.jwiItemName ?? "").trim(),
    jwiItemDescription: String(row.jwiItemDescription ?? "").trim(),
    serviceDescription: String(row.serviceDescription ?? "").trim(),
    sacCode: String(row.sacCode ?? "").trim(),
    uom: String(row.uom ?? "").trim(),
    gstRate,
    qty,
    rate,
    jwoAmount,
    scheduleDate: row.scheduleDate || "",
  };
}

export function computeJwoValue(lines = []) {
  let totalTaxable = 0;
  let totalGst = 0;
  for (const line of lines) {
    const taxable = Number(line.jwoAmount) || 0;
    const gstRate = Number(line.gstRate) || 0;
    totalTaxable += taxable;
    totalGst += roundMoney((taxable * gstRate) / 100);
  }
  totalTaxable = roundMoney(totalTaxable);
  totalGst = roundMoney(totalGst);
  return {
    totalTaxable,
    totalGst,
    totalJwoValue: roundMoney(totalTaxable + totalGst),
  };
}
