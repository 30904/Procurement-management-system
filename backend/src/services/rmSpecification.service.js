import { ItemMaster } from "../models/ItemMaster.model.js";
import { INSPECTION_STANDARD_STANDARD_SPEC } from "../config/inspectionStandard.js";
import { AppError } from "../utils/AppError.js";

function formatQclShort(level) {
  const text = String(level ?? "").trim();
  if (!text) return "";
  const match = text.match(/^(L\d+)/i);
  return match ? match[1].toUpperCase() : text;
}

function mapRmSpecLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map((line) => ({
    standardSpecificationId: line.standardSpecificationId ? String(line.standardSpecificationId) : "",
    specId: line.specId ?? "",
    sequence: Number(line.sequence ?? 0),
    inspectionParameter: line.inspectionParameter ?? "",
    uom: line.uom ?? "",
    testStandard: line.testStandard ?? "",
    testMethod: line.testMethod ?? "",
    specValue: line.specValue ?? "",
    ltl: line.ltl ?? "",
    utl: line.utl ?? "",
  }));
}

function mapInspectionChecklist(items) {
  if (!Array.isArray(items)) return [];
  return items.map((row) => ({
    inspectionChecklistId: row.inspectionChecklistId ? String(row.inspectionChecklistId) : "",
    checklistId: row.checklistId ?? "",
    checklistItem: row.checklistItem ?? "",
    displayOrder: Number(row.displayOrder ?? 0),
    sequence: Number(row.sequence ?? 0),
    selected: Boolean(row.selected),
  }));
}

function mapSummaryRow(doc) {
  const qcl = doc.incomingQcl && typeof doc.incomingQcl === "object" ? doc.incomingQcl : {};
  const rm = doc.rmSpecification && typeof doc.rmSpecification === "object" ? doc.rmSpecification : {};
  const lines = mapRmSpecLines(rm.lines);
  const rmConfigured = Boolean(rm.configured) || lines.length > 0;

  return {
    id: String(doc._id),
    _id: String(doc._id),
    itemNo: doc.itemNo,
    itemName: doc.itemName,
    itemDescription: doc.itemDescription,
    uom: doc.uom,
    itemCategory: doc.itemCategory,
    itemQcl: formatQclShort(qcl.qclLevel),
    itemQclFull: qcl.qclLevel || "",
    idcConfigured: rmConfigured,
    rmSpecConfigured: rmConfigured,
    rmSpecLineCount: lines.length,
    revNumber: Number(rm.revNumber || 0),
    status: doc.status || "Active",
  };
}

export async function listRmSpecificationItems(companyId, { rmFilter, category } = {}) {
  const query = { company: companyId, status: "Active" };
  if (category) query.itemCategory = category;

  const docs = await ItemMaster.find(query).sort({ itemNo: 1 }).lean();
  let rows = docs.map(mapSummaryRow);

  if (rmFilter === "with") rows = rows.filter((r) => r.rmSpecConfigured);
  if (rmFilter === "without") rows = rows.filter((r) => !r.rmSpecConfigured);

  return rows;
}

export async function getRmSpecificationStatusSummary(companyId) {
  const rows = await listRmSpecificationItems(companyId);
  const withRm = rows.filter((r) => r.rmSpecConfigured).length;
  return {
    total: rows.length,
    withRmSpecification: withRm,
    withoutRmSpecification: rows.length - withRm,
  };
}

export async function getRmSpecification(companyId, itemId) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId, status: "Active" }).lean();
  if (!doc) throw new AppError("Active item not found", 404, "NOT_FOUND");

  const qcl = doc.incomingQcl && typeof doc.incomingQcl === "object" ? doc.incomingQcl : {};
  const rm = doc.rmSpecification && typeof doc.rmSpecification === "object" ? doc.rmSpecification : {};

  return {
    id: String(doc._id),
    itemNo: doc.itemNo,
    itemCategory: doc.itemCategory,
    itemName: doc.itemName,
    itemDescription: doc.itemDescription,
    uom: doc.uom,
    hsnCode: doc.hsnCode,
    inventoryStore: doc.inventoryStore,
    status: doc.status,
    itemQcl: qcl.qclLevel || "",
    rmSpecification: {
      inspectionStandard: rm.inspectionStandard || "",
      lines: mapRmSpecLines(rm.lines),
      inspectionChecklist: mapInspectionChecklist(rm.inspectionChecklist),
      configured: Boolean(rm.configured) || (Array.isArray(rm.lines) && rm.lines.length > 0),
      revNumber: Number(rm.revNumber || 0),
      revisionHistory: Array.isArray(rm.revisionHistory) ? rm.revisionHistory : [],
    },
  };
}

