import { useCallback, useEffect, useMemo, useState } from "react";
import SearchIcon from "../../assets/search-icon.svg?react";
import NoRecordsIcon from "../../assets/no_records.svg";
import {
  listFrameworkMenuCatalogRequest,
  updateFrameworkMenuItemRequest,
  deleteFrameworkMenuItemRequest,
  createFrameworkGroupRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import ConfirmDialog from "../common/ConfirmDialog.jsx";
import AddSidebarMenuModal from "./AddSidebarMenuModal.jsx";
import MenuIconPicker from "./MenuIconPicker.jsx";
import { menuIconToActiveKey } from "../../config/iconRegistry.js";
import pageStyles from "../../pages/settings/ApplicationSetupPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";

const MENU_TYPE_LABELS = {
  sidebar_main: "Main sidebar",
  sidebar_bottom: "Bottom sidebar",
  landing_card: "Landing card",
  card_group: "Card group",
  page: "Page",
};

const SIDEBAR_TYPES = new Set(["sidebar_main", "sidebar_bottom"]);

const PROTECTED_SIDEBAR_CODES = new Set(["dashboard", "applications", "support"]);

function canDeleteSidebarRow(row) {
  return !row.isEssential && !PROTECTED_SIDEBAR_CODES.has(row.code);
}

function canDeleteModuleRow(row) {
  return !row.isEssential;
}

function rowKey(row) {
  return String(row._id || row.id);
}

function draftFromRow(row) {
  return {
    label: row.label ?? "",
    description: row.description ?? "",
    sequence: row.sequence ?? 0,
    iconKey: row.iconKey || "menu",
    isActive: row.isActive !== false,
    isHidden: !!row.isHidden,
    disabled: !!row.disabled,
    disabledHint: row.disabledHint ?? "",
  };
}

function draftsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * @param {"sidebar" | "modules" | "groups"} mode
 * - sidebar: Dashboard, Menu 1–8, Masters, Settings (sidebar rows only)
 * - modules: landing cards grouped by parent sidebar menu
 * - groups: card_group items with their child cards
 */
export default function MenuCatalogPanel({ mode = "sidebar", onMenusUpdated, onStatsChange }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ label: "", code: "", description: "", parentCode: "" });
  const [creatingGroup, setCreatingGroup] = useState(false);

  const isSidebarMode = mode === "sidebar";
  const isModulesMode = mode === "modules";
  const isGroupsMode = mode === "groups";

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFrameworkMenuCatalogRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
      const nextDrafts = {};
      data.forEach((r) => {
        nextDrafts[rowKey(r)] = draftFromRow(r);
      });
      setDrafts(nextDrafts);

      const scoped = data.filter((r) => {
        if (isSidebarMode) return SIDEBAR_TYPES.has(r.menuType);
        if (isModulesMode) return r.menuType === "landing_card";
        if (isGroupsMode) return r.menuType === "card_group";
        return true;
      });
      onStatsChange?.({
        total: scoped.length,
        active: scoped.filter((r) => r.isActive !== false).length,
        hidden: scoped.filter((r) => r.isHidden === true).length,
      });
    } catch (err) {
      toast.error(err?.message || "Failed to load menu catalog");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast, onStatsChange, isSidebarMode, isModulesMode, isGroupsMode]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const sidebarByCode = useMemo(() => {
    const map = {};
    rows
      .filter((r) => SIDEBAR_TYPES.has(r.menuType))
      .forEach((r) => {
        map[r.code] = r.label;
      });
    return map;
  }, [rows]);

  /** Sidebar entries that open a hub (have a route segment). */
  const sidebarHubMenus = useMemo(() => {
    return rows
      .filter((r) => SIDEBAR_TYPES.has(r.menuType))
      .filter((r) => String(r.segment || "").trim().length > 0)
      .sort((a, b) => {
        const typeRank = (row) => (row.menuType === "sidebar_main" ? 0 : 1);
        if (typeRank(a) !== typeRank(b)) return typeRank(a) - typeRank(b);
        return (a.sequence ?? 0) - (b.sequence ?? 0);
      });
  }, [rows]);

  const parentOptions = useMemo(() => {
    if (!isModulesMode && !isGroupsMode) return [];
    return sidebarHubMenus.map((menu) => {
      const childType = isGroupsMode ? "card_group" : "landing_card";
      return {
        code: menu.code,
        label: menu.label,
        moduleCount: rows.filter(
          (r) => r.menuType === childType && r.parentCode === menu.code
        ).length,
      };
    });
  }, [rows, sidebarHubMenus, isModulesMode, isGroupsMode]);

  useEffect(() => {
    if ((!isModulesMode && !isGroupsMode) || loading) return;
    if (!parentOptions.length) {
      setParentFilter("");
      return;
    }
    const isValid = parentOptions.some((p) => p.code === parentFilter);
    if (!parentFilter || !isValid) {
      setParentFilter(parentOptions[0].code);
    }
  }, [isModulesMode, isGroupsMode, loading, parentOptions, parentFilter]);

  const scopedRows = useMemo(() => {
    if (isSidebarMode) {
      return rows.filter((r) => SIDEBAR_TYPES.has(r.menuType));
    }
    if (isModulesMode) {
      return rows.filter((r) => r.menuType === "landing_card");
    }
    if (isGroupsMode) {
      return rows.filter((r) => r.menuType === "card_group");
    }
    return rows;
  }, [rows, isSidebarMode, isModulesMode, isGroupsMode]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedRows
      .filter((row) => {
        if (isModulesMode || isGroupsMode) {
          if (!parentFilter) return false;
          if (row.parentCode !== parentFilter) return false;
        }
        if (!q) return true;
        const hay = [row.code, row.label, row.segment, row.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }, [scopedRows, searchQuery, parentFilter, isModulesMode, isGroupsMode]);

  useEffect(() => {
    if (!onStatsChange || (!isModulesMode && !isGroupsMode)) return;
    const targetType = isGroupsMode ? "card_group" : "landing_card";
    const scoped = rows.filter(
      (r) =>
        r.menuType === targetType &&
        (!parentFilter || r.parentCode === parentFilter)
    );
    onStatsChange({
      total: scoped.length,
      active: scoped.filter((r) => r.isActive !== false).length,
      hidden: scoped.filter((r) => r.isHidden === true).length,
    });
  }, [rows, parentFilter, isModulesMode, isGroupsMode, onStatsChange]);

  const updateDraft = (id, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const countModulesForParent = useCallback(
    (parentCode) =>
      rows.filter(
        (r) => r.menuType === "landing_card" && r.parentCode === parentCode
      ).length,
    [rows]
  );

  const requestDelete = (row) => {
    const isProtected = isSidebarMode
      ? !canDeleteSidebarRow(row)
      : !canDeleteModuleRow(row);

    if (isProtected) {
      toast.error("This item is protected and cannot be deleted.");
      return;
    }

    const label = draftFromRow(row).label || row.label || row.code;
    let message;
    let title;

    if (isSidebarMode) {
      const moduleCount = countModulesForParent(row.code);
      title = "Delete sidebar menu?";
      message =
        moduleCount > 0
          ? `This will permanently delete "${label}" and ${moduleCount} module card(s) linked to it. This action cannot be undone.`
          : `This will permanently delete "${label}". This action cannot be undone.`;
    } else if (isGroupsMode) {
      const childCount = rows.filter((r) => r.parentCode === row.code).length;
      title = "Delete card group?";
      message = childCount > 0
        ? `This will permanently delete group "${label}" and ${childCount} card(s) inside it. This action cannot be undone.`
        : `This will permanently delete group "${label}". This action cannot be undone.`;
    } else {
      const parentLabel = sidebarByCode[row.parentCode] || row.parentCode;
      title = "Delete module card?";
      message = `This will permanently delete "${label}" from ${parentLabel}. This action cannot be undone.`;
    }

    setPendingDelete({ row, label, title, message });
  };

  const executeDelete = async () => {
    if (!pendingDelete?.row) return;
    const row = pendingDelete.row;
    const id = rowKey(row);
    const label = pendingDelete.label;

    setDeletingId(id);
    try {
      const scope = (isModulesMode || isGroupsMode) ? "module" : "sidebar";
      const res = await deleteFrameworkMenuItemRequest(row._id || row.id, scope);
      const data = res?.data || {};

      if (isSidebarMode) {
        const removed = data.modulesRemoved ?? 0;
        toast.success(
          removed > 0
            ? `Deleted "${label}" and ${removed} module(s).`
            : `Deleted "${label}".`
        );
      } else {
        toast.success(`Deleted module "${label}".`);
      }

      setPendingDelete(null);
      await loadCatalog();
      onMenusUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Failed to delete menu item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (row) => {
    const id = rowKey(row);
    const draft = drafts[id];
    const original = draftFromRow(row);
    if (!draft || draftsEqual(draft, original)) return;

    setSavingId(id);
    try {
      const payload = {
        label: draft.label.trim(),
        description: draft.description.trim(),
        sequence: Number(draft.sequence) || 0,
        isActive: !!draft.isActive,
        isHidden: !!draft.isHidden,
        disabled: !!draft.disabled,
        disabledHint: draft.disabledHint.trim(),
      };
      if (isSidebarMode) {
        payload.iconKey = draft.iconKey || "menu";
        payload.activeIconKey = menuIconToActiveKey(payload.iconKey);
      }
      const res = await updateFrameworkMenuItemRequest(row._id || row.id, payload);
      const updated = res?.data;
      const nextRows = rows.map((r) => (rowKey(r) === id ? { ...r, ...updated } : r));
      setRows(nextRows);
      setDrafts((prev) => ({
        ...prev,
        [id]: draftFromRow({ ...row, ...updated }),
      }));

      const scoped = nextRows.filter((r) => {
        if (isSidebarMode) return SIDEBAR_TYPES.has(r.menuType);
        if (isModulesMode) return r.menuType === "landing_card";
        if (isGroupsMode) return r.menuType === "card_group";
        return true;
      });
      onStatsChange?.({
        total: scoped.length,
        active: scoped.filter((r) => r.isActive !== false).length,
        hidden: scoped.filter((r) => r.isHidden === true).length,
      });
      toast.success(`Saved "${draft.label}"`);
      onMenusUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Failed to save menu item");
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.label.trim() || !newGroup.code.trim() || !parentFilter) return;
    setCreatingGroup(true);
    try {
      await createFrameworkGroupRequest({
        label: newGroup.label.trim(),
        code: newGroup.code.trim(),
        description: newGroup.description.trim(),
        parentCode: parentFilter,
      });
      toast.success(`Group "${newGroup.label.trim()}" created`);
      setNewGroup({ label: "", code: "", description: "", parentCode: "" });
      setAddGroupOpen(false);
      await loadCatalog();
      onMenusUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const countChildCards = useCallback(
    (groupCode) =>
      rows.filter((r) => r.menuType === "landing_card" && r.parentCode === groupCode).length,
    [rows]
  );

  const colSpan = isModulesMode ? 10 : isSidebarMode ? 10 : 10;
  const selectedParentLabel =
    parentOptions.find((p) => p.code === parentFilter)?.label ||
    sidebarByCode[parentFilter] ||
    "";

  return (
    <div className={pageStyles.panel}>
      <div className={`im-toolbar ${pageStyles.filterRow}`}>
        <div className="erp-search-wrap">
          <SearchIcon className="erp-search-icon" aria-hidden />
          <input
            type="text"
            className="erp-search-input"
            placeholder={
              isSidebarMode
                ? "Search sidebar menus…"
                : isGroupsMode
                  ? "Search groups…"
                  : "Search modules by label, sidebar, route…"
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {(isModulesMode || isGroupsMode) && (
          <select
            className={pageStyles.typeFilter}
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
            aria-label="Select sidebar menu"
            disabled={!parentOptions.length}
          >
            {parentOptions.map(({ code, label, moduleCount }) => (
              <option key={code} value={code}>
                {label} ({moduleCount} {isGroupsMode ? "group" : "module"}{moduleCount === 1 ? "" : "s"})
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className={pageStyles.secondaryBtn}
          onClick={loadCatalog}
          disabled={loading}
        >
          Refresh list
        </button>
        {isSidebarMode && (
          <button
            type="button"
            className={pageStyles.primaryBtn}
            onClick={() => setAddMenuOpen(true)}
            disabled={loading}
          >
            + Add menu
          </button>
        )}
        {isGroupsMode && (
          <button
            type="button"
            className={pageStyles.primaryBtn}
            onClick={() => { setAddGroupOpen(!addGroupOpen); setNewGroup({ label: "", code: "", description: "", parentCode: parentFilter }); }}
            disabled={loading || !parentFilter}
          >
            + Add group
          </button>
        )}
      </div>

      {isModulesMode && selectedParentLabel && (
        <p className={pageStyles.contextBanner}>
          Module cards for sidebar menu: <strong>{selectedParentLabel}</strong>
        </p>
      )}
      {isGroupsMode && selectedParentLabel && (
        <p className={pageStyles.contextBanner}>
          Card groups under sidebar menu: <strong>{selectedParentLabel}</strong>
        </p>
      )}

      {isGroupsMode && addGroupOpen && (
        <div className={pageStyles.contextBanner} style={{ display: "flex", gap: "0.8vw", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            className={pageStyles.cellInput}
            placeholder="Group label"
            value={newGroup.label}
            onChange={(e) => {
              const label = e.target.value;
              setNewGroup((g) => ({
                ...g,
                label,
                code: label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
              }));
            }}
            style={{ maxWidth: "12rem" }}
          />
          <input
            type="text"
            className={pageStyles.cellInput}
            placeholder="Code (auto)"
            value={newGroup.code}
            onChange={(e) => setNewGroup((g) => ({ ...g, code: e.target.value }))}
            style={{ maxWidth: "10rem" }}
          />
          <input
            type="text"
            className={pageStyles.cellInput}
            placeholder="Description (optional)"
            value={newGroup.description}
            onChange={(e) => setNewGroup((g) => ({ ...g, description: e.target.value }))}
            style={{ maxWidth: "16rem" }}
          />
          <button
            type="button"
            className={pageStyles.primaryBtn}
            disabled={!newGroup.label.trim() || !newGroup.code.trim() || creatingGroup}
            onClick={handleCreateGroup}
          >
            {creatingGroup ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            className={pageStyles.secondaryBtn}
            onClick={() => setAddGroupOpen(false)}
            disabled={creatingGroup}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="im-page-wrap">
        <div className="im-table-scroll">
          <table className="im-table im-table--master app-setup-menu-table">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Code</th>
                <th style={{ width: isModulesMode ? "14%" : "14%" }}>Label</th>
                {isSidebarMode ? (
                  <>
                    <th style={{ width: "10%" }}>Icon</th>
                    <th style={{ width: "10%" }}>Placement</th>
                  </>
                ) : isModulesMode ? (
                  <th style={{ width: "18%" }}>Description</th>
                ) : isGroupsMode ? (
                  <>
                    <th style={{ width: "14%" }}>Description</th>
                    <th style={{ width: "6%" }}>Cards</th>
                  </>
                ) : (
                  <>
                    <th style={{ width: "11%" }}>Type</th>
                    <th style={{ width: "8%" }}>Parent</th>
                  </>
                )}
                <th style={{ width: "14%" }}>Route</th>
                <th style={{ width: "6%" }}>Seq</th>
                <th style={{ width: "7%" }}>Active</th>
                <th style={{ width: "7%" }}>Hidden</th>
                <th style={{ width: "8%" }}>Flags</th>
                <th style={{ width: "8%" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="im-empty-row">
                  <td colSpan={colSpan} className="im-empty-cell">
                    <span className="im-no-records__text">Loading…</span>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr className="im-empty-row">
                  <td colSpan={colSpan} className="im-empty-cell">
                    <div className="im-no-records">
                      <img src={NoRecordsIcon} alt="" className="im-no-records__icon" />
                      <span className="im-no-records__text">
                        {isSidebarMode
                          ? "No sidebar menus found"
                          : isGroupsMode
                            ? selectedParentLabel
                              ? `No card groups for ${selectedParentLabel}`
                              : "Select a sidebar menu to manage its groups"
                            : selectedParentLabel
                              ? `No module cards for ${selectedParentLabel}`
                              : "Select a sidebar menu to manage its modules"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const id = rowKey(row);
                  const draft = drafts[id] || draftFromRow(row);
                  const dirty = !draftsEqual(draft, draftFromRow(row));
                  const isSaving = savingId === id;
                  const isDeleting = deletingId === id;
                  const rowBusy = isSaving || isDeleting;
                  const canDelete = isSidebarMode
                    ? canDeleteSidebarRow(row)
                    : canDeleteModuleRow(row);
                  return (
                    <tr key={id}>
                      <td>
                        <span className={pageStyles.codeMono}>{row.code}</span>
                      </td>
                      <td>
                        <input
                          type="text"
                          className={pageStyles.cellInput}
                          value={draft.label}
                          onChange={(e) => updateDraft(id, { label: e.target.value })}
                          disabled={rowBusy}
                        />
                      </td>
                      {isSidebarMode && (
                        <>
                          <td>
                            <MenuIconPicker
                              compact
                              value={draft.iconKey}
                              onChange={(key) => updateDraft(id, { iconKey: key })}
                              disabled={rowBusy}
                            />
                          </td>
                          <td>
                            <span className={pageStyles.badge}>
                              {MENU_TYPE_LABELS[row.menuType] || row.menuType}
                            </span>
                          </td>
                        </>
                      )}
                      {isModulesMode && (
                        <td>
                          <input
                            type="text"
                            className={pageStyles.cellInput}
                            value={draft.description}
                            onChange={(e) =>
                              updateDraft(id, { description: e.target.value })
                            }
                            disabled={rowBusy}
                            placeholder="Card description"
                          />
                        </td>
                      )}
                      {isGroupsMode && (
                        <>
                          <td>
                            <input
                              type="text"
                              className={pageStyles.cellInput}
                              value={draft.description}
                              onChange={(e) =>
                                updateDraft(id, { description: e.target.value })
                              }
                              disabled={rowBusy}
                              placeholder="Group description"
                            />
                          </td>
                          <td>
                            <span className={pageStyles.badge}>{countChildCards(row.code)}</span>
                          </td>
                        </>
                      )}
                      <td>
                        <span className={pageStyles.segmentMuted} title={row.segment}>
                          {row.segment || "—"}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className={`${pageStyles.cellInput} ${pageStyles.cellInputNum}`}
                          value={draft.sequence}
                          onChange={(e) =>
                            updateDraft(id, {
                              sequence: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          disabled={rowBusy}
                        />
                      </td>
                      <td>
                        <label className={pageStyles.toggle}>
                          <input
                            type="checkbox"
                            checked={draft.isActive}
                            onChange={(e) =>
                              updateDraft(id, { isActive: e.target.checked })
                            }
                            disabled={rowBusy}
                          />
                          <span>{draft.isActive ? "Yes" : "No"}</span>
                        </label>
                      </td>
                      <td>
                        <label className={pageStyles.toggle}>
                          <input
                            type="checkbox"
                            checked={draft.isHidden}
                            onChange={(e) =>
                              updateDraft(id, { isHidden: e.target.checked })
                            }
                            disabled={rowBusy}
                          />
                          <span>{draft.isHidden ? "Yes" : "No"}</span>
                        </label>
                      </td>
                      <td>
                        {row.requiresSuperAdmin && (
                          <span className={`${pageStyles.badge} ${pageStyles.badgeAdmin}`}>
                            Super Admin
                          </span>
                        )}
                        {row.disabled && <span className={pageStyles.badge}>Disabled</span>}
                        {isSidebarMode && !canDelete && (
                          <span className={pageStyles.badge}>Protected</span>
                        )}
                      </td>
                      <td>
                        <div className={pageStyles.actionCell}>
                          <button
                            type="button"
                            className={`${pageStyles.saveBtn} ${dirty ? pageStyles.saveBtnDirty : ""}`}
                            disabled={!dirty || rowBusy}
                            onClick={() => handleSave(row)}
                          >
                            {isSaving ? "Saving…" : dirty ? "Save" : "Saved"}
                          </button>
                          <button
                            type="button"
                            className={pageStyles.deleteBtn}
                            disabled={!canDelete || rowBusy}
                            title={
                              canDelete
                                ? isSidebarMode
                                  ? "Delete menu and its modules"
                                  : "Delete module"
                                : "Protected item"
                            }
                            onClick={() => requestDelete(row)}
                          >
                            {isDeleting ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.title || "Confirm delete"}
        message={pendingDelete?.message || ""}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={!!deletingId}
        onConfirm={executeDelete}
        onCancel={() => {
          if (!deletingId) setPendingDelete(null);
        }}
      />

      {isSidebarMode && (
        <AddSidebarMenuModal
          open={addMenuOpen}
          sidebarRows={rows.filter((r) => SIDEBAR_TYPES.has(r.menuType))}
          onClose={() => setAddMenuOpen(false)}
          onCreated={() => {
            loadCatalog();
            onMenusUpdated?.();
          }}
        />
      )}
    </div>
  );
}
