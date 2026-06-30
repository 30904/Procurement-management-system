import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ErpBackButton from "../../../components/common/ErpBackButton.jsx";
import { ChartPanel } from "../../../components/dashboard/DashboardShell.jsx";
import { tooltipStyle } from "../../../components/dashboard/chartTheme.js";
import VendorEvaluationSubNav from "../../../components/vendorEvaluation/VendorEvaluationSubNav.jsx";
import { VendorEvaluationExecutiveHeader } from "../../../components/vendorEvaluation/VendorEvaluationDetailSections.jsx";
import { vendorEvaluationPaths } from "../../../config/vendorEvaluationPaths.js";
import { getVendorEvaluationShowcaseRequest } from "../../../services/api.js";
import pageStyles from "../../../styles/page-toolbar.module.css";
import navStyles from "../../../components/vendorEvaluation/VendorEvaluation.module.css";

export default function VendorEvaluationTrendPage() {
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
          <span className="erp-breadcrumb-item">Performance Trend</span>
        </h1>
      </header>
      <VendorEvaluationSubNav vendorCode={vendorCode} active="trend" />
      <VendorEvaluationExecutiveHeader vendor={vendor} />
      <ChartPanel title="12-Month Performance Trend" hint="Monthly evaluation scores (showcase data)">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={vendor.trend || []}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={55} />
            <YAxis domain={[60, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="score" stroke="#197dfa" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}