function normalizeLines(body) {
  const raw = Array.isArray(body?.lines) ? body.lines : [];
  return raw
    .map((line, index) => ({
      standardSpecificationId: line.standardSpecificationId || undefined,
      specId: String(line.specId ?? "").trim(),
      sequence: Number(line.sequence ?? (index + 1) * 10),
      inspectionParameter: String(line.inspectionParameter ?? "").trim(),
      uom: String(line.uom ?? "").trim(),
      testStandard: String(line.testStandard ?? "").trim(),
      testMethod: String(line.testMethod ?? "").trim(),
      specValue: String(line.specValue ?? "").trim(),
      ltl: String(line.ltl ?? "").trim(),
      utl: String(line.utl ?? "").trim(),
    }))
    .filter((line) => line.specId || line.inspectionParameter)
    .sort((a, b) => a.sequence - b.sequence);
}

function normalizeInspectionChecklist(body) {
  const raw = Array.isArray(body?.inspectionChecklist) ? body.inspectionChecklist : [];
  return raw
    .map((row) => ({
      inspectionChecklistId: row.inspectionChecklistId || undefined,
      checklistId: String(row.checklistId ?? "").trim(),
      checklistItem: String(row.checklistItem ?? "").trim(),
      displayOrder: Number(row.displayOrder ?? 0),
      sequence: Number(row.sequence ?? 0),
      selected: Boolean(row.selected),
    }))
    .filter((row) => row.checklistItem);
}

function parseRevisionInfo(revisionInfo, actor) {
  const reason = String(revisionInfo?.reason ?? "").trim();
  const proposedBy = String(revisionInfo?.proposedBy ?? "").trim();
  const approvedBy = String(revisionInfo?.approvedBy ?? "").trim();

  if (!reason) throw new AppError("Revision reason is required", 400, "VALIDATION_ERROR");
  if (!proposedBy) throw new AppError("Revision proposed by is required", 400, "VALIDATION_ERROR");
  if (!approvedBy) throw new AppError("Revision approved by is required", 400, "VALIDATION_ERROR");

  const revisionDate = revisionInfo?.revisionDate ? new Date(revisionInfo.revisionDate) : new Date();
  if (Number.isNaN(revisionDate.getTime())) {
    throw new AppError("Invalid revision date", 400, "VALIDATION_ERROR");
  }

  return {
    reason,
    proposedBy,
    approvedBy,
    revisionDate,
    changedBy: {
      userId: actor?.userId || undefined,
      name: String(actor?.name ?? "").trim(),
      userName: String(actor?.userName ?? "").trim(),
      userEmail: String(actor?.userEmail ?? "").trim(),
    },
  };
}

function linesSnapshot(lines) {
  return JSON.stringify(
    (lines || []).map((l) => ({
      specId: l.specId,
      sequence: l.sequence,
      inspectionParameter: l.inspectionParameter,
      uom: l.uom,
      testStandard: l.testStandard,
      testMethod: l.testMethod,
      specValue: l.specValue,
      ltl: l.ltl,
      utl: l.utl,
    }))
  );
}

function rmSnapshot(rm) {
  return JSON.stringify({
    inspectionStandard: rm?.inspectionStandard ?? "",
    lines: linesSnapshot(mapRmSpecLines(rm?.lines)),
    checklist: (rm?.inspectionChecklist || [])
      .filter((c) => c.selected)
      .map((c) => c.checklistId)
      .sort(),
  });
}

function isStandardSpecType(inspectionStandard) {
  const text = String(inspectionStandard ?? "").trim();
  return text === INSPECTION_STANDARD_STANDARD_SPEC || text.startsWith("Standard Specification");
}

