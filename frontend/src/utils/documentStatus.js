const STATUS_TONE_MAP = {
  draft: "draft",
  submitted: "submitted",
  approved: "approved",
  rejected: "rejected",
  posted: "posted",
  cancelled: "cancelled",
  canceled: "cancelled",
  closed: "closed",
  completed: "completed",
  fulfilled: "completed",
  open: "submitted",
  pending: "submitted",
  active: "approved",
  inactive: "cancelled",
  awarded: "approved",
  expired: "cancelled",
};

/** @param {string} [status] */
export function resolveDocumentStatusTone(status) {
  const key = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return STATUS_TONE_MAP[key] || "default";
}
