import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, Calendar, FileText, Info, Plus, Search, Tag } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import PoOrderReferenceModal from "../../components/purchase/PoOrderReferenceModal.jsx";
import DomesticSupplierInsightPanel from "../../components/purchase/DomesticSupplierInsightPanel.jsx";
import PoDomesticCreateHeader from "../../components/purchase/PoDomesticCreateHeader.jsx";
import PoDomesticLineEditor from "../../components/purchase/PoDomesticLineEditor.jsx";
import PoDomesticOrderSidebar from "../../components/purchase/PoDomesticOrderSidebar.jsx";
import ImportSupplierInsightPanel from "../../components/purchase/ImportSupplierInsightPanel.jsx";
import PoImportCreateHeader from "../../components/purchase/PoImportCreateHeader.jsx";
import PoImportOrderSidebar from "../../components/purchase/PoImportOrderSidebar.jsx";
import PoSupplierLookupModal from "../../components/purchase/PoSupplierLookupModal.jsx";
import { getPurchaseOrderWorkspace, PO_CHANNEL } from "../../config/purchaseOrderWorkspace.js";
import { computeImportLandedCost } from "../../utils/importLandedCost.js";
import PoIncidentalExpensesModal from "../../components/purchase/PoIncidentalExpensesModal.jsx";
import PoValueTermsModal from "../../components/purchase/PoValueTermsModal.jsx";
import PoExpectedDeliveryDateModal from "../../components/purchase/PoExpectedDeliveryDateModal.jsx";
import PoExcessQuantityThresholdModal from "../../components/purchase/PoExcessQuantityThresholdModal.jsx";
import PoItemRateTrendModal from "../../components/purchase/PoItemRateTrendModal.jsx";
import PoItemTagModal from "../../components/purchase/PoItemTagModal.jsx";
import PurchaseOrderMpbcdcSections from "../../components/purchase/PurchaseOrderMpbcdcSections.jsx";
import PurchaseOrderDocumentsSection from "../../components/purchase/PurchaseOrderDocumentsSection.jsx";
import { appPath } from "../../config/navigation.js";
import {
  FALLBACK_PO_TYPE_OPTIONS,
  FALLBACK_INCIDENTAL_EXPENSE_ROWS,
  FREIGHT_TERMS_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
} from "../../config/purchaseOrderFormOptions.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useIncidentalExpenseTemplates, useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useToast } from "../../hooks/useToast.js";
import {
  createPurchaseOrderRequest,
  getPurchaseIndentRequest,
  getPurchaseOrderRequest,
  listLocationsRequest,
  listLogisticsMasterRequest,
  listPaymentTermsMasterRequest,
  listSupplierLinkedItemsRequest,
  listSupplierMasterRequest,
  previewPurchaseOrderNoRequest,
  updatePurchaseOrderRequest,
  submitPurchaseOrderAmendmentRequest,
  updatePurchaseOrderAmendmentRequest,
} from "../../services/api.js";
import {
  computeLineBalance,
  computePoValue,
  emptyPurchaseOrderForm,
  emptyPoLineFromSupplierLink,
  lineAmount,
  mergeMppPrefillLines,
  mergeSupplierLinesWithExisting,
  purchaseOrderDocToForm,
  purchaseOrderFormToPayload,
} from "../../utils/purchaseOrderFormState.js";
import {
  createEmptyPurchaseOrderValidation,
  hasLineQtyEntered,
  validatePurchaseOrderForm,
} from "../../utils/purchaseOrderValidation.js";
import { buildIncidentalExpenseRows } from "../../utils/masterDataOptions.js";
import { primarySupplierState } from "../../utils/poGstCalculation.js";
import styles from "./PurchaseOrderCreatePage.module.css";
import domesticStyles from "./PurchaseOrderDomesticCreate.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LINE_PAGE_SIZE = 10;

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatEddDisplay(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function paymentTermsMasterToOptions(rows) {
  return (rows || [])
    .filter((r) => String(r.status || "Active") === "Active")
    .sort(
      (a, b) =>
        (Number(a.displayOrder ?? a.order) || 0) - (Number(b.displayOrder ?? b.order) || 0) ||
        String(a.description ?? "").localeCompare(String(b.description ?? ""))
    )
    .map((r) => {
      const label = String(r.description ?? r.paymentTermsCode ?? "").trim();
      return { value: label, label };
    })
    .filter((o) => o.value);
}

function logisticsMasterToOptions(rows) {
  return (rows || [])
    .filter((r) => String(r.isLspActive || "").toUpperCase() === "A")
    .sort((a, b) =>
      String(a.lspNameLegalEntity ?? "").localeCompare(String(b.lspNameLegalEntity ?? ""), undefined, {
        sensitivity: "base",
      })
    )
    .map((r) => {
      const label = String(r.lspNameLegalEntity ?? "").trim();
      return { value: label, label };
    })
    .filter((o) => o.value);
}

const AMEND_LIST_PATH = "purchase/purchase-order/amend-po";

export default function PurchaseOrderCreatePage({ workspace = "generate-po", amendMode = false }) {
  const ws = getPurchaseOrderWorkspace(workspace);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editPoId } = useParams();
  const isEditMode = Boolean(editPoId);
  const listPath = amendMode ? AMEND_LIST_PATH : ws.listPath;
  /** Survives StrictMode remount + navigate state clear after MPP → Generate PO */
  const pendingMppPrefillRef = useRef(location.state?.mppPrefill ?? null);
  const mppInflightRef = useRef(false);
  const toast = useToast();
  const { activeLocation, activeLocationId } = useLocationScope();
  const [form, setForm] = useState(emptyPurchaseOrderForm);
  const [saving, setSaving] = useState(false);
  const [poNoLoading, setPoNoLoading] = useState(!isEditMode);
  const [editLoading, setEditLoading] = useState(isEditMode);
  const [poLocationId, setPoLocationId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [transporterOptions, setTransporterOptions] = useState([]);
  const [paymentTermsMasterOptions, setPaymentTermsMasterOptions] = useState([]);
  const [lineQuery, setLineQuery] = useState("");
  const [linePage, setLinePage] = useState(1);
  const [amendPending, setAmendPending] = useState(false);

  const [orderRefOpen, setOrderRefOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [incidentalOpen, setIncidentalOpen] = useState(false);
  const [valueTermsOpen, setValueTermsOpen] = useState(false);
  const [valueTermsTab, setValueTermsTab] = useState("value");
  const [eddModalLineKey, setEddModalLineKey] = useState("");
  const [eqtModalLineKey, setEqtModalLineKey] = useState("");
  const [rateTrendLineKey, setRateTrendLineKey] = useState("");
  const [tagModalLineKey, setTagModalLineKey] = useState("");
  const [validationErrors, setValidationErrors] = useState(createEmptyPurchaseOrderValidation);
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const [linesPreviewOnly, setLinesPreviewOnly] = useState(false);
  const [hasClickedPreview, setHasClickedPreview] = useState(false);

  const { options: supplierCategoryOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.SUPPLIER_CATEGORY);
  const { options: poTypeOptions, loading: poTypeLoading } = useMasterDataOptions(MASTER_DATA_CATEGORY.PO_TYPE);
  const { options: transportModeOptionsRaw } = useMasterDataOptions(MASTER_DATA_CATEGORY.MODE_OF_TRANSPORT);
  const { options: freightTermsOptionsRaw } = useMasterDataOptions(MASTER_DATA_CATEGORY.FREIGHT_TERMS);
  const { templates: incidentalTemplates, loading: incidentalTemplatesLoading } = useIncidentalExpenseTemplates();

  const transportModeOptions = transportModeOptionsRaw.length
    ? transportModeOptionsRaw
    : TRANSPORT_MODE_OPTIONS;
  const freightTermsOptions = freightTermsOptionsRaw.length ? freightTermsOptionsRaw : FREIGHT_TERMS_OPTIONS;
  const paymentTermsOptions = paymentTermsMasterOptions;

  const incidentalExpenseRows = useMemo(() => {
    if (incidentalTemplates.length) return incidentalTemplates;
    return FALLBACK_INCIDENTAL_EXPENSE_ROWS.map((r) => ({ ...r }));
  }, [incidentalTemplates]);

  const incidentalExpenseRowsRef = useRef(incidentalExpenseRows);
  incidentalExpenseRowsRef.current = incidentalExpenseRows;

  const poTypeSelectOptions = useMemo(() => {
    if (poTypeOptions.length) return poTypeOptions;
    return FALLBACK_PO_TYPE_OPTIONS;
  }, [poTypeOptions]);

  const shipToDefault = useMemo(() => {
    if (!activeLocation) return { id: "", label: "" };
    return {
      id: String(activeLocation._id || activeLocationId || ""),
      label: activeLocation.locationId || activeLocation.name || activeLocation.locationName || "",
    };
  }, [activeLocation, activeLocationId]);

  const buyerLocation = useMemo(() => {
    const shipId = form.poTerms?.shipToLocationId;
    if (shipId) {
      const loc = locations.find((l) => String(l._id || l.id) === String(shipId));
      if (loc) return loc;
    }
    return activeLocation;
  }, [form.poTerms?.shipToLocationId, locations, activeLocation]);

  const supplierRowsForLookup = useMemo(
    () => ws.filterSuppliers(suppliers),
    [suppliers, ws]
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => String(s._id || s.id) === String(form.supplierId)),
    [suppliers, form.supplierId]
  );

  const gstContext = useMemo(
    () => ({
      buyerGstin: String(buyerLocation?.gstin || "").trim(),
      buyerState: String(buyerLocation?.state || "").trim(),
      supplierGstin: String(selectedSupplier?.gstin || "").trim(),
      supplierState: primarySupplierState(selectedSupplier),
    }),
    [buyerLocation, selectedSupplier]
  );

  const refreshPoValue = useCallback(
    (nextForm) => {
      const poValue = computePoValue(nextForm.lines, nextForm.incidentalExpenses, gstContext);
      return { ...nextForm, poValue };
    },
    [gstContext]
  );

  useEffect(() => {
    setForm((prev) => refreshPoValue(prev));
  }, [gstContext, refreshPoValue]);

  const loadPreviewNo = useCallback(async () => {
    setPoNoLoading(true);
    try {
      const res = await previewPurchaseOrderNoRequest();
      const code = res?.data?.code ?? "";
      setForm((prev) => ({ ...prev, poNo: code }));
    } catch (err) {
      toast.error(err?.message || "Could not load PO number");
    } finally {
      setPoNoLoading(false);
    }
  }, [toast]);

  const loadSupplierLines = useCallback(
    async (supplierId) => {
      if (!supplierId) {
        setForm((prev) => refreshPoValue({ ...prev, lines: [] }));
        return;
      }
      setLinesLoading(true);
      try {
        const res = await listSupplierLinkedItemsRequest(supplierId);
        const rows = (Array.isArray(res?.data) ? res.data : []).map((row) =>
          emptyPoLineFromSupplierLink(row)
        );
        setForm((prev) => refreshPoValue({ ...prev, lines: rows }));
        setLinePage(1);
        if (!rows.length) {
          toast.info("No active items are linked to this supplier.");
        }
      } catch (err) {
        toast.error(err?.message || "Failed to load supplier items");
        setForm((prev) => refreshPoValue({ ...prev, lines: [] }));
      } finally {
        setLinesLoading(false);
      }
    },
    [refreshPoValue, toast]
  );

  const applyRequisitionLinesForVendor = useCallback(
    async (indentIds, supplierId) => {
      const byItem = new Map();
      for (const indentId of indentIds) {
        const res = await getPurchaseIndentRequest(indentId);
        const indentNo = res?.data?.indentNo || indentId;
        for (const line of res?.data?.lines || []) {
          const qty = Number(line.qty);
          if (!line.itemId || qty <= 0) continue;
          const key = String(line.itemId);
          const prev = byItem.get(key);
          if (prev) {
            const nextQty = Number(prev.qty) + qty;
            prev.qty = String(nextQty);
            prev.toProcure = nextQty;
          } else {
            byItem.set(key, {
              itemId: key,
              itemNo: line.itemNo ?? "",
              itemName: line.itemName ?? "",
              itemDescription: line.description ?? "",
              description: line.description ?? "",
              uom: line.uom ?? "",
              qty: String(qty),
              toProcure: qty,
              indentNo,
            });
          }
        }
      }
      const indentLines = [...byItem.values()];
      const linkRes = await listSupplierLinkedItemsRequest(supplierId);
      const supplierRows = Array.isArray(linkRes?.data) ? linkRes.data : [];
      const mergedLines = mergeMppPrefillLines(supplierRows, indentLines);
      const matchedCount = mergedLines.filter(hasLineQtyEntered).length;
      setForm((prev) => refreshPoValue({ ...prev, lines: mergedLines }));
      setLinesPreviewOnly(matchedCount > 0);
      setHasClickedPreview(matchedCount > 0);
      setLinePage(1);
      return { matchedCount, indentLineCount: indentLines.length };
    },
    [refreshPoValue]
  );

  const handlePurchaseRequisitionLink = useCallback(
    async (indentRow) => {
      const id = String(indentRow._id || indentRow.id || "");
      const no = indentRow.indentNo || "";
      if (!id) return;

      let nextIds = [];
      setForm((prev) => {
        const ids = [...(prev.sourceIndentIds || [])];
        const nos = [...(prev.sourceIndentNos || [])];
        if (!ids.includes(id)) {
          ids.push(id);
          if (no) nos.push(no);
        }
        nextIds = ids;
        return { ...prev, sourceIndentIds: ids, sourceIndentNos: nos };
      });

      const supplierId = form.supplierId;
      if (!supplierId) {
        toast.info(
          `Requisition ${no || id} linked for reference. Select a vendor next — PO lines will load only for materials on this requisition that are linked to that vendor. Materials from other vendors need a separate PO.`
        );
        return;
      }

      setLinesLoading(true);
      try {
        const { matchedCount, indentLineCount } = await applyRequisitionLinesForVendor(
          nextIds,
          supplierId
        );
        if (matchedCount === 0) {
          toast.info(
            indentLineCount === 0
              ? `Requisition ${no} has no material lines with quantity.`
              : `Requisition ${no} linked, but none of its materials are in the selected vendor's catalogue. Choose another vendor or use Material Purchase Planning.`
          );
        } else {
          toast.success(
            `Loaded ${matchedCount} material line(s) from linked requisition(s) for this vendor.`
          );
        }
      } catch (err) {
        toast.error(err?.message || "Failed to load requisition materials");
      } finally {
        setLinesLoading(false);
      }
    },
    [applyRequisitionLinesForVendor, form.supplierId, toast]
  );

  useEffect(() => {
    listSupplierMasterRequest()
      .then((res) => setSuppliers(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setSuppliers([]));
    listLocationsRequest()
      .then((res) => setLocations(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setLocations([]));
    listLogisticsMasterRequest()
      .then((res) => setTransporterOptions(logisticsMasterToOptions(res?.data)))
      .catch(() => setTransporterOptions([]));
    listPaymentTermsMasterRequest()
      .then((res) => setPaymentTermsMasterOptions(paymentTermsMasterToOptions(res?.data)))
      .catch(() => setPaymentTermsMasterOptions([]));
  }, []);

  useEffect(() => {
    if (isEditMode || !activeLocationId) return;
    loadPreviewNo();
  }, [activeLocationId, loadPreviewNo, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !editPoId) return;

    let cancelled = false;

    (async () => {
      setEditLoading(true);
      setPoNoLoading(true);
      try {
        const res = await getPurchaseOrderRequest(editPoId);
        if (cancelled) return;
        const doc = res?.data;
        if (amendMode) {
          if (!doc || doc.status !== "Approved") {
            toast.error("Only approved purchase orders can be amended.");
            navigate(appPath(listPath), { replace: true });
            return;
          }
          if (String(doc.grnStatus || "") !== "Not Started") {
            toast.error("PO cannot be amended after GRN has started.");
            navigate(appPath(listPath), { replace: true });
            return;
          }
        } else if (!doc || doc.status !== "Draft") {
          toast.error("Only draft purchase orders can be edited.");
          navigate(appPath(listPath), { replace: true });
          return;
        }
        if (!amendMode) {
          const docChannel = String(doc.poTerms?.poChannel || "").toLowerCase();
          if (ws.poChannel && docChannel !== ws.poChannel) {
            toast.error(`This PO belongs to ${ws.title}.`);
            navigate(appPath(listPath), { replace: true });
            return;
          }
          if (
            ws.poChannel &&
            !docChannel &&
            (ws.poChannel === PO_CHANNEL.DOMESTIC || ws.poChannel === PO_CHANNEL.IMPORT)
          ) {
            toast.error(`This PO was created outside ${ws.title}.`);
            navigate(appPath(listPath), { replace: true });
            return;
          }
        }
        const amendSource =
          amendMode && doc.amendStatus === "Pending" && doc.pendingAmendment
            ? {
                ...doc,
                ...doc.pendingAmendment,
                poNo: doc.poNo,
                status: doc.status,
                supplierId: doc.supplierId,
                supplierName: doc.supplierName,
              }
            : doc;
        const baseForm = purchaseOrderDocToForm(amendSource, incidentalExpenseRowsRef.current);
        setPoLocationId(doc.locationId != null ? String(doc.locationId) : activeLocationId || "");

        let supplierRows = [];
        if (doc.supplierId) {
          try {
            const linkRes = await listSupplierLinkedItemsRequest(doc.supplierId);
            supplierRows = Array.isArray(linkRes?.data) ? linkRes.data : [];
          } catch {
            /* show saved lines even if supplier item catalog fails to load */
          }
        }

        if (cancelled) return;
        const mergedLines = mergeSupplierLinesWithExisting(baseForm.lines, supplierRows);
        setForm(refreshPoValue({ ...baseForm, lines: mergedLines }));
        if (amendMode) setAmendPending(doc.amendStatus === "Pending");
        setHasClickedPreview(true);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load purchase order");
          navigate(appPath(listPath), { replace: true });
        }
      } finally {
        setEditLoading(false);
        setPoNoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, editPoId, refreshPoValue, toast, navigate, activeLocationId, ws, amendMode, listPath]);

  useEffect(() => {
    if (!shipToDefault.id) return;
    setForm((prev) => {
      if (prev.poTerms?.shipToLocationId) return prev;
      return {
        ...prev,
        poTerms: {
          ...prev.poTerms,
          shipToLocationId: shipToDefault.id,
          shipToLocation: shipToDefault.label,
        },
      };
    });
  }, [shipToDefault]);

  useEffect(() => {
    if (poTypeLoading || !poTypeSelectOptions.length) return;
    setForm((prev) => {
      if (prev.poType && poTypeSelectOptions.some((o) => o.value === prev.poType)) return prev;
      return { ...prev, poType: poTypeSelectOptions[0].value };
    });
  }, [poTypeLoading, poTypeSelectOptions]);

  useEffect(() => {
    const incoming = location.state?.mppPrefill;
    if (!incoming?.supplierId) return;
    pendingMppPrefillRef.current = incoming;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (isEditMode) return;
    const prefill = pendingMppPrefillRef.current;
    if (!prefill?.supplierId || mppInflightRef.current) return;

    const supplierId = String(prefill.supplierId);
    const supplier = suppliers.find((s) => String(s._id || s.id) === supplierId);
    if (!ws.isSupplierAllowed(supplier)) {
      toast.error("The preferred supplier is not eligible for this purchase order type.");
      pendingMppPrefillRef.current = null;
      return;
    }

    let cancelled = false;
    mppInflightRef.current = true;

    (async () => {
      setLinesLoading(true);
      try {
        const linkRes = await listSupplierLinkedItemsRequest(supplierId);
        if (cancelled) return;
        const supplierRows = Array.isArray(linkRes?.data) ? linkRes.data : [];
        const mergedLines = mergeMppPrefillLines(supplierRows, prefill.lines);
        const currency = supplier?.supplierCurrency || ws.defaultCurrency || "INR";

        const indentIds = Array.isArray(prefill.sourceIndentIds)
          ? [...new Set(prefill.sourceIndentIds.map((id) => String(id)).filter(Boolean))]
          : [];
        const indentRef =
          indentIds.length && !String(prefill.orderReferenceNo || "").trim()
            ? { orderReferenceNo: `MPP / ${indentIds.length} indent(s)` }
            : {};

        setForm((prev) =>
          refreshPoValue({
            ...prev,
            supplierId,
            supplierName: prefill.supplierName || supplier?.supplierName || "",
            supplierCurrency: currency,
            sourceIndentIds: indentIds,
            ...indentRef,
            lines: mergedLines,
            importMeta: {
              incoterm: supplier?.supplierINCOTerms || prev.importMeta?.incoterm || "",
            },
            landedCost: {
              ...(prev.landedCost || {}),
              exchangeRate:
                String(currency).toUpperCase() === "INR" ? "1" : prev.landedCost?.exchangeRate || "",
            },
            poTerms: {
              ...prev.poTerms,
              paymentTerms: supplier?.supplierPaymentTerms || prev.poTerms.paymentTerms,
              freightTerms: supplier?.supplierINCOTerms || prev.poTerms.freightTerms,
              shipToLocation: prev.poTerms.shipToLocation || shipToDefault.label,
              shipToLocationId: prev.poTerms.shipToLocationId || shipToDefault.id,
            },
          })
        );
        setLinesPreviewOnly(true);
        setHasClickedPreview(true);
        setLinePage(1);
        pendingMppPrefillRef.current = null;
        if (!mergedLines.some(hasLineQtyEntered)) {
          toast.info("Vendor items loaded, but no procure quantity was applied.");
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load items from Procurement Planning");
        }
      } finally {
        mppInflightRef.current = false;
        setLinesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      mppInflightRef.current = false;
    };
  }, [isEditMode, refreshPoValue, shipToDefault, suppliers, toast, ws]);

  useEffect(() => {
    if (incidentalTemplatesLoading) return;
    setForm((prev) => {
      const nextRows = buildIncidentalExpenseRows(incidentalExpenseRows, prev.incidentalExpenses);
      const same =
        nextRows.length === prev.incidentalExpenses.length &&
        nextRows.every(
          (row, i) =>
            row.description === prev.incidentalExpenses[i]?.description &&
            row.amount === prev.incidentalExpenses[i]?.amount
        );
      if (same) return prev;
      return refreshPoValue({ ...prev, incidentalExpenses: nextRows });
    });
  }, [incidentalTemplatesLoading, incidentalExpenseRows, refreshPoValue]);

  const hasAnyPoQty = useMemo(() => form.lines.some(hasLineQtyEntered), [form.lines]);
  const linesWithQtyCount = useMemo(
    () => form.lines.filter(hasLineQtyEntered).length,
    [form.lines]
  );
  const isDomesticUi = ws.showDomesticInsight;
  const isImportUi = ws.showImportInsight;
  const isChannelUi = ws.useCardsLayout;

  const landedCostSummary = useMemo(() => {
    if (!isImportUi) return null;
    const incidentalTotal = (form.incidentalExpenses || []).reduce(
      (s, r) => s + (Number(r.amount) || 0),
      0
    );
    return computeImportLandedCost({
      lines: form.lines,
      landedCost: form.landedCost || {},
      currency: form.supplierCurrency,
      incidentalTotal,
    });
  }, [isImportUi, form.lines, form.landedCost, form.supplierCurrency, form.incidentalExpenses]);

  function patchLandedCost(key, value) {
    setForm((prev) => {
      const next = {
        ...prev,
        landedCost: { ...(prev.landedCost || {}), [key]: value },
      };
      return refreshPoValue(next);
    });
  }

  const filteredLines = useMemo(() => {
    const q = lineQuery.trim().toLowerCase();
    let rows = form.lines;
    if (q) {
      rows = rows.filter((row) =>
        [row.itemNo, row.itemName, row.description, row.uom].some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        )
      );
    }
    if (linesPreviewOnly) {
      rows = rows.filter(hasLineQtyEntered);
    }
    return rows;
  }, [form.lines, lineQuery, linesPreviewOnly]);

  const lineTotalPages = Math.max(1, Math.ceil(filteredLines.length / LINE_PAGE_SIZE));
  const pageLines = filteredLines.slice((linePage - 1) * LINE_PAGE_SIZE, linePage * LINE_PAGE_SIZE);
  const isBlanketPo = String(form.poType || "").trim().toLowerCase() === "blanket po";
  const eddLine = useMemo(
    () => form.lines.find((row) => row.key === eddModalLineKey) || null,
    [form.lines, eddModalLineKey]
  );
  const eqtLine = useMemo(
    () => form.lines.find((row) => row.key === eqtModalLineKey) || null,
    [form.lines, eqtModalLineKey]
  );
  const rateTrendLine = useMemo(
    () => form.lines.find((row) => row.key === rateTrendLineKey) || null,
    [form.lines, rateTrendLineKey]
  );
  const tagLine = useMemo(() => form.lines.find((row) => row.key === tagModalLineKey) || null, [form.lines, tagModalLineKey]);

  useEffect(() => {
    if (linePage > lineTotalPages) setLinePage(lineTotalPages);
  }, [linePage, lineTotalPages]);

  function patchForm(patch) {
    setForm((prev) => {
      const nextForm = refreshPoValue({ ...prev, ...patch });
      if (hasTriedSave) {
        setValidationErrors(validatePurchaseOrderForm(nextForm, { activeLocationId, isBlanketPo }));
      }
      return nextForm;
    });
  }

  function patchLineRow(row, patch) {
    const next = { ...row, ...patch };
    if (
      patch.qty !== undefined ||
      patch.receivedQty !== undefined ||
      patch.cancelledQty !== undefined
    ) {
      next.balanceQty = computeLineBalance(next.qty, next.receivedQty ?? 0, next.cancelledQty ?? 0);
    }
    return next;
  }

  function updateLine(key, patch) {
    setForm((prev) => {
      const nextForm = refreshPoValue({
        ...prev,
        lines: prev.lines.map((row) => (row.key === key ? patchLineRow(row, patch) : row)),
      });
      if (hasTriedSave) {
        setValidationErrors(validatePurchaseOrderForm(nextForm, { activeLocationId, isBlanketPo }));
      }
      return nextForm;
    });
  }

  function handleReset() {
    const fresh = emptyPurchaseOrderForm(incidentalExpenseRows);
    if (poTypeSelectOptions[0]) fresh.poType = poTypeSelectOptions[0].value;
    if (shipToDefault.id) {
      fresh.poTerms.shipToLocationId = shipToDefault.id;
      fresh.poTerms.shipToLocation = shipToDefault.label;
    }
    fresh.lines = [];
    setForm(fresh);
    setValidationErrors(createEmptyPurchaseOrderValidation());
    setHasTriedSave(false);
    setLinesPreviewOnly(false);
    setHasClickedPreview(false);
    setLineQuery("");
    setLinePage(1);
    loadPreviewNo();
  }

  function handlePreviewLinesToggle() {
    if (linesPreviewOnly) {
      setLinesPreviewOnly(false);
      setLinePage(1);
      return;
    }
    if (!hasAnyPoQty) return;
    setLinesPreviewOnly(true);
    setHasClickedPreview(true);
    setLinePage(1);
  }

  async function handleSave(status = "Draft") {
    if (!hasClickedPreview) {
      toast.error("Click Preview to review lines with quantity before saving.");
      return;
    }
    const errors = validatePurchaseOrderForm(form, { activeLocationId, isBlanketPo });
    setValidationErrors(errors);
    setHasTriedSave(true);
    if (errors.hasErrors) {
      if (errors.shipToLocation) {
        setValueTermsTab("terms");
        setValueTermsOpen(true);
      }
      if (Object.keys(errors.lineByKey).length) {
        setLinesPreviewOnly(false);
        setLinePage(1);
      }
      const msg =
        errors.summary.length > 1
          ? `${errors.summary[0]} (+${errors.summary.length - 1} more — see banner)`
          : errors.summary[0] || errors.linesGeneral || "Please fix validation errors before saving.";
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const payload = purchaseOrderFormToPayload(
        { ...form, status },
        activeLocationId,
        gstContext,
        { poChannel: ws.poChannel }
      );
      let res;
      if (amendMode && isEditMode) {
        res = amendPending
          ? await updatePurchaseOrderAmendmentRequest(editPoId, payload)
          : await submitPurchaseOrderAmendmentRequest(editPoId, payload);
      } else {
        res = isEditMode
          ? await updatePurchaseOrderRequest(editPoId, payload)
          : await createPurchaseOrderRequest(payload);
      }
      const saved = res?.data;
      if (amendMode) {
        toast.success(
          saved?.poNo
            ? `Amendment submitted for ${saved.poNo}. Approve from Amend PO summary.`
            : "Amendment submitted."
        );
      } else {
        toast.success(
          isEditMode
            ? saved?.poNo
              ? `Purchase order ${saved.poNo} updated.`
              : "Purchase order updated."
            : saved?.poNo
              ? `Purchase order ${saved.poNo} saved.`
              : "Purchase order saved."
        );
      }
      navigate(appPath(listPath), { state: { refresh: true } });
    } catch (err) {
      const message =
        err?.data?.message || err?.message || "Failed to save purchase order";
      toast.error(message);
      if (String(message).toLowerCase().includes("ship-to")) {
        setValueTermsTab("terms");
        setValueTermsOpen(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(listPath))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(listPath))}>
            {amendMode ? "Amend PO" : ws.title}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">
            {amendMode ? (isEditMode ? "Amend" : "New") : isEditMode ? "Edit" : "New"}
          </span>
        </h1>
      </header>

      <div className={styles.wrap}>
        {editLoading ? (
          <p className={domesticStyles.loading}>Loading purchase order…</p>
        ) : null}

        {isChannelUi ? (
          <div className={`${domesticStyles.page}${editLoading ? ` ${styles.cardHidden}` : ""}`}>
            {hasTriedSave && validationErrors.hasErrors ? (
              <div className={styles.validationBanner} style={{ marginBottom: "1rem" }}>
                <strong>Please fix the following:</strong>
                <span>{validationErrors.summary.join(" ") || "Resolve highlighted fields and try again."}</span>
              </div>
            ) : null}

            {isImportUi ? (
              <PoImportCreateHeader
                poNo={form.poNo}
                poNoLoading={poNoLoading}
                poDate={form.poDate}
                onPoDateChange={(v) => patchForm({ poDate: v })}
                supplierName={form.supplierName}
                onSelectSupplier={() => !isEditMode && setSupplierOpen(true)}
                isEditMode={isEditMode}
                poTypeOptions={poTypeSelectOptions}
                poType={form.poType}
                onPoTypeChange={(v) => patchForm({ poType: v })}
                poTypeLoading={poTypeLoading}
                validationErrors={validationErrors}
              />
            ) : (
              <PoDomesticCreateHeader
                poNo={form.poNo}
                poNoLoading={poNoLoading}
                poDate={form.poDate}
                onPoDateChange={(v) => patchForm({ poDate: v })}
                supplierName={form.supplierName}
                onSelectSupplier={() => !isEditMode && setSupplierOpen(true)}
                isEditMode={isEditMode}
                poTypeOptions={poTypeSelectOptions}
                poType={form.poType}
                onPoTypeChange={(v) => patchForm({ poType: v })}
                poTypeLoading={poTypeLoading}
                validationErrors={validationErrors}
              />
            )}

            {isDomesticUi && selectedSupplier ? (
              <DomesticSupplierInsightPanel
                supplier={selectedSupplier}
                buyerGstin={gstContext.buyerGstin}
                buyerState={gstContext.buyerState}
                poValue={form.poValue}
              />
            ) : null}
            {isImportUi && selectedSupplier ? (
              <ImportSupplierInsightPanel
                supplier={selectedSupplier}
                landedCostSummary={landedCostSummary}
              />
            ) : null}

            <div className={domesticStyles.formScroll}>
              <div className={domesticStyles.mpbcdcBlock}>
                <PurchaseOrderMpbcdcSections
                  form={form}
                  setForm={setForm}
                  onIndentLinked={handlePurchaseRequisitionLink}
                />
                <PurchaseOrderDocumentsSection poId={editPoId} disabled={!editPoId} />
              </div>

              <div className={domesticStyles.layout}>
              <div className={domesticStyles.main}>
                <PoDomesticLineEditor
                  lines={filteredLines}
                  lineQuery={lineQuery}
                  onLineQueryChange={(v) => {
                    setLineQuery(v);
                    setLinePage(1);
                  }}
                  linesLoading={linesLoading}
                  supplierSelected={Boolean(form.supplierId)}
                  linesPreviewOnly={linesPreviewOnly}
                  onViewModeChange={(orderedOnly) => {
                    setLinesPreviewOnly(orderedOnly);
                    if (orderedOnly) {
                      setHasClickedPreview(true);
                      setLinePage(1);
                    }
                  }}
                  isBlanketPo={isBlanketPo}
                  validationErrors={validationErrors}
                  onUpdateLine={updateLine}
                  onOpenTag={setTagModalLineKey}
                  onOpenEdd={setEddModalLineKey}
                  onOpenEqt={setEqtModalLineKey}
                  onOpenRateTrend={setRateTrendLineKey}
                  currency={form.supplierCurrency || ws.defaultCurrency || "INR"}
                />
              </div>

              {isImportUi ? (
                <PoImportOrderSidebar
                  poNo={form.poNo}
                  poDate={form.poDate}
                  currency={form.supplierCurrency || ws.defaultCurrency || "USD"}
                  lineCount={form.lines.length}
                  linesWithQty={linesWithQtyCount}
                  lines={form.lines}
                  landedCost={form.landedCost}
                  onLandedCostChange={patchLandedCost}
                  incidentalExpenses={form.incidentalExpenses}
                  shipToLabel={form.poTerms?.shipToLocation}
                  paymentTerms={form.poTerms?.paymentTerms}
                  validationErrors={validationErrors}
                  saving={saving}
                  editLoading={editLoading}
                  hasClickedPreview={hasClickedPreview}
                  linesPreviewOnly={linesPreviewOnly}
                  isEditMode={isEditMode}
                  onIncidental={() => setIncidentalOpen(true)}
                  onTerms={() => {
                    setValueTermsTab(validationErrors.shipToLocation ? "terms" : "value");
                    setValueTermsOpen(true);
                  }}
                  onOrderRef={() => setOrderRefOpen(true)}
                  onPreviewToggle={handlePreviewLinesToggle}
                  onReset={handleReset}
                  onSave={() => handleSave("Draft")}
                />
              ) : (
                <PoDomesticOrderSidebar
                  poNo={form.poNo}
                  poDate={form.poDate}
                  currency={form.supplierCurrency}
                  lineCount={form.lines.length}
                  linesWithQty={linesWithQtyCount}
                  poValue={form.poValue}
                  shipToLabel={form.poTerms?.shipToLocation}
                  paymentTerms={form.poTerms?.paymentTerms}
                  validationErrors={validationErrors}
                  saving={saving}
                  editLoading={editLoading}
                  hasClickedPreview={hasClickedPreview}
                  linesPreviewOnly={linesPreviewOnly}
                  isEditMode={isEditMode}
                  onIncidental={() => setIncidentalOpen(true)}
                  onTerms={() => {
                    setValueTermsTab(validationErrors.shipToLocation ? "terms" : "value");
                    setValueTermsOpen(true);
                  }}
                  onOrderRef={() => setOrderRefOpen(true)}
                  onPreviewToggle={handlePreviewLinesToggle}
                  onReset={handleReset}
                  onSave={() => handleSave("Draft")}
                />
              )}
            </div>
            </div>
          </div>
        ) : (
        <div className={`${styles.card}${editLoading ? ` ${styles.cardHidden}` : ""}`}>
          <div className={styles.header}>
            {hasTriedSave && validationErrors.hasErrors ? (
              <div className={styles.validationBanner}>
                <strong>Please fix the following:</strong>
                <span>{validationErrors.summary.join(" ") || "Resolve highlighted fields and try again."}</span>
              </div>
            ) : null}
            <div className={styles.headerGrid}>
              <InputField
                label="PO No."
                value={poNoLoading ? "Loading…" : form.poNo}
                locked
              />
              <div className={styles.fieldStack}>
                <DateField
                  label="PO Date"
                  type="date"
                  required
                  value={form.poDate}
                  onChange={(v) => patchForm({ poDate: v })}
                />
                {validationErrors.poDate ? (
                  <div className={styles.fieldError}>{validationErrors.poDate}</div>
                ) : null}
              </div>
              <div className={styles.fieldWithBtn}>
                <InputField
                  label="Vendor Name"
                  required
                  value={form.supplierName}
                  placeholder="Select Vendor"
                  locked
                />
                {!isEditMode ? (
                  <button
                    type="button"
                    className={`sc-field-adjunct-btn ${validationErrors.supplierName ? styles.errorFieldOutline : ""}`}
                    aria-label="Select supplier"
                    title="Select supplier"
                    onClick={() => setSupplierOpen(true)}
                  >
                    <Search size={16} />
                  </button>
                ) : null}
                {validationErrors.supplierName ? <div className={styles.fieldError}>{validationErrors.supplierName}</div> : null}
              </div>
              <SelectField
                label="PO Type"
                required
                options={poTypeSelectOptions}
                value={form.poType}
                onChange={(v) => patchForm({ poType: v })}
                disabled={poTypeLoading}
              />
              {validationErrors.poType ? <div className={styles.fieldError}>{validationErrors.poType}</div> : null}
              <button
                type="button"
                className={styles.btnAux}
                onClick={() => setOrderRefOpen(true)}
                title="Set order reference number and date"
              >
                Order Reference
              </button>
            </div>
            <div className={styles.poStatusRow}>
              <span className={styles.poStatusChip}>
                PO Status: <strong>Draft</strong>
              </span>
              <span className={styles.poStatusChip}>
                Goods Receipt Status: <strong>Not Started</strong>
              </span>
            </div>
          </div>

          <div className={styles.formScroll}>
            <div className={styles.mpbcdcBlock}>
              <PurchaseOrderMpbcdcSections
                form={form}
                setForm={setForm}
                onIndentLinked={handlePurchaseRequisitionLink}
              />
              <PurchaseOrderDocumentsSection poId={editPoId} disabled={!editPoId} />
            </div>

            <div className={styles.body}>
            <div className={styles.toolbarRow}>
              <div className={`sc-modal-search ${styles.searchWrap}`}>
                <Search className="sc-modal-search__icon" size={18} />
                <input
                  type="text"
                  className="sc-modal-search__input"
                  placeholder="Search here"
                  value={lineQuery}
                  onChange={(e) => {
                    setLineQuery(e.target.value);
                    setLinePage(1);
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                {linesLoading ? (
                  <span style={{ fontSize: "0.85vw", color: "#64748b" }}>Loading supplier items…</span>
                ) : null}
                {filteredLines.length > LINE_PAGE_SIZE ? (
                  <>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      disabled={linePage <= 1}
                      title="Previous page"
                      onClick={() => setLinePage((p) => Math.max(1, p - 1))}
                    >
                      ‹
                    </button>
                    <span style={{ fontSize: "0.85vw", color: "#64748b" }}>
                      {linePage} / {lineTotalPages}
                    </span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      disabled={linePage >= lineTotalPages}
                      title="Next page"
                      onClick={() => setLinePage((p) => Math.min(lineTotalPages, p + 1))}
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className={`im-table-scroll ${styles.tableWrap}`}>
              <table className={`im-table im-table--master ${styles.poLinesTable}`}>
                <colgroup>
                  <col className={styles.colItemNo} />
                  <col className={styles.colItemName} />
                  <col className={styles.colDescription} />
                  <col className={styles.colTag} />
                  <col className={styles.colUom} />
                  <col className={styles.colVbp} />
                  <col className={styles.colQty} />
                  <col className={styles.colFulfill} />
                  <col className={styles.colFulfill} />
                  <col className={styles.colFulfill} />
                  <col className={styles.colRate} />
                  <col className={styles.colValue} />
                  <col className={styles.colEdd} />
                  <col className={styles.colEqt} />
                  <col className={styles.colInfo} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Material Code</th>
                    <th>Material Name</th>
                    <th>Material Description</th>
                    <th>Tag</th>
                    <th>UoM</th>
                    <th>VBP</th>
                    <th>PO Qty</th>
                    <th>Rec. Qty</th>
                    <th>Canc. Qty</th>
                    <th>Bal. Qty</th>
                    <th>Rate/Qty</th>
                    <th>Line Value</th>
                    <th>EDD</th>
                    <th>EQT</th>
                    <th aria-label="Info">i</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLines.length === 0 ? (
                    <tr className="im-empty-row">
                      <td colSpan={15} className="im-empty-cell">
                        <div className={styles.addRowHint}>
                          {linesLoading
                            ? "Loading items linked to supplier…"
                            : !form.supplierId
                              ? "Select a supplier to load linked items."
                            : linesPreviewOnly && !hasAnyPoQty
                              ? "Enter PO Qty on at least one line, then click Preview."
                              : linesPreviewOnly
                                ? "No lines with PO quantity match your search."
                                : "No materials are linked to this supplier."}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageLines.map((row) => (
                      <tr key={row.key}>
                        <td className={styles.cellCenter}>{row.itemNo}</td>
                        <td className={styles.cellEllipsis} title={row.itemName}>
                          {row.itemName}
                        </td>
                        <td className={styles.cellEllipsis} title={row.description}>
                          {row.description}
                        </td>
                        <td className={styles.cellCenter}>
                          <div className={styles.tagCell}>
                            <button
                              type="button"
                              className={styles.lineIconBtn}
                              aria-label="Open item tag"
                              title="Material tag (MPN)"
                              onClick={() => setTagModalLineKey(row.key)}
                            >
                              <Tag size={13} />
                            </button>
                          </div>
                        </td>
                        <td className={styles.cellCenter}>{row.uom}</td>
                        <td className={styles.cellCenter}>
                          <button
                            type="button"
                            className={`${styles.lineIconBtn} ${styles.vbpIconOnlyBtn}`}
                            aria-label="Volume based pricing"
                            title={`Volume based pricing: ${row.vbp || "—"}`}
                            onClick={() =>
                              toast.info(
                                row.vbp ? `Volume based pricing for ${row.itemNo}: ${row.vbp}` : "No volume based pricing defined."
                              )
                            }
                          >
                            <ArrowUpDown size={12} className={styles.vbpIcon} aria-hidden />
                          </button>
                        </td>
                        <td className={styles.cellCenter}>
                          <div className={styles.lineFieldWrap}>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className={`${styles.lineInputCompact} ${validationErrors.lineByKey?.[row.key]?.qty ? styles.errorFieldOutline : ""}`}
                              value={row.qty}
                              onChange={(e) => updateLine(row.key, { qty: e.target.value })}
                            />
                            {validationErrors.lineByKey?.[row.key]?.qty ? (
                              <div className={styles.lineCellError}>{validationErrors.lineByKey[row.key].qty}</div>
                            ) : null}
                          </div>
                        </td>
                        <td className={`${styles.cellCenter} ${styles.readOnlyQty}`}>
                          {Number(row.receivedQty) || 0}
                        </td>
                        <td className={`${styles.cellCenter} ${styles.readOnlyQty}`}>
                          {Number(row.cancelledQty) || 0}
                        </td>
                        <td className={`${styles.cellCenter} ${styles.readOnlyQty}`}>
                          {computeLineBalance(row.qty, row.receivedQty, row.cancelledQty)}
                        </td>
                        <td className={styles.cellCenter}>
                          <div className={styles.lineFieldWrap}>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className={`${styles.lineInputCompact} ${validationErrors.lineByKey?.[row.key]?.rate ? styles.errorFieldOutline : ""}`}
                              value={row.rate}
                              onChange={(e) => updateLine(row.key, { rate: e.target.value })}
                            />
                            {validationErrors.lineByKey?.[row.key]?.rate ? (
                              <div className={styles.lineCellError}>{validationErrors.lineByKey[row.key].rate}</div>
                            ) : null}
                          </div>
                        </td>
                        <td className={styles.lineValue}>{formatMoney(lineAmount(row))}</td>
                        <td className={styles.actionCell}>
                          <div className={`${styles.actionCellInner} ${styles.lineFieldWrap}`}>
                            <button
                              type="button"
                              className={`${styles.lineIconBtn} ${validationErrors.lineByKey?.[row.key]?.edd ? styles.errorFieldOutline : ""}`}
                              aria-label="Set expected delivery date"
                              title={
                                isBlanketPo
                                  ? "EDD is disabled for Blanket PO"
                                  : row.edd
                                    ? formatEddDisplay(row.edd)
                                    : "Set EDD"
                              }
                              disabled={isBlanketPo}
                              onClick={() => !isBlanketPo && setEddModalLineKey(row.key)}
                            >
                              <Calendar size={14} />
                            </button>
                            {validationErrors.lineByKey?.[row.key]?.edd ? (
                              <div className={styles.lineCellError}>{validationErrors.lineByKey[row.key].edd}</div>
                            ) : null}
                          </div>
                        </td>
                        <td className={styles.actionCell}>
                          <div className={styles.actionCellInner}>
                            <button
                              type="button"
                              className={styles.lineIconBtn}
                              aria-label="Add equipment tag"
                              title={row.eqt ? `EQT: ${row.eqt}` : "Set EQT"}
                              onClick={() => setEqtModalLineKey(row.key)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            type="button"
                            className={styles.lineIconBtn}
                            aria-label="Material details"
                            title="Rate trend"
                            onClick={() => setRateTrendLineKey(row.key)}
                          >
                            <Info size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {validationErrors.linesGeneral ? <div className={styles.tableError}>{validationErrors.linesGeneral}</div> : null}
          </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Back"
                title="Back to purchase order list"
                onClick={() => navigate(appPath(ws.listPath))}
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                className={styles.btnAux}
                onClick={() => setIncidentalOpen(true)}
                title="Incidental expenses"
              >
                Incidental Expenses
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${validationErrors.shipToLocation ? styles.errorFieldOutline : ""}`}
                aria-label="PO value and terms"
                title={
                  validationErrors.shipToLocation
                    ? "PO Terms — Ship-To location required"
                    : "PO value and terms"
                }
                onClick={() => {
                  setValueTermsTab(validationErrors.shipToLocation ? "terms" : "value");
                  setValueTermsOpen(true);
                }}
              >
                <FileText size={18} />
              </button>
            </div>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.btnAux}
                onClick={handleReset}
                disabled={saving}
                title="Clear form and reload PO number"
              >
                Reset
              </button>
              <button
                type="button"
                className={styles.btnAux}
                onClick={handlePreviewLinesToggle}
                disabled={saving || (!linesPreviewOnly && !hasAnyPoQty)}
                title={
                  linesPreviewOnly
                    ? "Show all items for this supplier"
                    : hasAnyPoQty
                      ? "Show only lines with PO quantity entered"
                      : "Enter PO quantity on at least one line to preview"
                }
              >
                {linesPreviewOnly ? "Show All" : "Preview"}
              </button>
              <button
                type="button"
                className={styles.btnSave}
                disabled={saving || editLoading || !hasClickedPreview}
                title={
                  !hasClickedPreview
                    ? "Click Preview first to review lines with quantity"
                    : amendMode
                      ? "Submit amendment for approval"
                      : isEditMode
                        ? "Update purchase order"
                        : "Save purchase order"
                }
                onClick={() => handleSave(amendMode ? "Approved" : "Draft")}
              >
                {saving
                  ? "Saving…"
                  : amendMode
                    ? amendPending
                      ? "Update Amendment"
                      : "Submit Amendment"
                    : isEditMode
                      ? "Update"
                      : "Save"}
              </button>
            </div>
          </footer>
        </div>
        )}
      </div>

      <PoOrderReferenceModal
        open={orderRefOpen}
        value={{
          orderReferenceNo: form.orderReferenceNo,
          orderReferenceDate: form.orderReferenceDate,
        }}
        onClose={() => setOrderRefOpen(false)}
        onSave={(v) => {
          patchForm({
            orderReferenceNo: v.orderReferenceNo,
            orderReferenceDate: v.orderReferenceDate,
          });
          setOrderRefOpen(false);
        }}
      />

      <PoSupplierLookupModal
        open={supplierOpen}
        supplierRows={supplierRowsForLookup}
        categoryOptions={supplierCategoryOptions}
        selectedSupplierId={form.supplierId}
        onClose={() => setSupplierOpen(false)}
        onApply={(row) => {
          if (!ws.isSupplierAllowed(row)) {
            toast.error("This supplier is not eligible for domestic purchase orders.");
            return;
          }
          const id = String(row._id || row.id);
          const currency = row.supplierCurrency || ws.defaultCurrency || "INR";
          setForm((prev) =>
            refreshPoValue({
              ...prev,
              supplierId: id,
              supplierName: row.supplierName || "",
              supplierCurrency: currency,
              lines: [],
              importMeta: {
                incoterm: row.supplierINCOTerms || prev.importMeta?.incoterm || "",
              },
              landedCost: {
                ...(prev.landedCost || {}),
                exchangeRate:
                  String(currency).toUpperCase() === "INR"
                    ? "1"
                    : prev.landedCost?.exchangeRate || "",
              },
              poTerms: {
                ...prev.poTerms,
                paymentTerms: row.supplierPaymentTerms || prev.poTerms.paymentTerms,
                freightTerms: row.supplierINCOTerms || prev.poTerms.freightTerms,
                shipToLocation: prev.poTerms.shipToLocation || shipToDefault.label,
                shipToLocationId: prev.poTerms.shipToLocationId || shipToDefault.id,
              },
            })
          );
          setSupplierOpen(false);
          setLinesPreviewOnly(false);
          setHasClickedPreview(false);
          if (hasTriedSave) {
            setValidationErrors(createEmptyPurchaseOrderValidation());
          }
          const linkedIndentIds = (form.sourceIndentIds || []).map(String).filter(Boolean);
          if (linkedIndentIds.length) {
            setLinesLoading(true);
            applyRequisitionLinesForVendor(linkedIndentIds, id)
              .then(({ matchedCount, indentLineCount }) => {
                if (matchedCount === 0) {
                  toast.info(
                    indentLineCount === 0
                      ? "Linked requisition has no material lines with quantity."
                      : "Selected vendor has no catalogue match for materials on the linked requisition."
                  );
                  return loadSupplierLines(id);
                }
                toast.success(`Loaded ${matchedCount} material line(s) from linked requisition(s).`);
              })
              .catch((err) => {
                toast.error(err?.message || "Failed to load requisition materials");
                loadSupplierLines(id);
              })
              .finally(() => setLinesLoading(false));
          } else {
            loadSupplierLines(id);
          }
        }}
      />

      <PoIncidentalExpensesModal
        open={incidentalOpen}
        rows={form.incidentalExpenses}
        currency={form.supplierCurrency}
        onClose={() => setIncidentalOpen(false)}
        onSave={(rows) => {
          patchForm({ incidentalExpenses: rows });
          setIncidentalOpen(false);
        }}
      />

      <PoValueTermsModal
        open={valueTermsOpen}
        initialTab={valueTermsTab}
        poValue={form.poValue}
        poTerms={form.poTerms}
        currency={form.supplierCurrency}
        locationRows={locations}
        defaultLocationId={activeLocationId || shipToDefault.id}
        transportModeOptions={transportModeOptions}
        freightTermsOptions={freightTermsOptions}
        transporterOptions={transporterOptions}
        paymentTermsOptions={paymentTermsOptions}
        onClose={() => setValueTermsOpen(false)}
        onSave={({ poValue, poTerms }) => {
          patchForm({ poValue, poTerms });
          setValueTermsOpen(false);
        }}
      />

      <PoExpectedDeliveryDateModal
        open={Boolean(eddModalLineKey)}
        line={eddLine}
        onClose={() => setEddModalLineKey("")}
        onSave={(patch) => {
          if (eddModalLineKey) updateLine(eddModalLineKey, patch);
          setEddModalLineKey("");
        }}
      />

      <PoExcessQuantityThresholdModal
        open={Boolean(eqtModalLineKey)}
        line={eqtLine}
        onClose={() => setEqtModalLineKey("")}
        onSave={(patch) => {
          if (eqtModalLineKey) updateLine(eqtModalLineKey, patch);
          setEqtModalLineKey("");
        }}
      />

      <PoItemRateTrendModal
        open={Boolean(rateTrendLineKey)}
        row={rateTrendLine}
        supplierName={form.supplierName}
        poNo={form.poNo}
        poDate={form.poDate}
        onClose={() => setRateTrendLineKey("")}
      />

      <PoItemTagModal
        open={Boolean(tagModalLineKey)}
        row={tagLine}
        onClose={() => setTagModalLineKey("")}
        onSave={(patch) => {
          if (tagModalLineKey) updateLine(tagModalLineKey, patch);
          setTagModalLineKey("");
        }}
      />
    </div>
  );
}
