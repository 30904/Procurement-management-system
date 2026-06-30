import { useEffect, useState } from "react";
import ErpBackButton from "../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../config/navigation.js";
import SaveBtnIcon from "../assets/save-btn.svg?react";
import AccountIcon from "../assets/account-icon.svg?react";
import InputField from "../components/subcomponents/InputField.jsx";
import ChangePasswordModal from "../components/modals/ChangePasswordModal.jsx";
import { getProfileRequest, updateProfileRequest } from "../services/api.js";
import { useToast } from "../hooks/useToast.js";
import styles from "../styles/page-toolbar.module.css";
import "../styles/theme.css";
import "../styles/global.css";
import "../styles/subcomponents.css";
import "../styles/erp-layout.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", userEmail: "", departmentName: "" });
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfileRequest();
        const data = res?.data;
        setProfile(data);
        setForm({
          name: data?.name || "",
          userEmail: data?.userEmail || "",
          departmentName: data?.departmentName || "",
        });
      } catch (err) {
        toast.error("Failed to load profile");
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
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await updateProfileRequest(form);
      setProfile(res?.data);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      name: profile?.name || "",
      userEmail: profile?.userEmail || "",
      departmentName: profile?.departmentName || "",
    });
    setEditing(false);
  }

  const roleName = (() => {
    const r = Array.isArray(profile?.role) ? profile.role[0] : profile?.role;
    if (!r) return profile?.userType || "—";
    if (typeof r === "object") return r.displayRoleName || r.roleName || r.roleCode || "—";
    return String(r);
  })();

  const createdAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const lastLogin = profile?.lastLoggedIn
    ? new Date(profile.lastLoggedIn).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  if (loading) return null;

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("dashboard"))} ariaLabel="Back to Dashboard" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title" style={{ cursor: "default" }}>
          <span className="erp-breadcrumb-item">My Profile</span>
        </h1>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "2vh", flex: 1, overflow: "auto" }}>
        {/* Profile Header Card */}
        <div className="dropdown-settings-card" style={{ border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "3vh 2vw", display: "flex", alignItems: "center", gap: "2vw" }}>
          <div style={{
            width: "5vw", height: "5vw", borderRadius: 0, background: "#e1efff",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <AccountIcon style={{ width: "3vw", height: "3vw", objectFit: "contain" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.2vw", fontWeight: 600, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>
              {profile?.name || "User"}
            </h2>
            <p style={{ margin: "0.3vh 0 0", fontSize: "0.88vw", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
              {roleName} &nbsp;·&nbsp; {profile?.userCode || "—"}
            </p>
            <p style={{ margin: "0.3vh 0 0", fontSize: "0.82vw", color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>
              Member since {createdAt} &nbsp;·&nbsp; Last login: {lastLogin}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6vw", flexShrink: 0 }}>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                style={{
                  border: "0.08vw solid var(--brand-primary)", background: "#ffffff", color: "var(--brand-primary)",
                  fontSize: "0.85vw", fontWeight: 500, fontFamily: "Inter, sans-serif",
                  padding: "0.6vh 1.2vw", cursor: "pointer",
                }}
              >
                Edit Profile
              </button>
            )}
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              style={{
                border: "0.08vw solid #e07b00", background: "#ffffff", color: "#e07b00",
                fontSize: "0.85vw", fontWeight: 500, fontFamily: "Inter, sans-serif",
                padding: "0.6vh 1.2vw", cursor: "pointer",
              }}
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="dropdown-settings-card" style={{ border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "2.5vh 2vw" }}>
          <h3 style={{ margin: "0 0 2vh", fontSize: "1.05vw", fontWeight: 550, color: "#0046d2", fontFamily: "Inter, sans-serif" }}>
            Profile Information
          </h3>

          <div className="sc-field-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "2vw 2.6vw" }}>
            <InputField
              label="Full Name"
              required
              value={form.name}
              onChange={(v) => set("name", v)}
              locked={!editing}
            />
            <InputField
              label="Username"
              value={profile?.userName || ""}
              locked
            />
            <InputField
              label="Email"
              value={form.userEmail}
              onChange={(v) => set("userEmail", v)}
              locked={!editing}
              placeholder="user@example.com"
            />
            <InputField
              label="User Code"
              value={profile?.userCode || ""}
              locked
            />
            <InputField
              label="Role"
              value={roleName}
              locked
            />
            <InputField
              label="Department"
              value={form.departmentName}
              onChange={(v) => set("departmentName", v)}
              locked={!editing}
              placeholder="Enter department"
            />
            <InputField
              label="Status"
              value={profile?.status || (profile?.isActive ? "Active" : "Inactive")}
              locked
            />
            <InputField
              label="User Type"
              value={profile?.userType || "—"}
              locked
            />
            <InputField
              label="Last Login"
              value={lastLogin}
              locked
            />
          </div>

          {editing && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2.5vh", paddingTop: "1.5vh", borderTop: "0.06vw solid #e8eef5", gap: "0.8vw" }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  border: "0.08vw solid #d2d2d2", background: "#ffffff", color: "#64748b",
                  fontSize: "0.85vw", fontWeight: 500, fontFamily: "Inter, sans-serif",
                  padding: "0.6vh 1.5vw", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <SaveBtnIcon
                className="erp-action-svg-btn"
                onClick={handleSave}
                style={{ height: "2.1vw", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
              />
            </div>
          )}
        </div>
      </div>

      {passwordOpen && (
        <ChangePasswordModal onClose={() => setPasswordOpen(false)} />
      )}
    </div>
  );
}
