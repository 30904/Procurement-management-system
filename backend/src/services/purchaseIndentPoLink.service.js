import { PurchaseIndent } from "../models/PurchaseIndent.model.js";
import { PurchaseOrder } from "../models/PurchaseOrder.model.js";
import { toObjectId } from "../utils/locationScope.js";

export function deriveProcurementStatus(indent) {
  const links = Array.isArray(indent?.linkedPurchaseOrders) ? indent.linkedPurchaseOrders : [];
  if (!links.length) {
    return {
      procurementStatus: "Awaiting PO",
      procurementHint: "Visible in Material Purchase Planning until a purchase order is raised.",
    };
  }
  const statuses = links.map((l) => String(l.poStatus || ""));
  const hasOpen = statuses.some((s) => ["Approved", "Partially Received"].includes(s));
  const hasDraft = statuses.some((s) => s === "Draft");
  const allClosed = statuses.length > 0 && statuses.every((s) => ["Closed", "Cancelled"].includes(s));

  if (allClosed) {
    return {
      procurementStatus: "PO closed",
      procurementHint: "All linked purchase orders are closed or cancelled.",
    };
  }
  if (hasOpen) {
    return {
      procurementStatus: "On order",
      procurementHint: "At least one linked PO is approved — goods may be in transit or receiving.",
    };
  }
  if (hasDraft) {
    return {
      procurementStatus: "PO draft",
      procurementHint: "A draft PO is linked — complete and approve the PO to place the order.",
    };
  }
  return {
    procurementStatus: "Linked to PO",
    procurementHint: "One or more purchase orders reference this indent.",
  };
}

export function enrichIndentProcurement(indent) {
  const links = Array.isArray(indent?.linkedPurchaseOrders) ? indent.linkedPurchaseOrders : [];
  const { procurementStatus, procurementHint } = deriveProcurementStatus(indent);
  return {
    ...indent,
    procurementStatus,
    procurementHint,
    linkedPoCount: links.length,
    linkedPoSummary: links.map((l) => l.poNo).filter(Boolean).join(", ") || "—",
  };
}

function normalizeIndentIdList(raw) {
  if (!Array.isArray(raw)) return [];
  const ids = raw
    .map((id) => toObjectId(id))
    .filter(Boolean);
  return [...new Set(ids.map(String))].map((id) => toObjectId(id));
}

export async function linkPurchaseOrderToIndents(companyId, indentIds, poDoc) {
  const ids = normalizeIndentIdList(indentIds);
  if (!ids.length || !poDoc?._id) return;

  const indents = await PurchaseIndent.find({
    company: companyId,
    _id: { $in: ids },
    status: "Approved",
  });

  if (!indents.length) return;

  const linkEntry = {
    poId: poDoc._id,
    poNo: poDoc.poNo ?? "",
    poStatus: poDoc.status ?? "Draft",
    poDate: poDoc.poDate,
    linkedAt: new Date(),
  };

  const indentNos = [];
  for (const indent of indents) {
    indentNos.push(indent.indentNo);
    const existing = (indent.linkedPurchaseOrders || []).some(
      (row) => String(row.poId) === String(poDoc._id)
    );
    if (!existing) {
      indent.linkedPurchaseOrders = [...(indent.linkedPurchaseOrders || []), linkEntry];
    } else {
      indent.linkedPurchaseOrders = (indent.linkedPurchaseOrders || []).map((row) =>
        String(row.poId) === String(poDoc._id)
          ? { ...row, poNo: linkEntry.poNo, poStatus: linkEntry.poStatus, poDate: linkEntry.poDate }
          : row
      );
    }
    await indent.save();
  }

  await PurchaseOrder.updateOne(
    { _id: poDoc._id, company: companyId },
    {
      $set: {
        sourceIndentIds: indents.map((i) => i._id),
        sourceIndentNos: indentNos,
      },
    }
  );
}

export async function syncIndentLinksForPoStatus(companyId, poDoc) {
  if (!poDoc?._id) return;
  const indentIds = [
    ...(poDoc.sourceIndentIds || []),
    ...(await PurchaseIndent.find({
      company: companyId,
      "linkedPurchaseOrders.poId": poDoc._id,
    }).distinct("_id")),
  ];

  const uniqueIds = [...new Set(indentIds.map(String))].map((id) => toObjectId(id));
  if (!uniqueIds.length) return;

  await PurchaseIndent.updateMany(
    { company: companyId, _id: { $in: uniqueIds }, "linkedPurchaseOrders.poId": poDoc._id },
    {
      $set: {
        "linkedPurchaseOrders.$.poStatus": poDoc.status ?? "Draft",
        "linkedPurchaseOrders.$.poNo": poDoc.poNo ?? "",
        "linkedPurchaseOrders.$.poDate": poDoc.poDate,
      },
    }
  );
}

export async function findApprovedIndentIdsForItem(companyId, locationFilter, itemId) {
  const itemOid = toObjectId(itemId);
  if (!itemOid) return [];

  const rows = await PurchaseIndent.find({
    ...locationFilter,
    status: "Approved",
    "lines.itemId": itemOid,
  })
    .select("_id indentNo")
    .lean();

  return rows.map((r) => ({ id: String(r._id), indentNo: r.indentNo }));
}
