import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "./ModalFooterActions.jsx";
import HidePasswordIcon from "../../assets/hide_password.svg";
import ShowPasswordIcon from "../../assets/show_password.svg?react";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { listRolesRequest, createRoleRequest, listLocationsRequest } from "../../services/api.js";
import "../../styles/subcomponents.css";

const STATUS_OPTS = ["Active", "Inactive"];

function getTodayDate() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function createInitialForm(initialData) {
  const roleCandidate = Array.isArray(initialData?.role) ? initialData.role[0] : null;
  const roleId =
    typeof roleCandidate === "string"
      ? roleCandidate
      : roleCandidate?._id
        ? String(roleCandidate._id)
        : "";

  if (initialData) {
    // If we have initialData (e.g. from DB), we might need to format the date
    let enrollmentDate = initialData.createdAt || "";
    if (enrollmentDate && enrollmentDate.includes("T")) {
      const d = new Date(enrollmentDate);
      if (!isNaN(d.getTime())) {
        enrollmentDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }
    }

    return {
      enrollmentDate: enrollmentDate || getTodayDate(),
      name: initialData.name || "",
      userName: initialData.userName || "",
      roleId,
      password: initialData.password || "",
      status: initialData.status || "Active",
      defaultLocationId: initialData.defaultLocationId
        ? String(initialData.defaultLocationId)
        : "",
      allowedLocationIds: Array.isArray(initialData.allowedLocationIds)
        ? initialData.allowedLocationIds.map((id) => String(id))
        : [],
      locationAccessMode: initialData.locationAccessMode || "restricted",
    };
  }

  return {
    enrollmentDate: getTodayDate(),
    name: "",
    userName: "",
    roleId: "",
    password: "",
    status: "Active",
    defaultLocationId: "",
    allowedLocationIds: [],
    locationAccessMode: "restricted",
  };
}

