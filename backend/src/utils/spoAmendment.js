/** Build a compact change list for SPO amendment history. */
export function buildSpoAmendmentChangeSummary(before = {}, after = {}) {
  const changes = [];
  const pairs = [
    ["totalSpoValue", "Total SPO Value", before.spoValue?.totalSpoValue, after.spoValue?.totalSpoValue],
    ["currency", "Currency", before.currency, after.currency],
    ["serviceCategory", "Service Category", before.serviceCategory, after.serviceCategory],
    ["orderReferenceNo", "Order Reference", before.orderReferenceNo, after.orderReferenceNo],
    ["spoRemarks", "SPO Remarks", before.spoRemarks, after.spoRemarks],
    ["paymentTerms", "Payment Terms", before.paymentTerms, after.paymentTerms],
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
