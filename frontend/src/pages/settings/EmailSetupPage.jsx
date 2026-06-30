import { useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import SaveBtnIcon from "../../assets/save-btn.svg?react";
import InputField from "../../components/subcomponents/InputField.jsx";
import styles from "../../styles/page-toolbar.module.css";
import {
  getEmailConfigRequest,
  saveEmailConfigRequest,
  sendTestEmailRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const INITIAL = {
  smtpHost: "",
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: "",
  smtpPass: "",
  fromName: "",
  fromEmail: "",
  replyTo: "",
  tlsRejectUnauthorized: false,
  isActive: false,
};

export default function EmailSetupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEmailConfigRequest();
        if (res?.data) {
          setForm((prev) => ({ ...prev, ...res.data }));
        }
      } catch {
        /* no config yet */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (saving) return;
    if (!form.smtpHost?.trim()) { toast.error("SMTP Host is required"); return; }
    if (!form.smtpUser?.trim()) { toast.error("SMTP Username is required"); return; }
    setSaving(true);
    try {
      const res = await saveEmailConfigRequest(form);
      if (res?.data) setForm((prev) => ({ ...prev, ...res.data }));
      toast.success("Email configuration saved");
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (testing) return;
    if (!testTo?.trim()) { toast.error("Enter a recipient email for test"); return; }
    if (!form.smtpHost?.trim()) { toast.error("SMTP Host is required"); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestEmailRequest({
        to: testTo.trim(),
        smtpHost: form.smtpHost,
        smtpPort: form.smtpPort,
        smtpSecure: form.smtpSecure,
        smtpUser: form.smtpUser,
        smtpPass: form.smtpPass,
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        tlsRejectUnauthorized: form.tlsRejectUnauthorized,
      });
      setTestResult({ success: true, message: res?.data?.message || "Sent!" });
      toast.success("Test email sent successfully!");
    } catch (err) {
      setTestResult({ success: false, message: err?.message || "Failed" });
      toast.error(err?.message || "Test email failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) return null;

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>Settings</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Email Configuration</span>
        </h1>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "2vh", flex: 1, overflow: "auto" }}>
        {/* SMTP Settings Card */}
        <div className="dropdown-settings-card" style={{ border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "2.5vh 2vw" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5vh" }}>
            <h2 style={{ margin: 0, fontSize: "1.05vw", fontWeight: 550, color: "#0046d2", fontFamily: "Inter, sans-serif" }}>
              SMTP Configuration
            </h2>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5vw", fontSize: "0.88vw", color: "#46505a", fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
              <span className="sc-toggle">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
                <span className="sc-toggle-slider" />
              </span>
              Enable Email
            </label>
          </div>

          <div className="sc-field-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "2vw 2.6vw" }}>
            <InputField label="SMTP Host" required placeholder="e.g. mail.example.com" value={form.smtpHost} onChange={(v) => set("smtpHost", v)} />
            <InputField label="SMTP Port" required placeholder="465" value={String(form.smtpPort)} onChange={(v) => set("smtpPort", parseInt(v) || 465)} />
            <div className="sc-field">
              <label className="sc-label">Connection Security</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", height: "4.3vh" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4vw", fontSize: "0.9vw", color: "#46505a", cursor: "pointer" }}>
                  <input type="radio" checked={form.smtpSecure === true} onChange={() => set("smtpSecure", true)} style={{ accentColor: "var(--brand-primary)" }} />
                  SSL/TLS
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4vw", fontSize: "0.9vw", color: "#46505a", cursor: "pointer" }}>
                  <input type="radio" checked={form.smtpSecure === false} onChange={() => set("smtpSecure", false)} style={{ accentColor: "var(--brand-primary)" }} />
                  STARTTLS
                </label>
              </div>
            </div>

            <InputField label="SMTP Username" required placeholder="user@example.com" value={form.smtpUser} onChange={(v) => set("smtpUser", v)} />
            <div className="sc-field">
              <label className="sc-label sc-label-required">SMTP Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  className="sc-input"
                  placeholder="Enter password"
                  value={form.smtpPass}
                  onChange={(e) => set("smtpPass", e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: "2.5vw" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: "0.6vw", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: "0.8vw", color: "#64748b",
                  }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <InputField label="From Name" placeholder="e.g. Procurement Management System" value={form.fromName} onChange={(v) => set("fromName", v)} />

            <InputField label="From Email" placeholder="noreply@example.com" value={form.fromEmail} onChange={(v) => set("fromEmail", v)} />
            <InputField label="Reply-To Email" placeholder="support@example.com" value={form.replyTo} onChange={(v) => set("replyTo", v)} />
            <div className="sc-field">
              <label className="sc-label">TLS Verify Certificate</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", height: "4.3vh" }}>
                <span className="sc-toggle">
                  <input
                    type="checkbox"
                    checked={form.tlsRejectUnauthorized}
                    onChange={(e) => set("tlsRejectUnauthorized", e.target.checked)}
                  />
                  <span className="sc-toggle-slider" />
                </span>
                <span style={{ fontSize: "0.85vw", color: "#64748b" }}>
                  {form.tlsRejectUnauthorized ? "Strict" : "Skip (self-signed OK)"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2.5vh", paddingTop: "1.5vh", borderTop: "0.06vw solid #e8eef5" }}>
            <SaveBtnIcon
              className="erp-action-svg-btn"
              onClick={handleSave}
              style={{ height: "2.1vw", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
            />
          </div>
        </div>

        {/* Test Email Card */}
        <div className="dropdown-settings-card" style={{ border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "2.5vh 2vw" }}>
          <h2 style={{ margin: "0 0 2vh", fontSize: "1.05vw", fontWeight: 550, color: "#0046d2", fontFamily: "Inter, sans-serif" }}>
            Send Test Email
          </h2>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "1.2vw" }}>
            <div style={{ flex: 1, maxWidth: "25vw" }}>
              <InputField
                label="Recipient Email"
                required
                placeholder="test@example.com"
                value={testTo}
                onChange={setTestTo}
              />
            </div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              style={{
                height: "4.3vh",
                padding: "0 1.5vw",
                background: testing ? "#94a3b8" : "#009696",
                color: "#ffffff",
                border: "none",
                fontSize: "0.9vw",
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                cursor: testing ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {testing ? "Sending..." : "Send Test Email"}
            </button>
          </div>

          {testResult && (
            <div style={{
              marginTop: "1.5vh",
              padding: "1vh 1vw",
              background: testResult.success ? "#f0fdf4" : "#fef2f2",
              border: `0.06vw solid ${testResult.success ? "#bbf7d0" : "#fecaca"}`,
              fontSize: "0.85vw",
              color: testResult.success ? "#166534" : "#991b1b",
              fontFamily: "Inter, sans-serif",
            }}>
              {testResult.success ? "✓ " : "✕ "}{testResult.message}
            </div>
          )}
        </div>

        {/* Templates Info Card */}
        <div className="dropdown-settings-card" style={{ border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "2.5vh 2vw" }}>
          <h2 style={{ margin: "0 0 1.5vh", fontSize: "1.05vw", fontWeight: 550, color: "#0046d2", fontFamily: "Inter, sans-serif" }}>
            Available Email Templates
          </h2>
          <p style={{ margin: "0 0 1.5vh", fontSize: "0.85vw", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
            Built-in templates that any application module can use via the email service API.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8vw" }}>
            {[
              { name: "welcome", desc: "New user registration" },
              { name: "otp", desc: "OTP verification" },
              { name: "status_change", desc: "Approval / rejection updates" },
              { name: "test", desc: "SMTP connectivity test" },
            ].map((t) => (
              <div key={t.name} style={{
                border: "0.08vw solid #e2e8f0",
                padding: "1.2vh 1.2vw",
                minWidth: "12vw",
                background: "#f8fafc",
              }}>
                <div style={{ fontSize: "0.9vw", fontWeight: 600, color: "var(--brand-primary)", fontFamily: "Inter, sans-serif", marginBottom: "0.3vh" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: "0.75vw", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
                  {t.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