export async function saveRmSpecification(companyId, itemId, body, actor) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId, status: "Active" });
  if (!doc) throw new AppError("Active item not found", 404, "NOT_FOUND");

  const inspectionStandard = String(body?.inspectionStandard ?? "").trim();
  if (!inspectionStandard) {
    throw new AppError("Inspection Standard is required", 400, "VALIDATION_ERROR");
  }

  const nextLines = normalizeLines(body);
  const nextChecklist = normalizeInspectionChecklist(body);

  if (isStandardSpecType(inspectionStandard) && !nextLines.length) {
    throw new AppError("Add at least one specification line", 400, "VALIDATION_ERROR");
  }

  const rm = doc.rmSpecification && typeof doc.rmSpecification === "object" ? doc.rmSpecification : {};
  const prevLines = mapRmSpecLines(rm.lines);
  const prevSnap = rmSnapshot({
    inspectionStandard: rm.inspectionStandard,
    lines: prevLines,
    inspectionChecklist: mapInspectionChecklist(rm.inspectionChecklist),
  });
  const nextSnap = rmSnapshot({
    inspectionStandard,
    lines: nextLines,
    inspectionChecklist: nextChecklist,
  });
  const hasRevision = body?.revisionInfo && prevSnap !== nextSnap;

  if (prevSnap !== nextSnap && !body?.revisionInfo && Number(rm.revNumber || 0) > 0) {
    throw new AppError("Revision details are required when changing RM specification", 400, "REVISION_REQUIRED");
  }

  if (!doc.rmSpecification || typeof doc.rmSpecification !== "object") {
    doc.rmSpecification = {
      inspectionStandard: "",
      lines: [],
      inspectionChecklist: [],
      configured: false,
      revNumber: 0,
      revisionHistory: [],
    };
  }

  if (hasRevision) {
    const revision = parseRevisionInfo(body.revisionInfo, actor);
    const nextRev = Number(doc.rmSpecification.revNumber || 0) + 1;
    doc.rmSpecification.revNumber = nextRev;
    doc.rmSpecification.revisionHistory.push({
      revisionNo: nextRev,
      revisionDate: revision.revisionDate,
      reason: revision.reason,
      proposedBy: revision.proposedBy,
      approvedBy: revision.approvedBy,
      changedBy: revision.changedBy,
      changedAt: new Date(),
      changes: [
        {
          field: "rmSpecification",
          from: `Rev ${Number(rm.revNumber || 0)}`,
          to: `Updated (${nextLines.length} line(s))`,
        },
      ],
    });
    if (doc.rmSpecification.revisionHistory.length > 200) {
      doc.rmSpecification.revisionHistory = doc.rmSpecification.revisionHistory.slice(-200);
    }
  }

  doc.rmSpecification.inspectionStandard = inspectionStandard;
  doc.rmSpecification.lines = isStandardSpecType(inspectionStandard) ? nextLines : [];
  doc.rmSpecification.inspectionChecklist = nextChecklist;
  doc.rmSpecification.configured = true;
  doc.rmSpecification.updatedAt = new Date();
  doc.rmSpecification.updatedBy = actor?.userId;
  doc.updatedBy = actor?.userId;
  await doc.save();
  return getRmSpecification(companyId, itemId);
}

function cloneRmSpecificationPayload(rm) {
  const src = rm && typeof rm === "object" ? rm : {};
  return {
    inspectionStandard: String(src.inspectionStandard ?? "").trim(),
    lines: mapRmSpecLines(src.lines).map((line) => ({ ...line })),
    inspectionChecklist: mapInspectionChecklist(src.inspectionChecklist).map((row) => ({ ...row })),
  };
}

function targetHasRmSpecification(rm) {
  if (!rm || typeof rm !== "object") return false;
  return Boolean(rm.configured) || (Array.isArray(rm.lines) && rm.lines.length > 0);
}

