import { INSPECTION_STANDARD_STANDARD_SPEC } from "../config/inspectionStandardDefaults.js";

export function isStandardSpecInspectionType(value) {
  const v = String(value ?? "").trim();
  return v === INSPECTION_STANDARD_STANDARD_SPEC || v.startsWith("Standard Specification");
}

export function buildLinesFromStandardSpecs(stdSpecs, existingLines = []) {
  const byKey = new Map();
  for (const line of existingLines) {
    if (line.standardSpecificationId) byKey.set(String(line.standardSpecificationId), line);
    if (line.specId) byKey.set(String(line.specId), line);
  }

  return (stdSpecs || []).map((spec, index) => {
    const id = String(spec._id || spec.id || "");
    const prev = byKey.get(id) || byKey.get(spec.specId);
    return {
      standardSpecificationId: id,
      specId: spec.specId ?? "",
      sequence: Number(prev?.sequence ?? (index + 1) * 10),
      inspectionParameter: spec.inspectionParameter ?? "",
      uom: spec.uom ?? "",
      testStandard: spec.testStandard ?? "",
      testMethod: spec.testMethod ?? "",
      specValue: prev?.specValue ?? "",
      ltl: prev?.ltl ?? "",
      utl: prev?.utl ?? "",
    };
  });
}

export function buildChecklistRows(masterRows, savedRows = []) {
  const savedMap = new Map();
  for (const row of savedRows) {
    if (row.inspectionChecklistId) savedMap.set(String(row.inspectionChecklistId), row);
    if (row.checklistId) savedMap.set(String(row.checklistId), row);
  }

  return (masterRows || [])
    .filter((r) => r.status !== "Inactive")
    .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
    .map((m, index) => {
      const id = String(m._id || m.id || "");
      const saved = savedMap.get(id) || savedMap.get(m.checklistId);
      return {
        inspectionChecklistId: id,
        checklistId: m.checklistId ?? "",
        checklistItem: m.checklistItem ?? "",
        displayOrder: Number(m.displayOrder ?? index + 1),
        sequence: Number(saved?.sequence ?? (index + 1) * 10),
        selected: Boolean(saved?.selected),
      };
    });
}

export function sortRmSpecLines(lines) {
  return [...(lines || [])].sort(
    (a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)
  );
}
