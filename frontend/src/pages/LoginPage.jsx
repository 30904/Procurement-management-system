import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ShieldCheck } from "lucide-react";
import { useLogin } from "../hooks/useLogin.js";
import { getToken } from "../utils/authStorage.js";
import { useAppBranding } from "../context/AppBrandingContext.jsx";
import { applyDocumentTitle } from "../utils/documentTitle.js";
import { APP_BRANDING_DEFAULTS } from "../config/appBrandingDefaults.js";
import ProcurementBrandMark from "../components/branding/ProcurementBrandMark.jsx";
import ShowPasswordIcon from "../assets/show_password.svg?react";
import HidePasswordIcon from "../assets/hide_password.svg?react";
import LoginPageDecor from "../components/login/LoginPageDecor.jsx";
import styles from "./LoginPage.module.css";

/** Set to true when SSO provider is wired up */
const SSO_LOGIN_ENABLED = false;

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    userId,
    setUserId,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading,
    submit,
  } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const { applicationName, developerName, copyrightText } = useAppBranding();
  const displayAppName = applicationName || APP_BRANDING_DEFAULTS.applicationName;

  useEffect(() => {
    if (getToken()) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    applyDocumentTitle("/login", displayAppName);
  }, [displayAppName]);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const handleSso = () => {
    // Placeholder — wire to SSO provider when available
  };

  return (
    <div className={styles.page}>
      <LoginPageDecor />

      <div className={styles.center}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <ProcurementBrandMark iconOnly name={displayAppName} />
          </div>

          <h1 className={styles.welcomeTitle}>Welcome Back</h1>
          <p className={styles.appNameTitle}>{displayAppName}</p>

          <form className={styles.form} onSubmit={submit} noValidate>
            <div className={styles.field}>
              <label htmlFor="userId">Username</label>
              <div className={styles.inputWrap}>
                <User className={styles.inputIcon} size={18} strokeWidth={1.75} aria-hidden />
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  autoComplete="username"
                  className={styles.loginInput}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={loading}
                  placeholder="Enter Username"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrap}>
                <Lock className={styles.inputIcon} size={18} strokeWidth={1.75} aria-hidden />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`${styles.loginInput} ${styles.loginInputWithToggle}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter Password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={loading}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <ShowPasswordIcon className={styles.eyeIcon} />
                  ) : (
                    <HidePasswordIcon className={styles.eyeIcon} />
                  )}
                </button>
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={showPassword}
                  onChange={() => setShowPassword((v) => !v)}
                  disabled={loading}
                />
                <span>Show Password</span>
              </label>

              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button type="submit" className={styles.submitPrimary} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {SSO_LOGIN_ENABLED ? (
              <>
                <div className={styles.orDivider}>
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className={styles.submitSso}
                  onClick={handleSso}
                  disabled={loading}
                >
                  <ShieldCheck size={18} strokeWidth={1.75} aria-hidden />
                  Login with SSO
                </button>
              </>
            ) : null}
          </form>
        </div>
      </div>

      <footer className={styles.footer}>
        © {copyrightText || displayAppName}, Developed by {developerName || APP_BRANDING_DEFAULTS.developerName}. All rights
        reserved.
      </footer>
    </div>
  );
}
