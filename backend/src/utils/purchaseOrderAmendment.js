/** Build a compact change list for amendment history. */
export function buildAmendmentChangeSummary(before = {}, after = {}) {
  const changes = [];
  const pairs = [
    ["totalPoValue", "Total PO Value", before.poValue?.totalPoValue, after.poValue?.totalPoValue],
    ["currency", "Currency", before.currency, after.currency],
    ["poType", "PO Type", before.poType, after.poType],
    ["orderReferenceNo", "Order Reference", before.orderReferenceNo, after.orderReferenceNo],
    ["remarks", "Remarks", before.remarks, after.remarks],
  ];
  for (const [, label, from, to] of pairs) {
    const f = from ?? "";
    const t = to ?? "";
    if (String(f) !== String(t)) {
      changes.push({ field: label, from: f, to: t });
    }
  }
  const beforeLines = Array.isArray(before.lines) ? before.lines.length : 0;
  const afterLines = Array.isArray(after.lines) ? after.lines.length : 0;
  if (beforeLines !== afterLines) {
    changes.push({ field: "Line count", from: beforeLines, to: afterLines });
  }
  return changes;
}

export function amendmentRevisionLabel(revNo) {
  const n = Number(revNo) || 0;
  if (n <= 0) return "—";
  return String(n);
}
