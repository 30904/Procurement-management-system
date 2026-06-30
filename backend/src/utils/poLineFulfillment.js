/**
 * PO line fulfillment: ordered qty, received (GRN), cancelled (short-close), balance.
 * Header grnStatus is derived from line states.
 */

export function deriveLineGrnStatus(qty, receivedQty, cancelledQty) {
  const q = Number(qty) || 0;
  const received = Number(receivedQty) || 0;
  const cancelled = Number(cancelledQty) || 0;
  if (q <= 0) return "Open";
  if (cancelled > 0 && received + cancelled >= q) return "Short Closed";
  if (received <= 0) return "Open";
  if (received >= q) return "Complete";
  return "Partial";
}

export function computeBalanceQty(qty, receivedQty, cancelledQty) {
  const q = Number(qty) || 0;
  const received = Number(receivedQty) || 0;
  const cancelled = Number(cancelledQty) || 0;
  return Math.max(0, Math.round((q - received - cancelled) * 1000) / 1000);
}

export function enrichPoLine(line) {
  const qty = Number(line.qty) || 0;
  const receivedQty = Number(line.receivedQty) || 0;
  const cancelledQty = Number(line.cancelledQty) || 0;
  const balanceQty = computeBalanceQty(qty, receivedQty, cancelledQty);
  const lineGrnStatus = deriveLineGrnStatus(qty, receivedQty, cancelledQty);
  return {
    ...line,
    qty,
    receivedQty,
    cancelledQty,
    balanceQty,
    lineGrnStatus,
  };
}

export function derivePoGrnStatus(lines) {
  const rows = Array.isArray(lines) ? lines : [];
  if (!rows.length) return "Not Started";
  const states = rows.map((l) => l.lineGrnStatus || deriveLineGrnStatus(l.qty, l.receivedQty, l.cancelledQty));
  if (states.every((s) => s === "Open")) return "Not Started";
  if (states.every((s) => s === "Complete" || s === "Short Closed")) {
    return states.some((s) => s === "Short Closed") ? "Short Closed" : "Complete";
  }
  return "Partial";
}

export function derivePoHeaderStatusFromGrn(poStatus, grnStatus) {
  if (poStatus === "Cancelled" || poStatus === "Draft" || poStatus === "Approved") {
    if (grnStatus === "Complete" || grnStatus === "Short Closed") return "Closed";
    if (grnStatus === "Partial") return "Partially Received";
  }
  return poStatus;
}

export function lineMatchKey(line) {
  if (line?.lineNo != null) return `ln:${line.lineNo}`;
  if (line?.itemId) return `item:${String(line.itemId)}`;
  return `itemNo:${String(line.itemNo || "")}`;
}
