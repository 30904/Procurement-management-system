import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileDown, GitCompare } from "lucide-react";
import ErpBackButton from "../../../components/common/ErpBackButton.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import VendorEvaluationRatingBadge from "../../../components/vendorEvaluation/VendorEvaluationRatingBadge.jsx";
import { vendorEvaluationPaths } from "../../../config/vendorEvaluationPaths.js";
import { useFooter } from "../../../context/FooterContext.jsx";
import { useToast } from "../../../hooks/useToast.js";
import {
  getVendorEvaluationOptionsRequest,
  listVendorEvaluationShowcaseRequest,
} from "../../../services/api.js";
import { downloadMasterWorkbook } from "../../../utils/masterExcelExport.js";
import pageStyles from "../../../styles/page-toolbar.module.css";
import navStyles from "../../../components/vendorEvaluation/VendorEvaluation.module.css";
import "../../../styles/theme.css";
import "../../../styles/global.css";
import "../../../styles/subcomponents.css";
import "../../../styles/erp-layout.css";

const EXPORT_COLUMNS = [
  { key: "vendorCode", label: "Vendor Code" },
  { key: "vendorName", label: "Vendor Name" },
  { key: "category", label: "Category" },
  { key: "materialGroup", label: "Material Group" },
  { key: "currentScore", label: "Current Score" },
  { key: "qualityScore", label: "Quality Score" },
  { key: "deliveryScore", label: "Delivery Score" },
  { key: "commercialScore", label: "Commercial Score" },
  { key: "complianceScore", label: "Compliance Score" },
  { key: "overallRating", label: "Overall Rating" },
  { key: "status", label: "Status" },
  { key: "lastEvaluationDate", label: "Last Evaluation Date" },
  { key: "nextReview", label: "Next Review" },
];

export default function VendorEvaluationListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    rating: "",
    status: "",
    materialGroup: "",
    department: "",
  });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVendorEvaluationShowcaseRequest(filters);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load vendor evaluations");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    getVendorEvaluationOptionsRequest().then((res) => setOptions(res?.data ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    setFooterContent(null);
    return () => setFooterContent(null);
  }, [setFooterContent]);

  const columns = useMemo(
    () => [
      { key: "vendorCode", label: "Vendor Code", width: "8%", align: "center", sortable: true, filterable: true },
      { key: "vendorName", label: "Vendor Name", width: "16%", align: "left", sortable: true, filterable: true },
      { key: "category", label: "Category", width: "9%", align: "center", sortable: true, filterable: true },
      { key: "materialGroup", label: "Material Group", width: "9%", align: "center", sortable: true, filterable: true },
      { key: "currentScore", label: "Current Score", width: "7%", align: "center", sortable: true },
      { key: "qualityScore", label: "Quality", width: "6%", align: "center", sortable: true },
      { key: "deliveryScore", label: "Delivery", width: "6%", align: "center", sortable: true },
      { key: "commercialScore", label: "Commercial", width: "7%", align: "center", sortable: true },
      { key: "complianceScore", label: "Compliance", width: "7%", align: "center", sortable: true },
      {
        key: "overallRating",
        label: "Overall Rating",
        width: "9%",
        align: "center",
        render: (_, row) => <VendorEvaluationRatingBadge rating={row.overallRating} />,
      },
      { key: "status", label: "Status", width: "8%", align: "center", filterable: true },
      { key: "lastEvaluationDate", label: "Last Evaluation", width: "8%", align: "center", type: "date", sortable: true },
      { key: "nextReview", label: "Next Review", width: "8%", align: "center", type: "date", sortable: true },
      { key: "action", label: "Action", width: "6%", align: "center" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        key: "view",
        label: "View",
        icon: Eye,
        onClick: (row) => navigate(vendorEvaluationPaths.detail(row.vendorCode)),
      },
    ],
    [navigate]
  );

  const handleExportExcel = async () => {
    try {
      await downloadMasterWorkbook({
        sheetName: "Vendor Evaluation",
        fileName: "vendor-evaluation-register.xlsx",
        columns: EXPORT_COLUMNS,
        rows,
      });
    } catch (err) {
      toast.error(err?.message || "Export failed");
    }
  };

  const handleExportPdf = () => window.print();

  return (
    <div className={`erp-page ${pageStyles.page}`}>
      <header className={`${pageStyles.toolbar} ${navStyles.noPrint}`}>
        <ErpBackButton onClick={() => navigate(vendorEvaluationPaths.dashboard)} ariaLabel="Back" />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.toolbarTitle}`}>
          <span className="erp-breadcrumb-item">Vendor Evaluation Register</span>
        </h1>
        <div className={navStyles.toolbarActions}>
          <button type="button" className="erp-btn erp-btn--secondary" onClick={() => navigate(vendorEvaluationPaths.compare)}>
            <GitCompare size={14} /> Compare
          </button>
          <button type="button" className="erp-btn erp-btn--secondary" onClick={handleExportExcel}>
            <FileDown size={14} /> Excel
          </button>
          <button type="button" className="erp-btn erp-btn--secondary" onClick={handleExportPdf}>
            <FileDown size={14} /> PDF
          </button>
        </div>
      </header>

      <div className={navStyles.filters}>
        <div className={navStyles.filterField}>
          <label>Vendor</label>
          <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search vendor" />
        </div>
        <div className={navStyles.filterField}>
          <label>Category</label>
          <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
            <option value="">All</option>
            {(options?.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={navStyles.filterField}>
          <label>Rating</label>
          <select value={filters.rating} onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}>
            <option value="">All</option>
            {(options?.ratings || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={navStyles.filterField}>
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            {(options?.statuses || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={navStyles.filterField}>
          <label>Material Group</label>
          <select value={filters.materialGroup} onChange={(e) => setFilters((f) => ({ ...f, materialGroup: e.target.value }))}>
            <option value="">All</option>
            {(options?.materialGroups || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={navStyles.filterField}>
          <label>Department</label>
          <select value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
            <option value="">All</option>
            {(options?.departments || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} actions={actions} searchPlaceholder="Search in results..." pageSize={10} />
    </div>
  );
}