export default function UserManagementModal({ onClose, onSave, initialData }) {
  const toast = useToast();
  const isCreate = !initialData;
  const [form, setForm] = useState(createInitialForm(initialData));
  const [roleOptions, setRoleOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    let active = true;
    async function fetchRoles() {
      setRolesLoading(true);
      try {
        const res = await listRolesRequest();
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (!active) return;
        const options = rows
          .filter((r) => {
            const name = String(r?.displayRoleName || r?.roleName || "").trim().toLowerCase();
            return name !== "super admin";
          })
          .map((r) => {
            const id = r._id?.$oid || r._id || r.id;
            return {
              value: String(id),
              label: r.displayRoleName || r.roleName || r.roleCode || String(id),
            };
          });
        setRoleOptions(options);
      } catch {
        if (!active) return;
        setRoleOptions([]);
        toast.error("Failed to load roles");
      } finally {
        if (active) setRolesLoading(false);
      }
    }
    async function fetchLocations() {
      try {
        const res = await listLocationsRequest();
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (!active) return;
        setLocationOptions(
          rows.map((l) => ({
            value: String(l._id),
            label: l.name || l.locationId,
          }))
        );
      } catch {
        if (active) setLocationOptions([]);
      }
    }
    fetchRoles();
    fetchLocations();
    return () => {
      active = false;
    };
  }, [toast]);

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const fillDevData = useCallback(() => {
    const suffix = String(Date.now()).slice(-5);
    setForm({
      enrollmentDate: getTodayDate(),
      name: "Dev Test User",
      userName: `devuser_${suffix}`,
      roleId: roleOptions[0]?.value || "",
      password: "Dev@12345",
      status: "Active",
    });
    toast.info("Sample data filled (Alt+F1). Click Save to create.");
  }, [roleOptions, toast]);

  useCreateModalDevFill({ enabled: isCreate, onFill: fillDevData });

  async function handleCreateRole(roleName) {
    const normalized = String(roleName ?? "").trim();
    if (!normalized) return null;
    try {
      const res = await createRoleRequest({ roleName: normalized });
      const doc = res?.data;
      const id = doc?._id?.$oid || doc?._id || doc?.id;
      const value = id ? String(id) : "";
      const label = doc?.displayRoleName || doc?.roleName || doc?.roleCode || normalized;
      if (!value) return null;

      setRoleOptions((prev) => {
        if (prev.some((opt) => opt.value === value)) return prev;
        return [...prev, { value, label }];
      });
      toast.success("Role created successfully.");
      return { value, label };
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create role");
      return null;
    }
  }

  async function handleSave() {
    if (saving) return;
    if (!form.roleId) {
      toast.error("Please select a user role.");
      return;
    }
    if (isCreate && !String(form.password ?? "").trim()) {
      toast.error("Please enter a password for the new user.");
      return;
    }
    setSaving(true);
    try {
      const selectedRole = roleOptions.find(opt => opt.value === form.roleId);
      await onSave?.(form, selectedRole?.label);
      toast.success("User saved successfully.");
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="sc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={overlayStyle}>
      <div ref={modalRef} className="sc-modal" style={modalStyle}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">{initialData ? "Edit User" : "Create Client User"}</span>
          <button type="button" className="sc-modal-close" onClick={() => onClose()} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body">
          <div className="sc-field-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <InputField
              label="User Enrollment Date"
              required
              value={form.enrollmentDate}
              locked
            />
            <InputField
              label="User Name"
              required
              placeholder="Enter User Name"
              value={form.name}
              onChange={(v) => set("name", v)}
            />
            <SelectField
              label="User Role"
              required
              options={roleOptions}
              value={form.roleId}
              onChange={(v) => set("roleId", v)}
              disabled={rolesLoading}
              allowCreate
              createLabel="+ Add new entry"
              createPlaceholder="Type new role"
              onCreate={handleCreateRole}
            />
            <InputField
              label="User Username"
              required
              placeholder="Enter Username"
              value={form.userName}
              onChange={(v) => set("userName", v)}
              autoComplete="off"
            />
            
            {/* Password field with toggle */}
            <div className="sc-field">
              <label className={`sc-label${isCreate ? " sc-label-required" : ""}`}>
                User Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="sc-input"
                  placeholder={isCreate ? "Enter Password" : "Leave blank to keep current password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  style={{ paddingRight: "2.5vw" }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.6vw",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword
                    ? <ShowPasswordIcon style={{ width: "1.1vw", height: "auto" }} />
                    : <img src={HidePasswordIcon} style={{ width: "1.1vw", height: "auto" }} />
                  }
                </button>
              </div>
            </div>

            <StatusField
              label="Status"
              required
              value={form.status}
              onChange={(v) => set("status", v)}
            />
            <SelectField
              label="Default Location"
              options={locationOptions}
              value={form.defaultLocationId}
              onChange={(v) => set("defaultLocationId", v)}
            />
            <SelectField
              label="Location Access"
              options={[
                { value: "restricted", label: "Assigned locations only" },
                { value: "all", label: "All locations (HO)" },
              ]}
              value={form.locationAccessMode}
              onChange={(v) => set("locationAccessMode", v)}
            />
          </div>
          {locationOptions.length > 0 ? (
            <div style={{ marginTop: "0.75rem" }}>
              <label className="sc-label">Allowed Locations</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" }}>
                {locationOptions.map((opt) => {
                  const checked = form.allowedLocationIds.includes(opt.value);
                  return (
                    <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setForm((prev) => {
                            const next = checked
                              ? prev.allowedLocationIds.filter((id) => id !== opt.value)
                              : [...prev.allowedLocationIds, opt.value];
                            return { ...prev, allowedLocationIds: next };
                          });
                        }}
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <ModalFooterActions
          onCancel={onClose}
          onSave={handleSave}
          saving={saving}
          showDevHint={isCreate}
        />
      </div>
    </div>,
    document.body
  );
}
