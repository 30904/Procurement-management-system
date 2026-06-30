import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  FileCheck,
  Globe,
  IndianRupee,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { useLocationScope } from "../../../context/LocationScopeContext.jsx";
import { usePermissions } from "../../../context/PermissionsContext.jsx";
import { appPath } from "../../../config/navigation.js";
import { getPurchaseDashboardStatsRequest } from "../../../services/api.js";
import {
  ChartPanel,
  ChartRow,
  DashboardHero,
  DashboardPageWrap,
  DashboardStack,
  KpiCard,
  KpiGrid,
} from "../DashboardShell.jsx";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_PRIMARY_DARK_HEX,
  CHART_PRIMARY_HEX,
  CHART_PRIMARY_LIGHT_HEX,
  tooltipStyle,
} from "../chartTheme.js";
import shellStyles from "../DashboardShell.module.css";
import styles from "./PurchaseDashboard.module.css";

const PIE_COLORS = [CHART_PRIMARY_HEX, CHART_PRIMARY_LIGHT_HEX];

const QUICK_ACTIONS = [
  {
    label: "Purchase Requisition",
    hint: "Create internal procurement requests",
    segment: "purchase/purchase-indent",
    icon: ClipboardList,
  },
  {
    label: "Purchase Orders",
    hint: "Generate and manage supplier POs",
    segment: "purchase/purchase-order/generate-po",
    icon: ShoppingCart,
  },
  {
    label: "Procurement Planning",
    hint: "Plan material procurement",
    segment: "purchase/material-purchase-planning",
    icon: Package,
  },
  {
    label: "Goods Receipt",
    hint: "Receive materials against PO",
    segment: "stores/grn",
    icon: Truck,
  },
  {
    label: "RFQ Management",
    hint: "Manage vendor quotation cycles",
    segment: "purchase/rfq-management",
    icon: FileCheck,
  },
  {
    label: "Invoice Verification",
    hint: "Verify supplier invoices",
    segment: "finance/invoice-verification",
    icon: Receipt,
  },
  {
    label: "Vendor Evaluation",
    hint: "Evaluate vendor performance",
    segment: "masters/purchase/vendor-evaluation",
    icon: Users,
  },
  {
    label: "Reports",
    hint: "Procurement reports and registers",
    segment: "reports/purchase",
    icon: BarChart3,
  },
];

const COMING_SOON_KPIS = [
  { label: "Pending Quality Inspection", hint: "Awaiting QC decision" },
  { label: "Pending Invoice Verification", hint: "Invoices to verify" },
  { label: "Pending Payments", hint: "Approved for payment" },
  { label: "Vendor Performance", hint: "Scorecard snapshot" },
  { label: "Recent Activities", hint: "Latest procurement events" },
];

const RFQ_PLACEHOLDER_KPIS = [
  { label: "Open RFQs", hint: "Active quotation cycles" },
  { label: "Closing Today", hint: "RFQs due today" },
  { label: "Award Pending", hint: "Awaiting PO award" },
  { label: "Expired RFQs", hint: "Past closing date" },
];

function formatLakh(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "₹ 0.00 L";
  return `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
}

function formatPercent(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00%";
  return `${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function truncateTick(value, maxLen = 20) {
  const s = String(value || "");
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SpendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      <p className={styles.chartTooltipValue}>{formatLakh(payload[0]?.value)}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      <p className={styles.chartTooltipValue}>{payload[0]?.value} POs</p>
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className={styles.pipeline}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`${styles.pipelineCard} ${styles.skeleton}`} />
      ))}
    </div>
  );
}

