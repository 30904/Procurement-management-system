import { formatPrintDate, formatPrintMoney, formatLocationAddress, primaryContact } from "./poPrintHelpers.js";

export { formatPrintDate, formatPrintMoney, formatLocationAddress, primaryContact };

export function logisticsProviderBlock(provider) {
  if (!provider) {
    return { lines: ["—"], phone: "", email: "", gstin: "" };
  }
  const addr =
    Array.isArray(provider.lspAddress) && provider.lspAddress.length
      ? provider.lspAddress[0]
      : null;
  const lines = [
    provider.lspNameLegalEntity || provider.lspNickName || "",
    addr
      ? [addr.line1, addr.line2, addr.city, addr.district, addr.state, addr.pinCode]
          .filter(Boolean)
          .join(", ")
      : "",
  ].filter(Boolean);
  const contact =
    Array.isArray(provider.lspContacts) && provider.lspContacts.length
      ? provider.lspContacts[0]
      : null;
  return {
    lines: lines.length ? lines : ["—"],
    phone: contact?.mobile || "",
    email: contact?.email || "",
    gstin: provider.gstin || provider.lspGstin || "",
  };
}

/** Minimum line rows on SPO print (pad with blanks when fewer service lines exist). */
export const SPO_PRINT_MIN_LINE_ROWS = 6;

function blankSpoPrintLineRow(index) {
  return {
    key: `pad-${index}`,
    pad: true,
    description: "",
    sacCode: "",
    gstRate: null,
    qty: "",
    rate: "",
    disc: "",
    netRate: "",
    lineValue: "",
    scheduleDate: "",
  };
}

export function buildSpoPrintLineRows(spo) {
  const lines = Array.isArray(spo?.lines) ? spo.lines : [];
  const rows = lines.map((line, index) => ({
    key: `${line.lineNo ?? index}`,
    pad: false,
    description: [line.description, line.serviceDetails].filter(Boolean).join("\n"),
    sacCode: line.sacCode || "",
    gstRate: Number(line.gstRate) || 0,
    qty: formatPrintMoney(line.qty, "0.00"),
    rate: formatPrintMoney(line.rate),
    disc: line.discPercent != null ? `${Number(line.discPercent)}%` : "",
    netRate: formatPrintMoney(line.netRate),
    lineValue: formatPrintMoney(line.lineValue),
    scheduleDate: line.serviceScheduleDate ? formatPrintDate(line.serviceScheduleDate) : "",
  }));
  while (rows.length < SPO_PRINT_MIN_LINE_ROWS) {
    rows.push(blankSpoPrintLineRow(rows.length));
  }
  return rows;
}

export function buildSpoGstSummaryRows(spo) {
  const lines = Array.isArray(spo?.lines) ? spo.lines : [];
  const bySac = new Map();
  for (const line of lines) {
    const sac = String(line.sacCode || "—");
    const taxable = Number(line.lineValue) || 0;
    const gstRate = Number(line.gstRate) || 0;
    const gstAmt = Math.round(((taxable * gstRate) / 100) * 100) / 100;
    const prev = bySac.get(sac) || { sacCode: sac, taxableAmt: 0, gstRate, gstAmt: 0 };
    prev.taxableAmt += taxable;
    prev.gstAmt += gstAmt;
    bySac.set(sac, prev);
  }
  const rows = [...bySac.values()];
  return rows.length ? rows : [{ sacCode: "—", taxableAmt: 0, gstRate: 0, gstAmt: 0 }];
}
