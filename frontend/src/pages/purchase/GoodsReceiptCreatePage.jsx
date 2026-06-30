import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import PoGenericLookupModal from "../../components/purchase/PoGenericLookupModal.jsx";
import GoodsReceiptMpbcdcSections from "../../components/purchase/GoodsReceiptMpbcdcSections.jsx";
import GoodsReceiptDocumentsSection from "../../components/purchase/GoodsReceiptDocumentsSection.jsx";
import { appPath } from "../../config/navigation.js";
import { resolveGoodsReceiptPaths } from "../../config/goodsReceiptPaths.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { useToast } from "../../hooks/useToast.js";
import {
  createGoodsReceiptRequest,
  getGoodsReceiptRequest,
  getPurchaseOrderRequest,
  listInventoryStoresRequest,
  listPurchaseOrdersRequest,
  updateGoodsReceiptRequest,
} from "../../services/api.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  buildGoodsReceiptDevFillForm,
  computeGrnTotal,
  computeReceiptQuantities,
  emptyGoodsReceiptForm,
  goodsReceiptDocToForm,
  goodsReceiptFormToPayload,
  prefillGrnFromPurchaseOrder,
} from "../../utils/goodsReceiptFormState.js";
import styles from "./PurchaseOrderCreatePage.module.css";
import indentStyles from "./PurchaseIndentForm.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LINE_PAGE_SIZE = 10;

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function GoodsReceiptCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const paths = useMemo(() => resolveGoodsReceiptPaths(location.pathname), [location.pathname]);
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);
  const toast = useToast();
  const { activeLocation, activeLocationId } = useLocationScope();
  const [form, setForm] = useState(() => emptyGoodsReceiptForm(getUserDisplayName()));
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(isEditMode);
  const [storeOptions, setStoreOptions] = useState([]);
  const [poRows, setPoRows] = useState([]);
  const [poOpen, setPoOpen] = useState(false);
  const [lineQuery, setLineQuery] = useState("");
  const [linePage, setLinePage] = useState(1);
  const [savedId, setSavedId] = useState(editId || "");

  const headerLocationId = useMemo(
    () => String(activeLocation?._id || activeLocationId || ""),
    [activeLocation, activeLocationId]
  );

  const patchForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchLine = useCallback((key, patch) => {
    setForm((prev) => {
      const lines = prev.lines.map((row) => {
        if (row.key !== key) return row;
        const merged = { ...row, ...patch };
        const qty = Number(merged.qty) || 0;
        const rate = Number(merged.rate) || 0;
        return { ...merged, amount: qty * rate };
      });
      const receiptQty = computeReceiptQuantities(lines, prev.receiptInformation?.rejectedQuantity);
      return {
        ...prev,
        lines,
        receiptInformation: { ...prev.receiptInformation, ...receiptQty },
      };
    });
  }, []);

  const totalAmount = useMemo(() => computeGrnTotal(form.lines), [form.lines]);

  const filteredLines = useMemo(() => {
    const q = lineQuery.trim().toLowerCase();
    if (!q) return form.lines;
    return form.lines.filter(
      (row) =>
        String(row.itemNo || "").toLowerCase().includes(q) ||
        String(row.itemName || "").toLowerCase().includes(q)
    );
  }, [form.lines, lineQuery]);

  const pageLines = useMemo(() => {
    const start = (linePage - 1) * LINE_PAGE_SIZE;
    return filteredLines.slice(start, start + LINE_PAGE_SIZE);
  }, [filteredLines, linePage]);

  const linePageCount = Math.max(1, Math.ceil(filteredLines.length / LINE_PAGE_SIZE));

  useEffect(() => {
    if (!headerLocationId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await listInventoryStoresRequest(headerLocationId);
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (cancelled) return;
        const options = rows.map((row) => ({
          value: String(row._id || row.id),
          label: row.storeName || row.storeCode || row.name || String(row._id),
        }));
        setStoreOptions(options);
        if (options.length === 1 && !form.inventoryStoreId) {
          patchForm({ inventoryStoreId: options[0].value });
        }
      } catch {
        if (!cancelled) setStoreOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [headerLocationId, form.inventoryStoreId, patchForm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listPurchaseOrdersRequest();
        const rows = (Array.isArray(res?.data) ? res.data : []).filter((po) => {
          const status = String(po.status || "");
          const grnStatus = String(po.grnStatus || "");
          return (
            (status === "Approved" || status === "Partially Received") &&
            grnStatus !== "Complete" &&
            status !== "Cancelled"
          );
        });
        if (!cancelled) setPoRows(rows);
      } catch {
        if (!cancelled) setPoRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || !editId) return;
    let cancelled = false;
    (async () => {
      setEditLoading(true);
      try {
        const res = await getGoodsReceiptRequest(editId);
        if (cancelled) return;
        const doc = res?.data;
        if (doc?.status !== "Draft") {
          toast.error("Only draft GRNs can be edited.");
          navigate(appPath(paths.detailPath(editId)), { replace: true });
          return;
        }
        setForm(goodsReceiptDocToForm(doc));
        setSavedId(editId);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load goods receipt");
          navigate(appPath(paths.listPath), { replace: true });
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode, navigate, paths, toast]);

  const handlePoLinked = useCallback(
    async (row) => {
      if (!row) return;
      try {
        const res = await getPurchaseOrderRequest(String(row._id || row.id));
        const po = res?.data;
        if (!po) {
          toast.error("Purchase order not found.");
          return;
        }
        setForm((prev) => prefillGrnFromPurchaseOrder(prev, po));
        setPoOpen(false);
      } catch (err) {
        toast.error(err?.message || "Failed to load purchase order");
      }
    },
    [toast]
  );

  const validateForm = () => {
    if (!form.supplierId) return "Select a purchase order to link vendor and lines.";
    if (!form.inventoryStoreId) return "Inventory store is required.";
    const activeLines = (form.lines || []).filter((line) => Number(line.qty) > 0);
    if (!activeLines.length) return "Add at least one line with quantity.";
    return "";
  };

  const handleSave = async () => {
    const errMsg = validateForm();
    if (errMsg) {
      toast.error(errMsg);
      return;
    }
    setSaving(true);
    try {
      const payload = goodsReceiptFormToPayload(form, {
        locationId: headerLocationId,
        inventoryStoreId: form.inventoryStoreId,
      });
      if (isEditMode) {
        await updateGoodsReceiptRequest(editId, payload);
        toast.success("Goods receipt updated.");
        navigate(appPath(paths.detailPath(editId)));
      } else {
        const res = await createGoodsReceiptRequest(payload);
        const id = String(res?.data?._id || res?.data?.id || "");
        toast.success("Goods receipt saved.");
        if (id) {
          navigate(appPath(paths.editPath(id)), { replace: true });
        } else {
          navigate(appPath(paths.listPath));
        }
      }
    } catch (err) {
      toast.error(err?.message || "Failed to save goods receipt");
    } finally {
      setSaving(false);
    }
  };

  useCreateModalDevFill({
    enabled: !isEditMode,
    onFill: () => setForm((prev) => buildGoodsReceiptDevFillForm(prev)),
  });

  const poDisplayRows = useMemo(
    () =>
      poRows.map((row) => ({
        ...row,
        id: String(row._id || row.id),
        poNo: row.poNo || "",
        supplierName: row.supplierName || "",
        grnStatus: row.grnStatus || "",
      })),
    [poRows]
  );

  if (editLoading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p style={{ padding: "1rem" }}>Loading goods receipt…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(paths.listPath))} ariaLabel="Back to list" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(paths.hubSegment))}>
            {paths.hubSegment === "purchase" ? "Purchase" : "Stores"}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(paths.listPath))}>
            {paths.title}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{isEditMode ? "Edit" : "Create"}</span>
        </h1>
      </header>

      <div className={`${styles.wrap} ${indentStyles.pageShell}`}>
        <div className={`${styles.card}${editLoading ? ` ${styles.cardHidden}` : ""}`}>
          <div className={indentStyles.formScroll}>
            <section className={indentStyles.sectionPanel}>
              <div className={indentStyles.sectionHeader}>
                <div>
                  <h2 className={indentStyles.sectionTitle}>GRN Header</h2>
                  <p className={indentStyles.sectionSubtitle}>Receipt document and purchase order linkage</p>
                </div>
                <div className={indentStyles.sectionHeaderMeta}>
                  <span className={`${indentStyles.statusChip} ${indentStyles.statusChipDraft}`}>
                    Status: <strong>{form.status || "Draft"}</strong>
                  </span>
                  <span className={indentStyles.statusChip}>
                    Amount: <strong>₹{formatMoney(totalAmount)}</strong>
                  </span>
                </div>
              </div>
              <div className={indentStyles.sectionBody}>
                <div className="sc-field-grid">
                  <InputField
                    label="GRN No."
                    value={form.grnNo || (isEditMode ? "" : "Assigned on save")}
                    locked
                  />
                  <DateField
                    label="Receipt Date"
                    type="date"
                    value={form.grnDate}
                    onChange={(v) => patchForm({ grnDate: v })}
                  />
                  <div className={styles.fieldWithBtn}>
                    <InputField
                      label="Purchase Order"
                      value={form.poNo}
                      placeholder="Select PO"
                      locked
                    />
                    <button
                      type="button"
                      className="sc-field-adjunct-btn"
                      aria-label="Select purchase order"
                      onClick={() => setPoOpen(true)}
                    >
                      <Search size={16} />
                    </button>
                  </div>
                  <InputField label="Vendor" value={form.supplierName} locked />
                  <SelectField
                    label="Inventory Store"
                    required
                    options={storeOptions}
                    value={form.inventoryStoreId}
                    onChange={(v) => patchForm({ inventoryStoreId: v })}
                    placeholder="Select store"
                  />
                  <InputField
                    label="Remarks"
                    value={form.remarks}
                    onChange={(v) => patchForm({ remarks: v })}
                    placeholder="Optional header remarks"
                  />
                </div>
              </div>
            </section>

            <GoodsReceiptMpbcdcSections form={form} setForm={setForm} poNo={form.poNo} />

            <GoodsReceiptDocumentsSection grnId={savedId || editId} disabled={!savedId && !editId} />

            <section className={indentStyles.sectionPanel}>
              <div className={indentStyles.sectionHeader}>
                <div>
                  <h2 className={indentStyles.sectionTitle}>Receipt Lines</h2>
                  <p className={indentStyles.sectionSubtitle}>Materials received against the purchase order</p>
                </div>
              </div>
              <div className={indentStyles.sectionBody}>
                <div className={indentStyles.linesToolbar}>
                  <div className={`sc-modal-search ${indentStyles.linesSearch}`}>
                    <Search className="sc-modal-search__icon" size={18} />
                    <input
                      type="text"
                      className="sc-modal-search__input"
                      placeholder="Search lines"
                      value={lineQuery}
                      onChange={(e) => {
                        setLineQuery(e.target.value);
                        setLinePage(1);
                      }}
                    />
                  </div>
                </div>
                <div className={`im-table-scroll ${indentStyles.linesTableWrap}`}>
                  <table className={`im-table im-table--master ${styles.poLinesTable}`}>
                    <thead>
                      <tr>
                        <th>Material Code</th>
                        <th>Material Name</th>
                        <th>UoM</th>
                        <th>PO Balance</th>
                        <th>Receive Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageLines.length === 0 ? (
                        <tr className="im-empty-row">
                          <td colSpan={7} className="im-empty-cell">
                            Select a purchase order to load receipt lines.
                          </td>
                        </tr>
                      ) : (
                        pageLines.map((row) => (
                          <tr key={row.key}>
                            <td>{row.itemNo}</td>
                            <td>{row.itemName}</td>
                            <td>{row.uom}</td>
                            <td style={{ textAlign: "right" }}>{row.balanceQty ?? "—"}</td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                className="sc-input"
                                value={row.qty}
                                onChange={(e) => patchLine(row.key, { qty: e.target.value })}
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>{formatMoney(row.rate)}</td>
                            <td style={{ textAlign: "right" }}>{formatMoney(row.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {linePageCount > 1 ? (
                  <div className={indentStyles.linesPager}>
                    <button
                      type="button"
                      disabled={linePage <= 1}
                      onClick={() => setLinePage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span>
                      Page {linePage} of {linePageCount}
                    </span>
                    <button
                      type="button"
                      disabled={linePage >= linePageCount}
                      onClick={() => setLinePage((p) => Math.min(linePageCount, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Back"
                onClick={() => navigate(appPath(paths.listPath))}
              >
                <ArrowLeft size={18} />
              </button>
              {!isEditMode ? (
                <span className={indentStyles.devHint}>Alt+F1 — fill sample data</span>
              ) : null}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnSave} disabled={saving} onClick={handleSave}>
                {saving ? "Saving…" : isEditMode ? "Update" : "Save"}
              </button>
            </div>
          </footer>
        </div>
      </div>

      <PoGenericLookupModal
        open={poOpen}
        title="Purchase Order"
        searchPlaceholder="Search PO no. or vendor…"
        columns={[
          { key: "poNo", label: "PO No." },
          { key: "supplierName", label: "Vendor" },
          { key: "grnStatus", label: "GRN Status" },
        ]}
        rows={poDisplayRows}
        selectedId={form.purchaseOrderId}
        onClose={() => setPoOpen(false)}
        onApply={handlePoLinked}
      />
    </div>
  );
}
