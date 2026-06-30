import mongoose from "mongoose";
import { PurchaseOrder } from "../models/PurchaseOrder.model.js";
import { PurchaseIndent } from "../models/PurchaseIndent.model.js";
import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { ItemMaster } from "../models/ItemMaster.model.js";

export const FY_MONTH_LABELS = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const MONTH_TO_LABEL = {
  0: "Jan",
  1: "Feb",
  2: "Mar",
  3: "Apr",
  4: "May",
  5: "Jun",
  6: "Jul",
  7: "Aug",
  8: "Sept",
  9: "Oct",
  10: "Nov",
  11: "Dec",
};

function monthLabel(date) {
  return MONTH_TO_LABEL[date.getMonth()] || "Jan";
}

function toLakh(amount) {
  const n = Number(amount) || 0;
  return Math.round((n / 100000) * 100) / 100;
}

function poAmount(po) {
  const total = Number(po.totalAmount);
  if (!Number.isNaN(total) && total > 0) return total;
  return (po.lines || []).reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

export function isImportSupplier(supplier) {
  if (!supplier) return false;
  const combined = `${supplier.supplierPurchaseType || ""} ${supplier.supplierType || ""} ${supplier.categoryType || ""}`.toLowerCase();
  if (combined.includes("import")) return true;
  if (combined.includes("domestic")) return false;
  const country =
    (supplier.countryOfOrigin || "").trim() ||
    (supplier.supplierBillingAddress?.[0]?.country || "").trim() ||
    (supplier.supplierAddress?.[0]?.country || "").trim();
  if (country && !/^india$/i.test(country)) return true;
  const currency = String(supplier.supplierCurrency || "INR").trim().toUpperCase();
  return currency && currency !== "INR";
}

function fyStartDate(reference = new Date()) {
  const year = reference.getMonth() >= 3 ? reference.getFullYear() : reference.getFullYear() - 1;
  return new Date(year, 3, 1, 0, 0, 0, 0);
}

function mtdStartDate(reference = new Date()) {
  return new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
}

function emptyMonthlySeries() {
  return FY_MONTH_LABELS.map((month) => ({ month, value: 0 }));
}

function topEntries(map, limit = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value: toLakh(value) }));
}

function fyLabel(reference = new Date()) {
  const year = reference.getMonth() >= 3 ? reference.getFullYear() : reference.getFullYear() - 1;
  return `FY ${year}–${String(year + 1).slice(-2)}`;
}

async function getProcurementPipeline(companyOid, locationId) {
  const base = { company: companyOid };
  if (locationId) {
    base.locationId = new mongoose.Types.ObjectId(locationId);
  }

  const indentFilter = { ...base, status: "Approved" };

  const [draftPo, openPo, awaitingReceipt, completedPo, approvedIndents] = await Promise.all([
    PurchaseOrder.countDocuments({ ...base, status: "Draft" }),
    PurchaseOrder.countDocuments({
      ...base,
      status: { $in: ["Approved", "Partially Received"] },
    }),
    PurchaseOrder.countDocuments({
      ...base,
      status: { $in: ["Approved", "Partially Received"] },
      grnStatus: { $in: ["Not Started", "Partial"] },
    }),
    PurchaseOrder.countDocuments({
      ...base,
      $or: [
        { status: "Closed" },
        {
          status: { $in: ["Approved", "Partially Received"] },
          grnStatus: { $in: ["Complete", "Short Closed"] },
        },
      ],
    }),
    PurchaseIndent.countDocuments(indentFilter),
  ]);

  return { draftPo, openPo, awaitingReceipt, completedPo, approvedIndents };
}

