import styles from "../../pages/LoginPage.module.css";

const STROKE = "#94A3B8";
const STROKE_LIGHT = "#CBD5E1";
const STROKE_FAINT = "#E2E8F0";

/** Left — subtle manufacturing line-art watermark */
function ManufacturingWatermark() {
  return (
    <svg
      className={styles.manufacturingArt}
      viewBox="0 0 520 640"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Factory outline */}
      <g stroke={STROKE} strokeWidth="1.2" opacity="0.55">
        <path d="M48 420V280l52-28 52 28v140" />
        <path d="M100 252v-48l36-20 36 20v48" />
        <path d="M64 332h72M64 364h72M64 396h72" />
        <path d="M152 280v140M88 280h128" />
        <path d="M168 248v24M184 232v40M200 256v16" strokeWidth="1" opacity="0.7" />
      </g>

      {/* Warehouse */}
      <g stroke={STROKE} strokeWidth="1.2" opacity="0.5">
        <rect x="220" y="300" width="160" height="120" rx="2" />
        <path d="M220 340h160M260 300v120M340 300v120" />
        <path d="M248 420h24v-28h56v28h24" strokeWidth="1" />
        <path d="M232 312h16M272 312h16M312 312h16M352 312h16" strokeWidth="0.9" opacity="0.65" />
      </g>

      {/* Conveyor */}
      <g stroke={STROKE_LIGHT} strokeWidth="1" opacity="0.45">
        <path d="M80 480h280" />
        <path d="M80 500h240" />
        {[100, 140, 180, 220, 260, 300, 340].map((x) => (
          <circle key={x} cx={x} cy="490" r="4" stroke={STROKE_FAINT} fill="none" />
        ))}
        <rect x="300" y="472" width="48" height="16" rx="2" stroke={STROKE} strokeWidth="1" opacity="0.4" />
        <path d="M348 480h40l12-8v16l-12-8z" opacity="0.35" />
      </g>

      {/* Robotic arm */}
      <g stroke={STROKE} strokeWidth="1.15" opacity="0.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="400" cy="468" r="14" />
        <path d="M400 454V400l-48-32" />
        <path d="M352 368l56-24 40 32" />
        <path d="M448 376l-20 28-32 8" />
        <circle cx="396" cy="412" r="5" fill="none" />
        <path d="M388 420h20l6 14H382z" strokeWidth="1" opacity="0.4" />
      </g>

      {/* Floor / structural hints */}
      <path
        d="M32 520h420M32 520l40-24M452 520l-40-24"
        stroke={STROKE_FAINT}
        strokeWidth="0.9"
        opacity="0.35"
      />
    </svg>
  );
}

/** Right — procurement module network (Purchase, Stores, Quality) */
function ProcurementNetwork() {
  const nodes = [
    { id: "purchase", x: 120, y: 80, label: "purchase" },
    { id: "stores", x: 280, y: 60, label: "stores" },
    { id: "quality", x: 340, y: 180, label: "quality" },
    { id: "planning", x: 200, y: 220, label: "planning" },
    { id: "grn", x: 380, y: 300, label: "grn" },
  ];

  const links = [
    ["purchase", "planning"],
    ["planning", "stores"],
    ["purchase", "quality"],
    ["stores", "grn"],
    ["quality", "grn"],
    ["planning", "quality"],
  ];

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className={styles.industryNetwork}
      viewBox="0 0 460 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g stroke={STROKE_LIGHT} strokeWidth="1" strokeDasharray="4 6" opacity="0.5">
        {links.map(([a, b]) => {
          const na = byId[a];
          const nb = byId[b];
          return <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} />;
        })}
      </g>

      {/* Purchase — cart */}
      <g transform="translate(104, 64)" stroke={STROKE} strokeWidth="1.1" opacity="0.42">
        <path d="M4 14h12l1.2 7.5a1 1 0 0 0 1 1h7.2a1 1 0 0 0 1-1L27 17H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="26" r="1.5" fill="currentColor" />
        <circle cx="22" cy="26" r="1.5" fill="currentColor" />
      </g>

      {/* Stores — warehouse */}
      <g transform="translate(268, 44)" stroke={STROKE} strokeWidth="1.1" opacity="0.42">
        <rect x="4" y="10" width="24" height="18" rx="1.5" />
        <path d="M4 18h24M14 10v18M22 10v18" stroke={STROKE_FAINT} strokeWidth="0.8" />
      </g>

      {/* Quality — diamond / gem */}
      <g transform="translate(326, 164)" stroke={STROKE} strokeWidth="1.1" opacity="0.42">
        <path d="M16 4l12 8-12 20L4 12z" strokeLinejoin="round" />
        <path d="M4 12h24M16 4v28" stroke={STROKE_FAINT} strokeWidth="0.8" />
      </g>

      {/* Planning — clipboard */}
      <g transform="translate(186, 204)" stroke={STROKE} strokeWidth="1.1" opacity="0.42">
        <rect x="4" y="6" width="20" height="26" rx="2" />
        <path d="M8 6h12a2 2 0 0 1 2 2v2H6V8a2 2 0 0 1 2-2z" />
        <path d="M9 18h10M9 22h10M9 14h6" strokeLinecap="round" />
      </g>

      {/* GRN — inbound box */}
      <g transform="translate(364, 284)" stroke={STROKE} strokeWidth="1.1" opacity="0.42">
        <rect x="6" y="12" width="22" height="16" rx="1.5" />
        <path d="M6 18h22M17 8v6M14 11l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Node rings */}
      {nodes.map((n) => (
        <circle
          key={n.id}
          cx={n.x}
          cy={n.y}
          r="28"
          stroke={STROKE_FAINT}
          strokeWidth="0.8"
          fill="rgba(248, 250, 252, 0.4)"
          opacity="0.35"
        />
      ))}
    </svg>
  );
}

/** Bottom-right teal geometric panel */
function TealPolygon() {
  return (
    <svg
      className={styles.tealPolygon}
      viewBox="0 0 800 600"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="loginTealGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0C6A7E" />
          <stop offset="45%" stopColor="#0F7C94" />
          <stop offset="100%" stopColor="#3D9DB3" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="loginTealSheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <polygon
        points="320,600 800,600 800,120 520,280"
        fill="url(#loginTealGrad)"
      />
      <polygon points="380,600 800,600 800,200 560,340" fill="url(#loginTealSheen)" />
      <polygon
        points="800,600 800,380 680,480"
        fill="#0F7C94"
        fillOpacity="0.25"
      />
    </svg>
  );
}

export default function LoginPageDecor() {
  return (
    <div className={styles.decorLayer} aria-hidden>
      <div className={styles.decorBase} />
      <ManufacturingWatermark />
      <ProcurementNetwork />
      <TealPolygon />
      <div className={styles.centerClear} />
    </div>
  );
}
