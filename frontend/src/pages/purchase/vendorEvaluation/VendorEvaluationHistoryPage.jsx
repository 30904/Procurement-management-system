import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErpBackButton from "../../../components/common/ErpBackButton.jsx";
import VendorEvaluationRatingBadge from "../../../components/vendorEvaluation/VendorEvaluationRatingBadge.jsx";
import VendorEvaluationSubNav from "../../../components/vendorEvaluation/VendorEvaluationSubNav.jsx";
import { VendorEvaluationExecutiveHeader } from "../../../components/vendorEvaluation/VendorEvaluationDetailSections.jsx";
import { vendorEvaluationPaths } from "../../../config/vendorEvaluationPaths.js";
import { getVendorEvaluationShowcaseRequest } from "../../../services/api.js";
import pageStyles from "../../../styles/page-toolbar.module.css";
import navStyles from "../../../components/vendorEvaluation/VendorEvaluation.module.css";

export default function VendorEvaluationHistoryPage() {
  const { vendorCode } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    getVendorEvaluationShowcaseRequest(vendorCode).then((res) => setVendor(res?.data ?? null)).catch(() => setVendor(null));
  }, [vendorCode]);

  if (!vendor) return null;

  return (
    <div className={`erp-page ${pageStyles.page} ${navStyles.page}`}>
      <header className={pageStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(vendorEvaluationPaths.detail(vendorCode))} ariaLabel="Back" />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.toolbarTitle}`}>
          <span className="erp-breadcrumb-item">Evaluation History</span>
        </h1>
      </header>
      <VendorEvaluationSubNav vendorCode={vendorCode} active="history" />
      <VendorEvaluationExecutiveHeader vendor={vendor} />
      <section className={navStyles.panel}>
        <h3 className={navStyles.panelTitle}>Previous Evaluations</h3>
        <div className={navStyles.timeline}>
          {(vendor.history || []).map((item) => (
            <article key={item.id} className={navStyles.timelineItem}>
              <div className={navStyles.timelineDate}>{item.date}</div>
              <h4 className={navStyles.timelineTitle}>
                Score {item.score} · <VendorEvaluationRatingBadge rating={item.rating} />
              </h4>
              <p className={navStyles.execMeta}>{item.reviewer} — {item.note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