export async function getPurchaseDashboardStats(companyId, options = {}) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const now = new Date();
  const fyStart = fyStartDate(now);
  const mtdStart = mtdStartDate(now);

  const poFilter = {
    company: companyOid,
    status: { $nin: ["Draft", "Cancelled"] },
    poDate: { $gte: fyStart, $lte: now },
  };
  if (options.locationId) {
    poFilter.locationId = new mongoose.Types.ObjectId(options.locationId);
  }

  const [pos, suppliers, itemCount, pipeline] = await Promise.all([
    PurchaseOrder.find(poFilter)
      .select({ poDate: 1, supplierId: 1, totalAmount: 1, lines: 1 })
      .lean(),
    SupplierMaster.find({ company: companyOid })
      .select({
        supplierName: 1,
        supplierPurchaseType: 1,
        supplierType: 1,
        categoryType: 1,
        countryOfOrigin: 1,
        supplierCurrency: 1,
        supplierBillingAddress: 1,
        supplierAddress: 1,
        isSupplierActive: 1,
      })
      .lean(),
    ItemMaster.countDocuments({ company: companyOid, status: "Active" }),
    getProcurementPipeline(companyOid, options.locationId),
  ]);

  const supplierById = new Map(suppliers.map((s) => [String(s._id), s]));

  let mtdDomestic = 0;
  let ytdDomestic = 0;
  let mtdImport = 0;
  let ytdImport = 0;

  const monthlyValueMap = Object.fromEntries(FY_MONTH_LABELS.map((m) => [m, 0]));
  const monthlyCountMap = Object.fromEntries(FY_MONTH_LABELS.map((m) => [m, 0]));
  const supplierSpendDomestic = new Map();
  const itemSpendDomestic = new Map();

  for (const po of pos) {
    const poDate = new Date(po.poDate);
    const amount = poAmount(po);
    const supplier = supplierById.get(String(po.supplierId));
    const isImport = isImportSupplier(supplier);
    const monthKey = monthLabel(poDate);

    if (poDate >= mtdStart) {
      if (isImport) mtdImport += amount;
      else mtdDomestic += amount;
    }
    if (isImport) ytdImport += amount;
    else ytdDomestic += amount;

    if (!isImport && FY_MONTH_LABELS.includes(monthKey)) {
      monthlyValueMap[monthKey] += amount;
      monthlyCountMap[monthKey] += 1;

      const supplierName = supplier?.supplierName || "Unknown";
      supplierSpendDomestic.set(supplierName, (supplierSpendDomestic.get(supplierName) || 0) + amount);

      for (const line of po.lines || []) {
        const lineAmt = Number(line.amount) || 0;
        if (lineAmt <= 0) continue;
        const itemLabel = line.itemName || line.itemNo || "Item";
        itemSpendDomestic.set(itemLabel, (itemSpendDomestic.get(itemLabel) || 0) + lineAmt);
      }
    }
  }

  const activeSuppliers = suppliers.filter((s) => String(s.isSupplierActive || "A").toUpperCase() !== "I");
  const domesticSuppliers = activeSuppliers.filter((s) => !isImportSupplier(s)).length;
  const importSuppliers = activeSuppliers.filter((s) => isImportSupplier(s)).length;

  const domesticSpend = ytdDomestic;
  const importSpend = ytdImport;
  const spendTotal = domesticSpend + importSpend;

  const topItemEntries = [...itemSpendDomestic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const domesticItemSpendTotal = [...itemSpendDomestic.values()].reduce((a, b) => a + b, 0);

  return {
    asOf: now.toISOString(),
    fyLabel: fyLabel(now),
    kpis: {
      mtdPurchaseDomesticLakh: toLakh(mtdDomestic),
      ytdPurchaseDomesticLakh: toLakh(ytdDomestic),
      mtdPurchaseImportLakh: toLakh(mtdImport),
      ytdPurchaseImportLakh: toLakh(ytdImport),
      ppvValueLakh: 0,
      ppvRatioPercent: 0,
      debitNoteMtdDomesticLakh: 0,
      debitNoteYtdDomesticLakh: 0,
    },
    monthlyDomesticPurchaseValue: FY_MONTH_LABELS.map((month) => ({
      month,
      value: toLakh(monthlyValueMap[month]),
    })),
    monthlyDomesticPoCount: FY_MONTH_LABELS.map((month) => ({
      month,
      count: monthlyCountMap[month],
    })),
    topDomesticSuppliers: topEntries(supplierSpendDomestic),
    topDomesticItems: topEntries(itemSpendDomestic),
    counts: {
      suppliers: activeSuppliers.length,
      suppliersDomestic: domesticSuppliers,
      suppliersImport: importSuppliers,
      items: itemCount,
    },
    spendShare: [
      { name: "Domestic", value: toLakh(domesticSpend), raw: domesticSpend },
      { name: "Imports", value: toLakh(importSpend), raw: importSpend },
    ],
    spendShareTotalLakh: toLakh(spendTotal),
    marketShareTopItems: topItemEntries.map(([name, raw]) => ({
      name,
      value: domesticItemSpendTotal > 0 ? Math.round((raw / domesticItemSpendTotal) * 1000) / 10 : 0,
      spendLakh: toLakh(raw),
    })),
    hasPurchaseData: pos.length > 0,
    pipeline,
  };
}
