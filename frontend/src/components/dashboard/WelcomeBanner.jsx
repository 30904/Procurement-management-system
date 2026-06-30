import { usePermissions } from "../../context/PermissionsContext.jsx";
import { APP_BRANDING_DEFAULTS } from "../../config/appBrandingDefaults.js";
import styles from "./WelcomeBanner.module.css";

export default function WelcomeBanner() {
  const { company, isSuperAdmin, roles } = usePermissions();
  const appName =
    company?.application?.applicationName ||
    company?.companyName ||
    APP_BRANDING_DEFAULTS.applicationName;
  const tagline =
    company?.application?.tagline || APP_BRANDING_DEFAULTS.tagline;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <section className={styles.banner}>
      <div className={styles.left}>
        <div className={styles.iconWrap}>
          <svg
            viewBox="0 0 48 48"
            className={styles.icon}
            fill="none"
            aria-hidden
          >
            <rect
              x="4"
              y="4"
              width="40"
              height="40"
              rx="10"
              fill="url(#bannerGrad)"
              opacity="0.12"
            />
            <defs>
              <linearGradient id="bannerGrad" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="var(--brand-primary)" />
                <stop offset="1" stopColor="#00aaaa" />
              </linearGradient>
            </defs>
            <path
              d="M16 18h16M16 24h10M16 30h13"
              stroke="var(--brand-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="34" cy="30" r="5" fill="#00aaaa" opacity="0.7" />
          </svg>
        </div>
        <div className={styles.copy}>
          <p className={styles.greeting}>{greeting}</p>
          <h2 className={styles.headline}>
            Welcome to <span className={styles.appName}>{appName}</span>
          </h2>
          <p className={styles.tagline}>{tagline}</p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.infoPill}>
          <span className={styles.pillLabel}>Role</span>
          <span className={styles.pillValue}>
            {isSuperAdmin
              ? "Super Admin"
              : roles?.[0]?.displayRoleName || roles?.[0]?.roleName || "User"}
          </span>
        </div>
        <div className={styles.infoPill}>
          <span className={styles.pillLabel}>Date</span>
          <span className={styles.pillValue}>
            {now.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className={styles.infoPill}>
          <span className={styles.pillLabel}>Version</span>
          <span className={styles.pillValue}>
            {company?.application?.version || "1.0.0"}
          </span>
        </div>
      </div>
    </section>
  );
}