export async function applyRmSpecificationCopy(
  companyId,
  sourceItemId,
  targetItemIds,
  actor,
  { overrideExisting = false } = {}
) {
  const sourceDoc = await ItemMaster.findOne({
    _id: sourceItemId,
    company: companyId,
    status: "Active",
  });
  if (!sourceDoc) throw new AppError("Source item not found", 404, "NOT_FOUND");

  const srcRm = sourceDoc.rmSpecification && typeof sourceDoc.rmSpecification === "object"
    ? sourceDoc.rmSpecification
    : {};
  if (!targetHasRmSpecification(srcRm)) {
    throw new AppError("Source item has no RM specification to copy", 400, "VALIDATION_ERROR");
  }

  const snapshot = cloneRmSpecificationPayload(srcRm);
  const uniqueTargets = [
    ...new Set((Array.isArray(targetItemIds) ? targetItemIds : []).map((id) => String(id).trim())),
  ].filter((id) => id && id !== String(sourceItemId));

  if (!uniqueTargets.length) {
    throw new AppError("Select at least one target item", 400, "VALIDATION_ERROR");
  }

  const applied = [];
  const skipped = [];

  for (const targetId of uniqueTargets) {
    const doc = await ItemMaster.findOne({ _id: targetId, company: companyId, status: "Active" });
    if (!doc) {
      skipped.push({ id: targetId, reason: "NOT_FOUND" });
      continue;
    }

    const trm = doc.rmSpecification && typeof doc.rmSpecification === "object" ? doc.rmSpecification : {};
    if (targetHasRmSpecification(trm) && !overrideExisting) {
      skipped.push({
        id: String(doc._id),
        itemNo: doc.itemNo,
        itemName: doc.itemName,
        reason: "HAS_EXISTING",
      });
      continue;
    }

    if (!doc.rmSpecification || typeof doc.rmSpecification !== "object") {
      doc.rmSpecification = {
        inspectionStandard: "",
        lines: [],
        inspectionChecklist: [],
        configured: false,
        revNumber: 0,
        revisionHistory: [],
      };
    }

    doc.rmSpecification.inspectionStandard = snapshot.inspectionStandard;
    doc.rmSpecification.lines = snapshot.lines.map((line) => ({ ...line }));
    doc.rmSpecification.inspectionChecklist = snapshot.inspectionChecklist.map((row) => ({ ...row }));
    doc.rmSpecification.configured = true;
    doc.rmSpecification.updatedAt = new Date();
    doc.rmSpecification.updatedBy = actor?.userId;
    doc.updatedBy = actor?.userId;
    await doc.save();

    applied.push({
      id: String(doc._id),
      itemNo: doc.itemNo,
      itemName: doc.itemName,
    });
  }

  return {
    sourceItemId: String(sourceItemId),
    sourceItemNo: sourceDoc.itemNo,
    applied,
    skipped,
  };
}

function emptyRmSpecification(userId) {
  return {
    inspectionStandard: "",
    lines: [],
    inspectionChecklist: [],
    configured: false,
    revNumber: 0,
    revisionHistory: [],
    updatedAt: new Date(),
    updatedBy: userId,
  };
}

function itemHasRmSpecification(rm) {
  if (!rm || typeof rm !== "object") return false;
  return Boolean(rm.configured) || (Array.isArray(rm.lines) && rm.lines.length > 0);
}

/** Removes RM specification data only — the Item Master row is kept. */
export async function deleteRmSpecification(companyId, itemId, userId) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId, status: "Active" });
  if (!doc) throw new AppError("Active item not found", 404, "NOT_FOUND");

  const rm = doc.rmSpecification && typeof doc.rmSpecification === "object" ? doc.rmSpecification : {};
  if (!itemHasRmSpecification(rm)) {
    throw new AppError("No RM specification to delete for this item", 400, "VALIDATION_ERROR");
  }

  const empty = emptyRmSpecification(userId);
  await ItemMaster.updateOne(
    { _id: itemId, company: companyId, status: "Active" },
    {
      $set: {
        rmSpecification: empty,
        updatedBy: userId,
      },
    }
  );

  return {
    deleted: true,
    id: String(itemId),
    itemNo: doc.itemNo,
    itemName: doc.itemName,
    itemRetained: true,
  };
}

/** @deprecated Use deleteRmSpecification */
export async function clearRmSpecification(companyId, itemId, userId) {
  return deleteRmSpecification(companyId, itemId, userId);
}
