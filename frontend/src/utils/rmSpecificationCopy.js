export const RM_SPEC_COPY_STORAGE_KEY = "celeris_rm_spec_copy";

export function readRmSpecCopyBuffer() {
  try {
    const raw = sessionStorage.getItem(RM_SPEC_COPY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeRmSpecCopyBuffer(lines, meta = {}) {
  sessionStorage.setItem(
    RM_SPEC_COPY_STORAGE_KEY,
    JSON.stringify({
      lines,
      inspectionStandard: meta.inspectionStandard ?? "",
      inspectionChecklist: meta.inspectionChecklist ?? [],
      fromItemNo: meta.itemNo ?? "",
      fromItemName: meta.itemName ?? "",
      copiedAt: Date.now(),
    })
  );
}

export function clearRmSpecCopyBuffer() {
  sessionStorage.removeItem(RM_SPEC_COPY_STORAGE_KEY);
}
