import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import ErpBackButton from "../../../components/common/ErpBackButton.jsx";
import VendorEvaluationDetailSections, {
  VendorEvaluationExecutiveHeader,
} from "../../../components/vendorEvaluation/VendorEvaluationDetailSections.jsx";
import { vendorEvaluationPaths } from "../../../config/vendorEvaluationPaths.js";
import { getVendorEvaluationShowcaseRequest } from "../../../services/api.js";
import pageStyles from "../../../styles/page-toolbar.module.css";
import navStyles from "../../../components/vendorEvaluation/VendorEvaluation.module.css";

export default function VendorEvaluationScorecardPage() {
  const { vendorCode } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    getVendorEvaluationShowcaseRequest(vendorCode).then((res) => setVendor(res?.data ?? null)).catch(() => setVendor(null));
  }, [vendorCode]);

  if (!vendor) return null;

  return (
    <div className={`erp-page ${pageStyles.page} ${navStyles.page} ${navStyles.printRoot}`}>
      <header className={`${pageStyles.toolbar} ${navStyles.noPrint}`}>
        <ErpBackButton onClick={() => navigate(vendorEvaluationPaths.detail(vendorCode))} ariaLabel="Back" />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.toolbarTitle}`}>
          <span className="erp-breadcrumb-item">Vendor Scorecard</span>
        </h1>
        <div className={navStyles.toolbarActions}>
          <button type="button" className="erp-btn erp-btn--primary" onClick={() => window.print()}>
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </header>

      <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
        <strong>MPBCDC Procurement Management System</strong>
        <div className={navStyles.execMeta}>Vendor Performance Scorecard · {new Date().toLocaleDateString("en-IN")}</div>
      </div>

      <VendorEvaluationExecutiveHeader vendor={vendor} />
      <VendorEvaluationDetailSections vendor={vendor} showTrendChart={false} />
    </div>
  );
}
