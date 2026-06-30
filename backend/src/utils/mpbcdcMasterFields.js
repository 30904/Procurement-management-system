function trimStr(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

export { trimStr };

export function parseOptionalDate(val) {
  if (val === null || val === undefined || val === "") return null;
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizeItemProcurementInfo(data) {
  const p = data?.procurementInfo || data || {};
  return {
    materialType: trimStr(p.materialType),
    procurementCategory: trimStr(p.procurementCategory),
    stockType: trimStr(p.stockType),
    gemApplicable: trimStr(p.gemApplicable),
  };
}

export function normalizeItemGovernance(data) {
  const g = data?.governance || data || {};
  return {
    approvalStatus: trimStr(g.approvalStatus) || "Draft",
    approvedBy: trimStr(g.approvedBy),
    approvalDate: parseOptionalDate(g.approvalDate),
    remarks: trimStr(g.remarks),
  };
}

export function normalizeServiceMpbcdc(data) {
  const s = data?.mpbcdcService || data || {};
  return {
    serviceType: trimStr(s.serviceType),
    gemApplicable: trimStr(s.gemApplicable),
    approvalStatus: trimStr(s.approvalStatus) || "Draft",
  };
}

export function normalizeAssetProcurementTracking(data) {
  const p = data?.procurementTracking || data || {};
  return {
    assetClassification: trimStr(p.assetClassification),
    procurementMode: trimStr(p.procurementMode),
    purchaseReference: trimStr(p.purchaseReference),
    poReference: trimStr(p.poReference),
    assetLifecycleStatus: trimStr(p.assetLifecycleStatus),
  };
}

export function normalizeLogisticsMpbcdc(data) {
  const l = data?.mpbcdcLogistics || data || {};
  return {
    transportCategory: trimStr(l.transportCategory),
    serviceCoverage: trimStr(l.serviceCoverage),
    gemRegistered: trimStr(l.gemRegistered),
    approvalStatus: trimStr(l.approvalStatus) || "Draft",
  };
}

export function normalizePaymentTermsMpbcdc(data) {
  const p = data?.mpbcdcPaymentTerms || data || {};
  return {
    approvalStatus: trimStr(p.approvalStatus) || "Draft",
    activeFrom: parseOptionalDate(p.activeFrom),
    activeTo: parseOptionalDate(p.activeTo),
    governmentApproved: trimStr(p.governmentApproved),
  };
}

export function normalizeTaxMasterMpbcdc(data) {
  const t = data?.mpbcdcTax || data || {};
  return {
    governmentCategory: trimStr(t.governmentCategory),
    applicableCategory: trimStr(t.applicableCategory),
    activeFrom: parseOptionalDate(t.activeFrom),
    activeTo: parseOptionalDate(t.activeTo),
  };
}

export function normalizePurchaseIndentProcurementInfo(data) {
  const p = data?.procurementInfo || data || {};
  return {
    requisitionType: trimStr(p.requisitionType),
    procurementCategory: trimStr(p.procurementCategory),
    costCenter: trimStr(p.costCenter),
  };
}

export function normalizePurchaseIndentBudgetInfo(data) {
  const b = data?.budgetInfo || data || {};
  const est = b.estimatedProcurementValue;
  const estimatedProcurementValue =
    est === "" || est === null || est === undefined
      ? undefined
      : Number.isFinite(Number(est))
        ? Number(est)
        : undefined;
  return {
    budgetHead: trimStr(b.budgetHead),
    estimatedProcurementValue,
    budgetAvailable: trimStr(b.budgetAvailable),
    fundingSource: trimStr(b.fundingSource),
    financialYear: trimStr(b.financialYear),
    budgetReference: trimStr(b.budgetReference),
    budgetRemarks: trimStr(b.budgetRemarks),
    budgetVerificationStatus: trimStr(b.budgetVerificationStatus),
  };
}

export function normalizePurchaseIndentGovernanceInfo(data) {
  const g = data?.governanceInfo || data || {};
  return {
    gemApplicable: trimStr(g.gemApplicable),
    tenderRequired: trimStr(g.tenderRequired),
    emergencyProcurement: trimStr(g.emergencyProcurement),
    boardApprovalRequired: trimStr(g.boardApprovalRequired),
    procurementJustification: trimStr(g.procurementJustification),
    specialApprovalNotes: trimStr(g.specialApprovalNotes),
  };
}

export function normalizePurchaseIndentApprovalTracking(data) {
  const a = data?.approvalTracking || data || {};
  return {
    approvalStatus: trimStr(a.approvalStatus),
    approvedBy: trimStr(a.approvedBy),
    approvalDate: parseOptionalDate(a.approvalDate),
    approvalRemarks: trimStr(a.approvalRemarks),
  };
}

export function normalizePurchaseIndentMpbcdc(body) {
  return {
    procurementInfo: normalizePurchaseIndentProcurementInfo(body),
    budgetInfo: normalizePurchaseIndentBudgetInfo(body),
    governanceInfo: normalizePurchaseIndentGovernanceInfo(body),
    approvalTracking: normalizePurchaseIndentApprovalTracking(body),
  };
}

function optionalObjectId(val) {
  const s = trimStr(val);
  if (!s) return undefined;
  return s;
}

export function normalizePurchaseOrderProcurementReference(data) {
  const p = data?.procurementReference || data || {};
  return {
    procurementCategory: trimStr(p.procurementCategory),
    purchaseType: trimStr(p.purchaseType),
    sourceListId: optionalObjectId(p.sourceListId),
    sourceListCode: trimStr(p.sourceListCode),
    sourceListLabel: trimStr(p.sourceListLabel),
    vendorEvaluationId: optionalObjectId(p.vendorEvaluationId),
    vendorEvaluationCode: trimStr(p.vendorEvaluationCode),
    vendorEvaluationLabel: trimStr(p.vendorEvaluationLabel),
    rateContractReference: trimStr(p.rateContractReference),
    contractReference: trimStr(p.contractReference),
    budgetReference: trimStr(p.budgetReference),
  };
}

export function normalizePurchaseOrderGovernmentProcurement(data) {
  const g = data?.governmentProcurement || data || {};
  return {
    gemPurchase: trimStr(g.gemPurchase),
    tenderPurchase: trimStr(g.tenderPurchase),
    emergencyProcurement: trimStr(g.emergencyProcurement),
    boardApprovalRequired: trimStr(g.boardApprovalRequired),
    tenderNumber: trimStr(g.tenderNumber),
    gemBidNumber: trimStr(g.gemBidNumber),
    governmentApprovalNumber: trimStr(g.governmentApprovalNumber),
    governmentReference: trimStr(g.governmentReference),
  };
}

export function normalizePurchaseOrderCapitalProcurement(data) {
  const c = data?.capitalProcurement || data || {};
  return {
    assetProcurement: trimStr(c.assetProcurement),
    assetId: optionalObjectId(c.assetId),
    assetCode: trimStr(c.assetCode),
    assetName: trimStr(c.assetName),
    capitalizationRequired: trimStr(c.capitalizationRequired),
    capitalBudgetCode: trimStr(c.capitalBudgetCode),
  };
}

export function normalizePurchaseOrderApprovalTracking(data) {
  const a = data?.approvalTracking || data || {};
  return {
    approvalStatus: trimStr(a.approvalStatus),
    approvalAuthority: trimStr(a.approvalAuthority),
    approvalDate: parseOptionalDate(a.approvalDate),
    approvalRemarks: trimStr(a.approvalRemarks),
  };
}

export function normalizePurchaseOrderMpbcdc(body) {
  return {
    procurementReference: normalizePurchaseOrderProcurementReference(body),
    governmentProcurement: normalizePurchaseOrderGovernmentProcurement(body),
    capitalProcurement: normalizePurchaseOrderCapitalProcurement(body),
    approvalTracking: normalizePurchaseOrderApprovalTracking(body),
  };
}

function optionalNumber(val) {
  if (val === "" || val === null || val === undefined) return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeGoodsReceiptProcurementReference(data) {
  const p = data?.procurementReference || data || {};
  return {
    purchaseRequisitionId: optionalObjectId(p.purchaseRequisitionId),
    purchaseRequisitionNo: trimStr(p.purchaseRequisitionNo),
    procurementCategory: trimStr(p.procurementCategory),
    purchaseType: trimStr(p.purchaseType),
    sourceListId: optionalObjectId(p.sourceListId),
    sourceListCode: trimStr(p.sourceListCode),
    sourceListLabel: trimStr(p.sourceListLabel),
    vendorEvaluationId: optionalObjectId(p.vendorEvaluationId),
    vendorEvaluationCode: trimStr(p.vendorEvaluationCode),
    vendorEvaluationLabel: trimStr(p.vendorEvaluationLabel),
    contractReference: trimStr(p.contractReference),
    budgetReference: trimStr(p.budgetReference),
  };
}

export function normalizeGoodsReceiptReceiptInformation(data) {
  const r = data?.receiptInformation || data || {};
  return {
    receiptType: trimStr(r.receiptType),
    receiptStatus: trimStr(r.receiptStatus),
    inspectionRequired: trimStr(r.inspectionRequired),
    qcStatus: trimStr(r.qcStatus),
    acceptedQuantity: optionalNumber(r.acceptedQuantity),
    rejectedQuantity: optionalNumber(r.rejectedQuantity),
    shortQuantity: optionalNumber(r.shortQuantity),
    excessQuantity: optionalNumber(r.excessQuantity),
  };
}

export function normalizeGoodsReceiptGovernmentProcurement(data) {
  const g = data?.governmentProcurement || data || {};
  return {
    gemProcurement: trimStr(g.gemProcurement),
    tenderProcurement: trimStr(g.tenderProcurement),
    inspectionCertificateAvailable: trimStr(g.inspectionCertificateAvailable),
    governmentInspectionRequired: trimStr(g.governmentInspectionRequired),
    inspectionCertificateNumber: trimStr(g.inspectionCertificateNumber),
    inspectionAgency: trimStr(g.inspectionAgency),
    inspectionDate: parseOptionalDate(g.inspectionDate),
    governmentRemarks: trimStr(g.governmentRemarks),
  };
}

export function normalizeGoodsReceiptCapitalProcurement(data) {
  const c = data?.capitalProcurement || data || {};
  return {
    assetCreationRequired: trimStr(c.assetCreationRequired),
    assetId: optionalObjectId(c.assetId),
    assetCode: trimStr(c.assetCode),
    assetName: trimStr(c.assetName),
    capitalizationPending: trimStr(c.capitalizationPending),
    assetTagNumber: trimStr(c.assetTagNumber),
  };
}

export function normalizeGoodsReceiptReceivingAuthority(data) {
  const a = data?.receivingAuthority || data || {};
  return {
    receivedById: optionalObjectId(a.receivedById),
    receivedByName: trimStr(a.receivedByName),
    verifiedById: optionalObjectId(a.verifiedById),
    verifiedByName: trimStr(a.verifiedByName),
    verifiedDate: parseOptionalDate(a.verifiedDate),
    receivingRemarks: trimStr(a.receivingRemarks),
  };
}

export function normalizeGoodsReceiptMpbcdc(body) {
  return {
    procurementReference: normalizeGoodsReceiptProcurementReference(body),
    receiptInformation: normalizeGoodsReceiptReceiptInformation(body),
    governmentProcurement: normalizeGoodsReceiptGovernmentProcurement(body),
    capitalProcurement: normalizeGoodsReceiptCapitalProcurement(body),
    receivingAuthority: normalizeGoodsReceiptReceivingAuthority(body),
  };
}
