import mongoose from "mongoose";
import { PurchaseIndent } from "../models/PurchaseIndent.model.js";
import { PurchaseOrder } from "../models/PurchaseOrder.model.js";
import { StockBalance } from "../models/StockBalance.model.js";
import { ItemMaster } from "../models/ItemMaster.model.js";
import { ItemSupplierLink } from "../models/ItemSupplierLink.model.js";
import { scopedListFilter } from "./transactionBase.service.js";

const OPEN_PO_STATUSES = ["Approved", "Partially Received"];

async function aggregateDemand(companyId, locationFilter) {
  const rows = await PurchaseIndent.aggregate([
    { $match: { ...locationFilter, status: "Approved" } },
    { $unwind: "$lines" },
    {
      $group: {
        _id: "$lines.itemId",
        demand: { $sum: { $ifNull: ["$lines.qty", 0] } },
        itemNo: { $first: "$lines.itemNo" },
        itemName: { $first: "$lines.itemName" },
        description: { $first: "$lines.description" },
        uom: { $first: "$lines.uom" },
        contributingIndentIds: { $addToSet: "$_id" },
      },
    },
    { $match: { _id: { $ne: null } } },
  ]);
  return rows;
}

async function aggregateSrSoh(locationFilter) {
  const rows = await StockBalance.aggregate([
    { $match: locationFilter },
    {
      $group: {
        _id: "$itemId",
        srSoh: { $sum: { $ifNull: ["$qtyOnHand", 0] } },
      },
    },
    { $match: { _id: { $ne: null } } },
  ]);
  return rows;
}

async function aggregateIppo(companyId, locationFilter) {
  const rows = await PurchaseOrder.aggregate([
    { $match: { ...locationFilter, status: { $in: OPEN_PO_STATUSES } } },
    { $unwind: "$lines" },
    {
      $project: {
        itemId: "$lines.itemId",
        openQty: {
          $max: [
            0,
            {
              $subtract: [
                { $ifNull: ["$lines.qty", 0] },
                {
                  $add: [
                    { $ifNull: ["$lines.receivedQty", 0] },
                    { $ifNull: ["$lines.cancelledQty", 0] },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    { $match: { itemId: { $ne: null }, openQty: { $gt: 0 } } },
    {
      $group: {
        _id: "$itemId",
        ippo: { $sum: "$openQty" },
      },
    },
  ]);
  return rows;
}

async function loadPreferredSuppliers(companyId, itemIds) {
  if (!itemIds.length) return new Map();

  const links = await ItemSupplierLink.find({
    company: companyId,
    itemId: { $in: itemIds },
    status: "Active",
  })
    .sort({ isPreferred: -1, supplierName: 1, createdAt: 1 })
    .lean();

  const map = new Map();
  for (const link of links) {
    const key = String(link.itemId);
    if (map.has(key)) continue;
    map.set(key, {
      supplierId: link.supplierId,
      supplierName: link.supplierName ?? "",
      mpn: link.mpn ?? "",
      uom: link.uom ?? "",
    });
  }
  return map;
}

export async function listMaterialPurchaseRequirements(companyId, scope) {
  const locationFilter = scopedListFilter(companyId, scope);

  const [demandRows, sohRows, ippoRows] = await Promise.all([
    aggregateDemand(companyId, locationFilter),
    aggregateSrSoh(locationFilter),
    aggregateIppo(companyId, locationFilter),
  ]);

  const demandMap = new Map(demandRows.map((r) => [String(r._id), r]));
  const sohMap = new Map(sohRows.map((r) => [String(r._id), Number(r.srSoh) || 0]));
  const ippoMap = new Map(ippoRows.map((r) => [String(r._id), Number(r.ippo) || 0]));

  const itemIdSet = new Set([
    ...demandMap.keys(),
    ...sohRows.map((r) => String(r._id)),
    ...ippoRows.map((r) => String(r._id)),
  ]);

  const itemIds = [...itemIdSet]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const [items, supplierByItem] = await Promise.all([
    ItemMaster.find({ company: companyId, _id: { $in: itemIds } }).lean(),
    loadPreferredSuppliers(companyId, itemIds),
  ]);

  const itemMap = new Map(items.map((item) => [String(item._id), item]));

  const results = [];

  for (const itemId of itemIdSet) {
    const demandRow = demandMap.get(itemId);
    const demand = demandRow ? Number(demandRow.demand) || 0 : 0;
    if (demand <= 0) continue;

    const srSoh = sohMap.get(itemId) ?? 0;
    const ippo = ippoMap.get(itemId) ?? 0;
    const toProcure = Math.max(0, Math.round((demand - srSoh - ippo) * 1000) / 1000);

    const item = itemMap.get(itemId);
    const supplier = supplierByItem.get(itemId);

    const contributingIndentIds = (demandRow?.contributingIndentIds || []).map((id) => String(id));

    results.push({
      id: itemId,
      itemId,
      contributingIndentIds,
      itemNo: item?.itemNo ?? demandRow?.itemNo ?? "",
      itemName: item?.itemName ?? demandRow?.itemName ?? "",
      itemDescription: item?.itemDescription ?? demandRow?.description ?? "",
      materialCode: String(item?.materialCode ?? "").trim(),
      mpn: supplier?.mpn ?? item?.mpn ?? "",
      qcLevel: String(item?.qcLevel ?? "").trim(),
      tag: supplier?.mpn ?? "",
      uom: supplier?.uom || item?.uom || demandRow?.uom || "",
      demand,
      srSoh,
      ippo,
      toProcure,
      supplierId: supplier?.supplierId != null ? String(supplier.supplierId) : "",
      supplierName: supplier?.supplierName ?? "",
      canGeneratePo: Boolean(supplier?.supplierId) && toProcure > 0,
    });
  }

  results.sort((a, b) => String(a.itemNo).localeCompare(String(b.itemNo)));
  return results;
}
