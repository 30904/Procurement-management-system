import { parseEddForDisplay, parseEqtForDisplay } from "./purchaseOrderFormState.js";

/** Human-readable date from ISO `YYYY-MM-DD` or Date. */
export function formatPoLineDate(value) {
  if (value == null || value === "") return "—";
  const str = String(value).trim();
  if (!str || str.startsWith("{")) return "—";
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  return str;
}

/** Delivery schedule rows for tables (parsed JSON or single date). */
export function getEddSchedulesForDisplay(eddRaw, line = {}) {
  const parsed = parseEddForDisplay(eddRaw, line);
  const rows = (parsed.eddSchedules || []).filter(
    (s) => s?.deliveryDate || (s?.qty != null && String(s.qty).trim() !== "")
  );
  if (rows.length) {
    return rows.map((s, i) => ({
      scheduleNo: s.scheduleNo ?? i + 1,
      qty: s.qty != null && s.qty !== "" ? s.qty : "—",
      uom: s.uom || line.uom || "—",
      deliveryDate: s.deliveryDate || "",
    }));
  }
  if (parsed.edd) {
    return [
      {
        scheduleNo: 1,
        qty: line.qty != null && line.qty !== "" ? line.qty : "—",
        uom: line.uom || "—",
        deliveryDate: parsed.edd,
      },
    ];
  }
  return [];
}

export function hasMultipleEddSchedules(eddRaw, line = {}) {
  return getEddSchedulesForDisplay(eddRaw, line).length > 1;
}

export function formatEqtSummary(eqtRaw) {
  const { eqt, eqtPercent } = parseEqtForDisplay(eqtRaw);
  const parts = [];
  if (eqtPercent) parts.push(`${eqtPercent}% excess allowed`);
  if (eqt) parts.push(`threshold ${eqt}`);
  return parts.length ? parts.join(" · ") : "";
}
