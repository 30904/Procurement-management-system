import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  ClipboardList,
  GitCompare,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import ErpBackButton from "../../../components/common/ErpBackButton.jsx";
import {
  ChartPanel,
  DashboardHero,
  DashboardPageWrap,
  DashboardStack,
  KpiCard,
  KpiGrid,
} from "../../../components/dashboard/DashboardShell.jsx";
import { vendorEvaluationPaths, VENDOR_EVALUATION_HUB_RETURN } from "../../../config/vendorEvaluationPaths.js";
import { getVendorEvaluationDashboardRequest } from "../../../services/api.js";
import pageStyles from "../../../styles/page-toolbar.module.css";
import navStyles from "../../../components/vendorEvaluation/VendorEvaluation.module.css";
import "../../../styles/theme.css";
import "../../../styles/global.css";
import "../../../styles/erp-layout.css";

export default function VendorEvaluationDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getVendorEvaluationDashboardRequest();
        if (!cancelled) setStats(res?.data ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  return (
    <DashboardPageWrap>
      <header className={`${pageStyles.toolbar} ${navStyles.noPrint}`}>
        <ErpBackButton onClick={() => navigate(VENDOR_EVALUATION_HUB_RETURN)} ariaLabel="Back to Purchase" />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.toolbarTitle}`}>
          <span className="erp-breadcrumb-item">Vendor Evaluation</span>
        </h1>
        <div className={navStyles.toolbarActions}>
          <Link to={vendorEvaluationPaths.list} className={navStyles.navChip}><ClipboardList size={14} /> Vendor List</Link>
          <Link to={vendorEvaluationPaths.compare} className={navStyles.navChip}><GitCompare size={14} /> Compare Vendors</Link>
        </div>
      </header>

      <DashboardStack>
        <DashboardHero
          eyebrow="Vendor Performance Management"
          title="Vendor Evaluation"
          titleAccent="Dashboard"
          subtitle="Enterprise vendor scorecards, performance trends, and procurement recommendations (showcase data)."
        />

        <KpiGrid>
          <KpiCard icon={<Users size={18} />} value={stats?.totalVendors ?? "—"} label="Total Vendors" />
          <KpiCard icon={<Award size={18} />} value={stats?.approvedVendors ?? "—"} label="Approved Vendors" />
          <KpiCard icon={<Star size={18} />} value={stats?.excellentVendors ?? "—"} label="Excellent Vendors" />
          <KpiCard icon={<BarChart3 size={18} />} value={stats?.averageVendors ?? "—"} label="Average Vendors" />
          <KpiCard icon={<TrendingUp size={18} />} value={stats?.poorVendors ?? "—"} label="Poor Vendors" />
          <KpiCard icon={<ClipboardList size={18} />} value={stats?.underReview ?? "—"} label="Under Review" />
          <KpiCard icon={<BarChart3 size={18} />} value={stats?.averageScore ?? "—"} label="Average Score" />
          <KpiCard
            icon={<Star size={18} />}
            value={stats?.highestRatedVendor?.name?.split(" ")[0] ?? "—"}
            label={`Highest Rated (${stats?.highestRatedVendor?.score ?? "—"})`}
          />
        </KpiGrid>

        <section className={navStyles.panel}>
          <h3 className={navStyles.panelTitle}>Top Rated Vendors</h3>
          <div className={navStyles.grid4}>
            {(stats?.topVendors || []).map((v) => (
              <Link key={v.vendorCode} to={vendorEvaluationPaths.detail(v.vendorCode)} className={navStyles.navChip} style={{ justifyContent: "space-between" }}>
                <span>{v.vendorName}</span>
                <strong>{v.currentScore}</strong>
              </Link>
            ))}
          </div>
        </section>

        <ChartPanel title="Rating Distribution" hint="Showcase vendor rating mix">
          <div className={navStyles.grid4}>
            {(stats?.ratingDistribution || []).map((row) => (
              <div key={row.name} className={navStyles.statItem}>
                <span className={navStyles.statLabel}>{row.name}</span>
                <span className={navStyles.statValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </ChartPanel>
      </DashboardStack>
    </DashboardPageWrap>
  );
}
