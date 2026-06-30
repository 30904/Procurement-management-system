/**
 * Abstract finance-themed vector — no external image dependency.
 */
export default function FinanceIllustration() {
  return (
    <svg
      className="fi-svg"
      viewBox="0 0 440 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F3D91" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#0F766E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0F3D91" stopOpacity="0.2" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect width="440" height="320" fill="transparent" />
      <circle cx="90" cy="70" r="120" fill="url(#g2)" filter="url(#blur)" />
      <circle cx="360" cy="240" r="100" fill="url(#g2)" filter="url(#blur)" />
      <rect
        x="48"
        y="168"
        width="200"
        height="112"
        rx="14"
        fill="#FFFFFF"
        opacity="0.92"
      />
      <rect x="68" y="192" width="72" height="10" rx="4" fill="#0F3D91" opacity="0.35" />
      <rect x="68" y="214" width="120" height="8" rx="4" fill="#94A3B8" opacity="0.5" />
      <rect x="68" y="232" width="100" height="8" rx="4" fill="#94A3B8" opacity="0.35" />
      <path
        d="M260 88 L380 88 L380 248 L260 248 Z"
        fill="url(#g1)"
        opacity="0.95"
      />
      <path
        d="M284 208 L284 120 L312 160 L340 100 L368 140 L368 208 Z"
        fill="#FFFFFF"
        opacity="0.22"
      />
      <rect x="292" y="176" width="56" height="32" rx="6" fill="#FFFFFF" opacity="0.35" />
      <circle cx="320" cy="128" r="6" fill="#FFFFFF" opacity="0.9" />
      <rect x="120" y="52" width="200" height="56" rx="12" fill="#FFFFFF" opacity="0.18" />
      <rect x="140" y="72" width="90" height="8" rx="4" fill="#FFFFFF" opacity="0.55" />
      <rect x="140" y="88" width="140" height="6" rx="3" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}
