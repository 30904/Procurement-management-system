import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { Plus, Tag } from "lucide-react";
import ItemTagViewModal from "../../components/purchase/ItemTagViewModal.jsx";
import { appPath } from "../../config/navigation.js";
import { MATERIAL_PURCHASE_PLANNING_PATHS } from "../../config/materialPurchasePlanningPaths.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import ReportExportButtons from "../../components/reports/ReportExportButtons.jsx";
import { listMaterialPurchaseRequirementsRequest } from "../../services/api.js";
import { downloadMasterWorkbook } from "../../utils/masterExcelExport.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatQty(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

function normalizeRow(doc) {
  const id = doc.itemId != null ? String(doc.itemId) : String(doc.id ?? "");
  return {
    ...doc,
    _id: id,
    id,
  };
}

const COLUMNS_BASE = [
  {
    key: "itemNo",
    label: "Material Code",
    width: "9%",
    minWidth: "5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "itemName",
    label: "Material Name",
    width: "10%",
    minWidth: "5rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "itemDescription",
    label: "Material Description",
    width: "14%",
    minWidth: "6rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "mpn",
    label: "MPN",
    width: "8%",
    minWidth: "4rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "tag",
    label: "Tag",
    width: "5%",
    minWidth: "3rem",
    align: "center",
  },
  {
    key: "uom",
    label: "UoM",
    width: "6%",
    minWidth: "3rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "demand",
    label: "Demand",
    width: "8%",
    minWidth: "4rem",
    align: "right",
    sortable: true,
    render: (val) => formatQty(val),
  },
  {
    key: "srSoh",
    label: "SR-SOH",
    width: "8%",
    minWidth: "4rem",
    align: "right",
    sortable: true,
    render: (val) => formatQty(val),
  },
  {
    key: "ippo",
    label: "IPPO",
    width: "8%",
    minWidth: "4rem",
    align: "right",
    sortable: true,
    render: (val) => formatQty(val),
  },
  {
    key: "toProcure",
    label: "To Procure",
    width: "9%",
    minWidth: "4.5rem",
    align: "right",
    sortable: true,
    render: (val) => formatQty(val),
  },
  { key: "action", label: "Action", width: "7%", minWidth: "3.5rem", align: "center" },
];

export default function MaterialPurchasePlanningPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocationId } = useLocationScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tagModalRow, setTagModalRow] = useState(null);

  const openTagModal = useCallback((row, e) => {
    e?.stopPropagation?.();
    setTagModalRow(row);
  }, []);

  const COLUMNS = useMemo(
    () =>
      COLUMNS_BASE.map((col) =>
        col.key === "tag"
          ? {
              ...col,
              render: (_, row) => (
                <button
                  type="button"
                  className="erp-icon-btn"
                  title="View item tag"
                  aria-label={`View material tag for ${row.itemNo || row.itemName || "material"}`}
                  onClick={(e) => openTagModal(row, e)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.15rem",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <Tag size={16} color="#0f3d91" strokeWidth={1.9} aria-hidden />
                </button>
              ),
            }
          : col
      ),
    [openTagModal]
  );

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMaterialPurchaseRequirementsRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load material purchase requirements");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, activeLocationId]);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleGeneratePo = useCallback(
    (row) => {
      if (!row.canGeneratePo) {
        if (!row.supplierId) {
          toast.error("No preferred vendor is linked for this item. Link a vendor in Material Master first.");
        } else if (Number(row.toProcure) <= 0) {
          toast.info("Nothing to procure — stock and open POs already cover demand.");
        }
        return;
      }
      navigate(appPath(MATERIAL_PURCHASE_PLANNING_PATHS.poCreatePath), {
        state: {
          mppPrefill: {
            supplierId: row.supplierId,
            supplierName: row.supplierName,
            sourceIndentIds: Array.isArray(row.contributingIndentIds) ? row.contributingIndentIds : [],
            lines: [
              {
                itemId: row.itemId,
                itemNo: row.itemNo,
                itemName: row.itemName,
                itemDescription: row.itemDescription,
                description: row.itemDescription,
                uom: row.uom,
                mpn: row.mpn,
                materialCode: row.materialCode,
                qcLevel: row.qcLevel,
                tag: row.tag,
                qty: row.toProcure,
                toProcure: row.toProcure,
              },
            ],
          },
        },
      });
    },
    [navigate, toast]
  );

  const ACTION_OPTIONS = useMemo(
    () => [
      {
        label: "Purchase Orders",
        icon: <Plus size={15} color="#e11d8f" strokeWidth={2} />,
        disabled: (row) => !row.canGeneratePo,
        onClick: handleGeneratePo,
      },
    ],
    [handleGeneratePo]
  );

  const handleExportExcel = useCallback(async () => {
    if (!rows.length) {
      toast.info("No rows to export.");
      return;
    }
    setExporting(true);
    try {
      const exportColumns = [
        { label: "Material Code", key: "itemNo" },
        { label: "Material Name", key: "itemName" },
        { label: "Material Description", key: "itemDescription" },
        { label: "MPN", key: "mpn" },
        { label: "UoM", key: "uom" },
        { label: "Demand", key: "demand", align: "right" },
        { label: "SR-SOH", key: "srSoh", align: "right" },
        { label: "IPPO", key: "ippo", align: "right" },
        { label: "To Procure", key: "toProcure", align: "right" },
        { label: "Vendor", key: "supplierName" },
      ];
      await downloadMasterWorkbook({
        sheetName: "MPP Requirements",
        fileName: "material-purchase-planning.xlsx",
        columns: exportColumns,
        rows,
        getCellValue: (row, col) => row[col.key],
      });
      toast.success("Excel file downloaded.");
    } catch (err) {
      toast.error(err?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }, [rows, toast]);

  const toolbarRight = (
    <ReportExportButtons
      showPdf={false}
      iconSize="compact"
      onExcel={rows.length ? handleExportExcel : undefined}
      exporting={exporting}
    />
  );

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(MATERIAL_PURCHASE_PLANNING_PATHS.hubPath))} ariaLabel="Back to Purchase" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath(MATERIAL_PURCHASE_PLANNING_PATHS.hubPath))}
          >
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{MATERIAL_PURCHASE_PLANNING_PATHS.title}</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        showNewBtn={false}
        searchPlaceholder="Search material code, name, MPN…"
        toolbarRight={toolbarRight}
        pageSize={10}
      />

      <ItemTagViewModal open={Boolean(tagModalRow)} row={tagModalRow} onClose={() => setTagModalRow(null)} />
    </div>
  );
}
