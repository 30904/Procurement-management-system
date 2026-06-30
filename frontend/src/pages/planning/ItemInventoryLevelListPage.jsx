import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Pencil, RefreshCw, Scale } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import ItemInventoryLevelsModal from "../../components/modals/ItemInventoryLevelsModal.jsx";
import ItemInventoryLevelStatusSummaryModal from "../../components/modals/ItemInventoryLevelStatusSummaryModal.jsx";
import ItemDualUnitModal from "../../components/modals/ItemDualUnitModal.jsx";
import {
  getItemInventoryLevelStatusSummaryRequest,
  listItemInventoryLevelsRequest,
  saveItemInventoryLevelDualUnitRequest,
} from "../../services/api.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import {
  convertStoredQtyToView,
  getDisplayUom,
  isDualUnitConfigured,
  isSecondaryView,
  toggleDucView,
} from "../../utils/dualUnitConversion.js";
import pageStyles from "./ItemInventoryLevelListPage.module.css";
import styles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

function formatQty(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function LevelCell({ value, tone, onAdd }) {
  const formatted = formatQty(value);
  if (formatted == null) {
    return (
      <span className={pageStyles.levelCell}>
        <button
          type="button"
          className={pageStyles.addLevelBtn}
          onClick={onAdd}
          title="Set inventory levels"
          aria-label="Set inventory levels"
        >
          +
        </button>
      </span>
    );
  }
  const toneClass =
    tone === "rol" ? pageStyles.levelRol : tone === "min" ? pageStyles.levelMin : pageStyles.levelMax;
  return (
    <span className={pageStyles.levelCell}>
      <span className={`${pageStyles.levelValue} ${toneClass}`}>{formatted}</span>
    </span>
  );
}

const FILTER_OPTIONS = [
  { value: "all", label: "All items" },
  { value: "with", label: "With SL data" },
  { value: "without", label: "Without SL data" },
];

export default function ItemInventoryLevelListPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/stores");
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { options: uomOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.UOM);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slFilter, setSlFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelsRow, setLevelsRow] = useState(null);
  const [ducRow, setDucRow] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  /** Per-item DUC toggle: primary (default) | secondary */
  const [ducViewByItemId, setDucViewByItemId] = useState({});

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (slFilter !== "all") qs.set("slFilter", slFilter);
      if (categoryFilter) qs.set("category", categoryFilter);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await listItemInventoryLevelsRequest(suffix);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load item inventory levels");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [slFilter, categoryFilter, toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  DataTable.useRecordCount(rows, setFooterContent);

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.itemCategory).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const openLevels = (row) => setLevelsRow(row);

  const getDucView = (row) => ducViewByItemId[row.id] || "primary";

  const handleDucToggle = (row) => {
    if (!isDualUnitConfigured(row.dualUnit)) return;
    const id = row.id;
    setDucViewByItemId((prev) => ({
      ...prev,
      [id]: toggleDucView(prev[id] || "primary"),
    }));
  };

  const displayLevelValue = (row, storedValue) =>
    convertStoredQtyToView(storedValue, row.dualUnit, getDucView(row));

  const loadSummary = async () => {
    try {
      const res = await getItemInventoryLevelStatusSummaryRequest();
      setSummary(res?.data ?? null);
      setSummaryOpen(true);
    } catch (err) {
      toast.error(err?.message || "Failed to load status summary");
    }
  };

  const handleDualUnitSave = async (dualUnit) => {
    if (!ducRow?.id) return;
    try {
      await saveItemInventoryLevelDualUnitRequest(ducRow.id, dualUnit);
      toast.success("Dual unit updated.");
      const savedId = ducRow.id;
      setDucRow(null);
      setDucViewByItemId((prev) => {
        if (!prev[savedId]) return prev;
        const next = { ...prev };
        delete next[savedId];
        return next;
      });
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to update dual unit");
    }
  };

  const COLUMNS = useMemo(
    () => [
      {
        key: "itemNo",
        label: "Material Code",
        width: "9%",
        align: "center",
        sortable: true,
        filterable: true,
      },
      {
        key: "itemName",
        label: "Material Name",
        width: "12%",
        align: "left",
        sortable: true,
        filterable: true,
      },
      {
        key: "itemDescription",
        label: "Material Description",
        width: "14%",
        align: "left",
        sortable: true,
        filterable: true,
      },
      {
        key: "duc",
        label: "DUC",
        width: "5%",
        align: "center",
        render: (_, row) => {
          const configured = isDualUnitConfigured(row.dualUnit);
          const secondary = isSecondaryView(getDucView(row));
          if (!configured) {
            return (
              <span
                className={pageStyles.ducPlaceholder}
                title="Dual unit not configured for this item"
                aria-hidden
              >
                —
              </span>
            );
          }
          const primaryU = row.dualUnit.primaryUnit || row.uom;
          const secondaryU = row.dualUnit.secondaryUnit;
          const factor = row.dualUnit.conversionFactor;
          return (
            <button
              type="button"
              className={`${pageStyles.ducBtn} ${secondary ? pageStyles.ducBtnActive : ""}`}
              title={
                secondary
                  ? `Showing ${secondaryU} (click for ${primaryU}) · 1 ${primaryU} = ${factor} ${secondaryU}`
                  : `Showing ${primaryU} (click for ${secondaryU}) · 1 ${primaryU} = ${factor} ${secondaryU}`
              }
              aria-label={
                secondary
                  ? `Switch stock levels to ${primaryU}`
                  : `Switch stock levels to ${secondaryU}`
              }
              aria-pressed={secondary}
              onClick={() => handleDucToggle(row)}
            >
              <RefreshCw size={11} strokeWidth={2.2} />
            </button>
          );
        },
      },
      {
        key: "uom",
        label: "UoM",
        width: "6%",
        align: "center",
        sortable: true,
        filterable: true,
        render: (_, row) => {
          const view = getDucView(row);
          const label = getDisplayUom(row, view);
          const configured = isDualUnitConfigured(row.dualUnit);
          return (
            <span
              className={configured && isSecondaryView(view) ? pageStyles.uomAlt : undefined}
              title={
                configured
                  ? isSecondaryView(view)
                    ? `Alternate unit (primary: ${row.dualUnit.primaryUnit || row.uom})`
                    : `Primary unit`
                  : undefined
              }
            >
              {label}
            </span>
          );
        },
      },
      {
        key: "roq",
        label: "ROQ",
        width: "8%",
        align: "center",
        sortable: true,
        render: (val, row) => (
          <LevelCell value={displayLevelValue(row, val)} onAdd={() => openLevels(row)} />
        ),
      },
      {
        key: "rol",
        label: "ROL",
        width: "8%",
        align: "center",
        sortable: true,
        render: (val, row) => (
          <LevelCell value={displayLevelValue(row, val)} tone="rol" onAdd={() => openLevels(row)} />
        ),
      },
      {
        key: "minLevel",
        label: "Min Level",
        width: "8%",
        align: "center",
        sortable: true,
        render: (val, row) => (
          <LevelCell value={displayLevelValue(row, val)} tone="min" onAdd={() => openLevels(row)} />
        ),
      },
      {
        key: "maxLevel",
        label: "Max Level",
        width: "8%",
        align: "center",
        sortable: true,
        render: (val, row) => (
          <LevelCell value={displayLevelValue(row, val)} tone="max" onAdd={() => openLevels(row)} />
        ),
      },
      {
        key: "slStatus",
        label: "Status",
        width: "6%",
        align: "center",
        render: (_, row) => (
          <span
            className={`${pageStyles.slStatusDot} ${
              row.hasSlData ? pageStyles.slStatusDotOk : pageStyles.slStatusDotMissing
            }`}
            role="img"
            aria-label={row.hasSlData ? "Stock levels configured" : "Stock levels not configured"}
            title={row.hasSlData ? "Stock levels configured" : "Stock levels not configured"}
          />
        ),
      },
      { key: "action", label: "Action", width: "7%", align: "center" },
    ],
    [ducViewByItemId]
  );

  const actions = [
    {
      label: "Dual Unit Setup",
      icon: <Scale size={13} color="#197dfa" strokeWidth={1.9} />,
      onClick: (row) => setDucRow(row),
    },
    {
      label: "Inventory Levels",
      icon: <Layers size={13} color="#197dfa" strokeWidth={1.9} />,
      onClick: (row) => openLevels(row),
    },
    {
      label: "Edit",
      icon: <Pencil size={13} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) =>
        navigateWithHubReturn(`masters/purchase/item-master/${row.id}/edit`),
    },
  ];

  return (
    <div className={`erp-page ${styles.page} ${pageStyles.pageFill}`}>
      <MasterBreadcrumbToolbar
        defaultHubReturn="masters/stores"
        summaryTitle="Material INL"
      />

      <section className={`${pageStyles.panel} ${pageStyles.panelFill}`}>
        <div className={pageStyles.panelHeader}>
          <h2 className={pageStyles.panelTitle}>Material Inventory Level Summary</h2>
          <div className={pageStyles.panelActions}>
            <select
              className={pageStyles.filterSelect}
              value={slFilter}
              onChange={(e) => setSlFilter(e.target.value)}
              aria-label="SL filter"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {categories.length > 0 ? (
              <select
                className={pageStyles.filterSelect}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Category filter"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : null}
            <button type="button" className={pageStyles.btnSecondary} onClick={() => fetchRows()}>
              Apply Filter
            </button>
            <button
              type="button"
              className={pageStyles.btnSecondary}
              onClick={() => {
                setSlFilter("all");
                setCategoryFilter("");
              }}
            >
              Clear Filter
            </button>
            <button type="button" className={pageStyles.btnPrimary} onClick={loadSummary}>
              Status Summary
            </button>
          </div>
        </div>
        <div className={pageStyles.panelBody}>
          <DataTable
            className={pageStyles.tableWrap}
            tableClassName="im-table--inl-compact"
            columns={COLUMNS}
            rows={rows}
            loading={loading}
            actions={actions}
            showNewBtn={false}
            searchPlaceholder="Search material code, name, description…"
            pageSize={10}
            paginationAtTop
            hideBottomPagination
            hidePaginationTotalRecords
            disableInnerScroll
            alwaysShowPagination
          />
        </div>
      </section>

      <ItemInventoryLevelsModal
        open={Boolean(levelsRow)}
        row={levelsRow}
        uom={levelsRow?.uom}
        onClose={() => setLevelsRow(null)}
        onSaved={() => fetchRows()}
      />

      <ItemInventoryLevelStatusSummaryModal
        open={summaryOpen}
        summary={summary}
        onClose={() => setSummaryOpen(false)}
      />

      <ItemDualUnitModal
        open={Boolean(ducRow)}
        value={ducRow?.dualUnit}
        defaultPrimaryUnit={ducRow?.uom}
        uomOptions={uomOptions}
        onClose={() => setDucRow(null)}
        onSave={handleDualUnitSave}
      />
    </div>
  );
}