export default function PurchaseDashboard({ meta }) {
  const navigate = useNavigate();
  const { activeLocationId, activeLocation } = useLocationScope();
  const { company } = usePermissions();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPurchaseDashboardStatsRequest(activeLocationId || undefined);
        if (!cancelled) setStats(res?.data ?? null);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeLocationId]);

  const kpis = stats?.kpis || {};
  const pipeline = stats?.pipeline || {};
  const monthlyValue = stats?.monthlyDomesticPurchaseValue || [];
  const monthlyCount = stats?.monthlyDomesticPoCount || [];
  const topSuppliers = stats?.topDomesticSuppliers || [];
  const topItems = stats?.topDomesticItems || [];
  const spendShare = stats?.spendShare || [];
  const marketShare = stats?.marketShareTopItems || [];
  const counts = stats?.counts || {};

  const poCountChart = useMemo(
    () => monthlyCount.map((row) => ({ month: row.month, count: row.count })),
    [monthlyCount]
  );

  const totalYtdLakh =
    (Number(kpis.ytdPurchaseDomesticLakh) || 0) + (Number(kpis.ytdPurchaseImportLakh) || 0);

  const now = new Date();
  const locationLabel =
    activeLocation?.locationCode && activeLocation?.locationName
      ? `${activeLocation.locationCode} · ${activeLocation.locationName}`
      : activeLocation?.locationName || "All locations";

  const pipelineItems = [
    {
      key: "draftPo",
      label: "Draft POs",
      value: pipeline.draftPo ?? 0,
      hint: "Awaiting approval",
      segment: "purchase/purchase-order/generate-po",
      tone: "amber",
    },
    {
      key: "openPo",
      label: "Open Purchase Orders",
      value: pipeline.openPo ?? 0,
      hint: "Active orders",
      segment: "reports/purchase/purchase-order",
      tone: "teal",
    },
    {
      key: "awaitingReceipt",
      label: "Awaiting Goods Receipt",
      value: pipeline.awaitingReceipt ?? 0,
      hint: "Pending receipt",
      segment: "stores/grn",
      tone: "violet",
    },
    {
      key: "approvedIndents",
      label: "Approved Requisitions",
      value: pipeline.approvedIndents ?? 0,
      hint: "Ready to plan",
      segment: "purchase/purchase-indent/approved",
      tone: "slate",
    },
    {
      key: "completedPo",
      label: "Fulfilled Purchase Orders",
      value: pipeline.completedPo ?? 0,
      hint: "Received / closed",
      segment: "reports/purchase/purchase-order",
      tone: "green",
    },
  ];

  if (loading) {
    return (
      <DashboardPageWrap>
        <DashboardStack>
          <div className={`${styles.heroSkeleton} ${styles.skeleton}`} />
          <div className={shellStyles.kpiGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`${styles.kpiSkeleton} ${styles.skeleton}`} />
            ))}
          </div>
          <PipelineSkeleton />
        </DashboardStack>
      </DashboardPageWrap>
    );
  }

  return (
    <DashboardPageWrap>
      <DashboardStack>
        <DashboardHero
          eyebrow={`${greeting()} · Procurement`}
          title="Procurement"
          titleAccent="Command Center"
          subtitle={
            meta?.description ||
            "Spend intelligence, PO pipeline, and supplier insights for your procurement operations."
          }
          pills={[
            { label: "Location", value: locationLabel },
            { label: "Financial year", value: stats?.fyLabel || "FY" },
            { label: "YTD spend", value: formatLakh(totalYtdLakh) },
            {
              label: "As of",
              value: now.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            },
          ]}
        />

        <section className={styles.quickActions} aria-label="Quick actions">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.segment}
                type="button"
                className={styles.quickAction}
                onClick={() => navigate(appPath(action.segment))}
              >
                <span className={styles.quickActionIcon}>
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span className={styles.quickActionText}>
                  <span className={styles.quickActionLabel}>{action.label}</span>
                  <span className={styles.quickActionHint}>{action.hint}</span>
                </span>
                <ArrowUpRight size={16} className={styles.quickActionArrow} aria-hidden />
              </button>
            );
          })}
        </section>

        <KpiGrid>
          <KpiCard
            value={formatLakh(kpis.mtdPurchaseDomesticLakh)}
            label="MTD domestic spend"
            icon={<IndianRupee size={18} strokeWidth={2.2} aria-hidden />}
          />
          <KpiCard
            value={formatLakh(kpis.ytdPurchaseDomesticLakh)}
            label="YTD domestic spend"
            icon={<IndianRupee size={18} strokeWidth={2.2} aria-hidden />}
            iconColor={CHART_PRIMARY_DARK_HEX}
            iconBg="rgba(15, 124, 148, 0.12)"
          />
          <KpiCard
            value={formatLakh(kpis.mtdPurchaseImportLakh)}
            label="MTD import spend"
            icon={<Globe size={18} strokeWidth={2.2} aria-hidden />}
            iconColor="#0369a1"
            iconBg="rgba(3, 105, 161, 0.1)"
          />
          <KpiCard
            value={formatLakh(kpis.ytdPurchaseImportLakh)}
            label="YTD import spend"
            icon={<Globe size={18} strokeWidth={2.2} aria-hidden />}
            iconColor="#0c4a6e"
            iconBg="rgba(12, 74, 110, 0.1)"
          />
        </KpiGrid>

        <section className={styles.pipeline} aria-label="Procurement pipeline">
          {pipelineItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.pipelineCard} ${styles[`pipeline_${item.tone}`]}`}
              onClick={() => navigate(appPath(item.segment))}
            >
              <span className={styles.pipelineValue}>{item.value}</span>
              <span className={styles.pipelineLabel}>{item.label}</span>
              <span className={styles.pipelineHint}>{item.hint}</span>
            </button>
          ))}
        </section>

        <section className={styles.placeholderKpiRow} aria-label="RFQ KPI placeholders">
          {RFQ_PLACEHOLDER_KPIS.map((kpi) => (
            <article key={kpi.label} className={styles.placeholderKpi}>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
              <span className={styles.placeholderKpiLabel}>{kpi.label}</span>
              <span className={styles.placeholderKpiHint}>{kpi.hint}</span>
            </article>
          ))}
        </section>

        <section className={styles.placeholderKpiRow} aria-label="Operational KPI placeholders">
          {COMING_SOON_KPIS.map((kpi) => (
            <article key={kpi.label} className={styles.placeholderKpi}>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
              <span className={styles.placeholderKpiLabel}>{kpi.label}</span>
              <span className={styles.placeholderKpiHint}>{kpi.hint}</span>
            </article>
          ))}
        </section>

        {!stats?.hasPurchaseData ? (
          <p className={styles.emptyNote}>
            No approved purchase orders in the current financial year yet. KPIs and charts will
            populate as POs are approved at{" "}
            <strong>{company?.companyName || "your company"}</strong>.
          </p>
        ) : null}

        <ChartRow>
          <ChartPanel title="Domestic spend trend" hint="₹ Lakh · financial year (Apr–Mar)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyValue} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<SpendTooltip />} cursor={{ fill: "rgba(15, 124, 148, 0.06)" }} />
                <Bar dataKey="value" fill={CHART_PRIMARY_HEX} radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="PO volume" hint="Domestic orders · count per month">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={poCountChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="procPoVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PRIMARY_HEX} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={CHART_PRIMARY_HEX} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CountTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_PRIMARY_HEX}
                  fill="url(#procPoVolume)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_PRIMARY_HEX, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>
        </ChartRow>

        <div className={styles.secondaryKpiRow}>
          <article className={styles.secondaryKpi}>
            <span className={styles.secondaryLabel}>PPV value</span>
            <span className={styles.secondaryValue}>{formatLakh(kpis.ppvValueLakh)}</span>
          </article>
          <article className={styles.secondaryKpi}>
            <span className={styles.secondaryLabel}>PPV ratio</span>
            <span className={styles.secondaryValue}>{formatPercent(kpis.ppvRatioPercent)}</span>
          </article>
          <article className={styles.secondaryKpi}>
            <span className={styles.secondaryLabel}>Debit note MTD</span>
            <span className={styles.secondaryValue}>{formatLakh(kpis.debitNoteMtdDomesticLakh)}</span>
          </article>
          <article className={styles.secondaryKpi}>
            <span className={styles.secondaryLabel}>Debit note YTD</span>
            <span className={styles.secondaryValue}>{formatLakh(kpis.debitNoteYtdDomesticLakh)}</span>
          </article>
        </div>

        <ChartRow>
          <ChartPanel title="Top vendors by spend" hint="Domestic · ₹ Lakh · YTD">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliers} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={64}
                  tick={{ fill: CHART_AXIS, fontSize: 10 }}
                  tickFormatter={(v) => truncateTick(v, 16)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: CHART_AXIS, fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} Lakh`, "Spend"]} />
                <Bar dataKey="value" fill={CHART_PRIMARY_DARK_HEX} radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top materials by spend" hint="Domestic · ₹ Lakh · YTD">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={64}
                  tick={{ fill: CHART_AXIS, fontSize: 10 }}
                  tickFormatter={(v) => truncateTick(v, 16)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: CHART_AXIS, fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} Lakh`, "Spend"]} />
                <Bar dataKey="value" fill={CHART_PRIMARY_LIGHT_HEX} radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </ChartRow>

        <KpiGrid>
          <KpiCard
            value={String(counts.suppliers ?? 0)}
            label="Active vendors"
            icon={<Users size={18} strokeWidth={2.2} aria-hidden />}
          />
          <KpiCard
            value={String(counts.suppliersDomestic ?? 0)}
            label="Domestic vendors"
            icon={<Warehouse size={18} strokeWidth={2.2} aria-hidden />}
            iconColor={CHART_PRIMARY_DARK_HEX}
            iconBg="rgba(15, 124, 148, 0.12)"
          />
          <KpiCard
            value={String(counts.suppliersImport ?? 0)}
            label="Import vendors"
            icon={<Globe size={18} strokeWidth={2.2} aria-hidden />}
            iconColor="#0369a1"
            iconBg="rgba(3, 105, 161, 0.1)"
          />
          <KpiCard
            value={String(counts.items ?? 0)}
            label="Active materials"
            icon={<Package size={18} strokeWidth={2.2} aria-hidden />}
            iconColor="#64748b"
            iconBg="rgba(100, 116, 139, 0.12)"
          />
        </KpiGrid>

        <div className={styles.bottomSplit}>
          <ChartPanel title="Spend mix" hint="Domestic vs imports · YTD">
            <div className={styles.pieWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendShare.length ? spendShare : [{ name: "No data", value: 1 }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={spendShare.length > 1 ? 3 : 0}
                    stroke="none"
                  >
                    {(spendShare.length ? spendShare : [{ name: "No data" }]).map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={spendShare.length ? PIE_COLORS[index % PIE_COLORS.length] : CHART_GRID}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} Lakh`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {spendShare.map((row, i) => (
                  <div key={row.name} className={styles.pieLegendRow}>
                    <span className={styles.pieSwatch} style={{ background: PIE_COLORS[i] }} />
                    <span className={styles.pieLegendName}>{row.name}</span>
                    <span className={styles.pieLegendVal}>{formatLakh(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartPanel>

          <ChartPanel title="Top item concentration" hint="Share of domestic item spend">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={marketShare}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: CHART_AXIS, fontSize: 10 }} unit="%" axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tick={{ fill: CHART_AXIS, fontSize: 10 }}
                  tickFormatter={(v) => truncateTick(v, 14)}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, _n, props) => [
                    `${v}% · ${props?.payload?.spendLakh ?? 0} Lakh`,
                    "Share",
                  ]}
                />
                <Bar dataKey="value" fill={CHART_PRIMARY_HEX} radius={[0, 5, 5, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        <p className={styles.footnote}>
          <strong>D</strong> = Domestic · <strong>I</strong> = Imports · Amounts in ₹ Lakh · Scoped to
          active location
        </p>
      </DashboardStack>
    </DashboardPageWrap>
  );
}
