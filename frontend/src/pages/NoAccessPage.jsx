import { useNavigate } from "react-router-dom";
import { appPath } from "../config/navigation.js";
import styles from "./NoAccessPage.module.css";

export default function NoAccessPage({ viewOnly = false }) {
  const navigate = useNavigate();

  return (
    <div className={`erp-page ${styles.wrap}`}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <svg viewBox="0 0 24 24" className={styles.lockIcon} fill="none" stroke="currentColor" strokeWidth="2">
            {viewOnly ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </>
            )}
          </svg>
        </div>
        <h1 className={styles.title}>
          {viewOnly ? "View Only" : "Access Restricted"}
        </h1>
        <p className={styles.desc}>
          {viewOnly
            ? "You have view-only access to this section. Editing is not available for your role."
            : "You don't have permission to access this section. Contact your administrator if you believe this is an error."}
        </p>
        <button
          type="button"
          className={styles.btn}
          onClick={() => navigate(appPath("dashboard"))}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
