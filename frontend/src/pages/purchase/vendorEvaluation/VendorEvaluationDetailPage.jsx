import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErpBackButton from "../../../components/common/ErpBackButton.jsx";
import VendorEvaluationDetailSections, {
  VendorEvaluationExecutiveHeader,
} from "../../../components/vendorEvaluation/VendorEvaluationDetailSections.jsx";
import VendorEvaluationSubNav from "../../../components/vendorEvaluation/VendorEvaluationSubNav.jsx";
import { vendorEvaluationPaths } from "../../../config/vendorEvaluationPaths.js";
import { getVendorEvaluationShowcaseRequest } from "../../../services/api.js";
import pageStyles from "../../../styles/page-toolbar.module.css";
import navStyles from "../../../components/vendorEvaluation/VendorEvaluation.module.css";
import "../../../styles/theme.css";
import "../../../styles/global.css";
import "../../../styles/erp-layout.css";

export default function VendorEvaluationDetailPage() {
  const { vendorCode } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getVendorEvaluationShowcaseRequest(vendorCode);
        if (!cancelled) setVendor(res?.data ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [vendorCode]);

  if (loading) return null;
  if (!vendor) {
    return (
      <div className={`erp-page ${pageStyles.page}`}>
        <p>Vendor not found.</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${pageStyles.page} ${navStyles.page}`}>
      <header className={`${pageStyles.toolbar} ${navStyles.noPrint}`}>
        <ErpBackButton onClick={() => navigate(vendorEvaluationPaths.list)} ariaLabel="Back to list" />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.toolbarTitle}`}>
          <span className="erp-breadcrumb-item">Vendor Evaluation Detail</span>
        </h1>
      </header>

      <VendorEvaluationSubNav vendorCode={vendorCode} active="detail" />
      <VendorEvaluationExecutiveHeader vendor={vendor} />
      <VendorEvaluationDetailSections vendor={vendor} />
    </div>
  );
}
