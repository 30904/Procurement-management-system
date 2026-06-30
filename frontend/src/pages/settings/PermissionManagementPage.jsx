import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import MenuLucideIcon from "../../components/common/MenuLucideIcon.jsx";
import { resolveMenuIconUrl } from "../../utils/menuIconUrl.js";
import {
  listFrameworkMenuCatalogRequest,
  listRolesRequest,
  getRoleRequest,
  updateRoleRequest,
} from "../../services/api.js";
import {
  permissionsToAccessMap,
  buildRolePermissions,
  syncParentAccessFromChildren,
} from "../../utils/permissionState.js";
import SearchIcon from "../../assets/search-icon.svg?react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import layoutStyles from "../../styles/page-toolbar.module.css";
import styles from "./PermissionManagementPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";

const SIDEBAR_TYPES = new Set(["sidebar_main", "sidebar_bottom"]);

function HubMenuIcon({ hub }) {
  const customUrl = hub.iconUrl ? resolveMenuIconUrl(hub.iconUrl) : null;
  if (customUrl) {
    return <img src={customUrl} alt="" className={styles.hubIcon} aria-hidden />;
  }
  return (
    <MenuLucideIcon
      iconKey={hub.iconKey || "menu"}
      className={styles.hubIconLucide}
      size={22}
      strokeWidth={2}
      aria-hidden
    />
  );
}

function AccessToggle({ value, onChange, disabled = false, compact = false }) {
  const options = [
    { key: "full", label: compact ? "Full" : "Full access" },
    { key: "view", label: compact ? "View" : "View only" },
    { key: "none", label: compact ? "None" : "No access" },
  ];

  return (
    <div className={styles.accessToggle} role="group" aria-label="Access level">
      {options.map((opt) => {
        const active = value === opt.key;
        const activeClass =
          opt.key === "view" && active
            ? styles.accessBtnViewActive
            : active
              ? styles.accessBtnActive
              : "";
        return (
          <button
            key={opt.key}
            type="button"
            className={`${styles.accessBtn}${active ? ` ${activeClass}` : ""}`}
            onClick={() => onChange(opt.key)}
            disabled={disabled}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PermissionManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshPermissions } = usePermissions();
  const { setFooterContent } = useFooter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const [menuFilter, setMenuFilter] = useState("");

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleData, setRoleData] = useState(null);

  const [sidebarRows, setSidebarRows] = useState([]);
  const [cardRows, setCardRows] = useState([]);
  const [sidebarAccess, setSidebarAccess] = useState({});
  const [cardAccess, setCardAccess] = useState({});
  const [initialSnapshot, setInitialSnapshot] = useState("");

  const cardsByParent = useMemo(() => {
    const map = {};
    cardRows.forEach((card) => {
      const parent = card.parentCode;
      if (!parent) return;
      if (!map[parent]) map[parent] = [];
      map[parent].push(card);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    );
    return map;
  }, [cardRows]);

  const catalogCodes = useMemo(() => {
    return [...sidebarRows.map((r) => r.code), ...cardRows.map((r) => r.code)];
  }, [sidebarRows, cardRows]);

  const loadCatalog = useCallback(async () => {
    const res = await listFrameworkMenuCatalogRequest();
    const data = Array.isArray(res?.data) ? res.data : [];
    const sidebars = data
      .filter((r) => SIDEBAR_TYPES.has(r.menuType))
      .sort((a, b) => {
        const typeRank = (row) => (row.menuType === "sidebar_main" ? 0 : 1);
        if (typeRank(a) !== typeRank(b)) return typeRank(a) - typeRank(b);
        return (a.sequence ?? 0) - (b.sequence ?? 0);
      });
    const cards = data
      .filter((r) => r.menuType === "landing_card" || r.menuType === "card_group")
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    setSidebarRows(sidebars);
    setCardRows(cards);
    const exp = {};
    sidebars.forEach((s) => {
      if (cards.some((c) => c.parentCode === s.code)) exp[s.code] = true;
    });
    cards.forEach((c) => {
      if (c.menuType === "card_group" && cards.some((ch) => ch.parentCode === c.code)) {
        exp[c.code] = true;
      }
    });
    setExpanded(exp);
    return { sidebars, cards };
  }, []);

  const loadRoles = useCallback(async () => {
    const res = await listRolesRequest();
    const data = Array.isArray(res?.data) ? res.data : [];
    const filtered = data.filter((r) => {
      const name = String(r.displayRoleName || r.roleName || "").toLowerCase();
      return name !== "super admin" && name !== "super_admin";
    });
    filtered.sort((a, b) =>
      String(a.roleCode || "").localeCompare(String(b.roleCode || ""), undefined, {
        numeric: true,
      })
    );
    setRoles(filtered);
    return filtered;
  }, []);

  const applyRolePermissions = useCallback((role, sidebars, cards) => {
    const map = permissionsToAccessMap(role?.permissions || []);
    const sidebar = {};
    const card = {};
    sidebars.forEach((row) => {
      sidebar[row.code] = row.isEssential ? "full" : map[row.code] || "none";
    });
    cards.forEach((row) => {
      card[row.code] = map[row.code] || "none";
    });
    const synced = syncParentAccessFromChildren(
      sidebar,
      card,
      cards.reduce((acc, c) => {
        const p = c.parentCode;
        if (!p) return acc;
        if (!acc[p]) acc[p] = [];
        acc[p].push(c);
        return acc;
      }, {})
    );
    setSidebarAccess(synced);
    setCardAccess(card);
    setInitialSnapshot(JSON.stringify({ sidebar: synced, card }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadCatalog();
        const filtered = await loadRoles();
        if (!cancelled && filtered.length) {
          setSelectedRoleId(String(filtered[0]._id || filtered[0].id));
        }
      } catch (err) {
        if (!cancelled) toast.error(err?.message || "Failed to load menu catalog");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCatalog, loadRoles, toast]);

  useEffect(() => {
    if (!selectedRoleId || !sidebarRows.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getRoleRequest(selectedRoleId);
        const role = res?.data;
        if (cancelled) return;
        setRoleData(role);
        applyRolePermissions(role, sidebarRows, cardRows);
      } catch (err) {
        if (!cancelled) toast.error(err?.message || "Failed to load role");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRoleId, sidebarRows, cardRows, applyRolePermissions, toast]);

  const isDirty = useMemo(() => {
    return (
      initialSnapshot !== "" &&
      initialSnapshot !== JSON.stringify({ sidebar: sidebarAccess, card: cardAccess })
    );
  }, [initialSnapshot, sidebarAccess, cardAccess]);

  const filteredSidebars = useMemo(() => {
    let result = sidebarRows;

    if (menuFilter) {
      result = result.filter((hub) => hub.code === menuFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((hub) => {
        const cards = cardsByParent[hub.code] || [];
        const allLabels = [hub.label, hub.code];
        cards.forEach((c) => {
          allLabels.push(c.label, c.code);
          (cardsByParent[c.code] || []).forEach((gc) => allLabels.push(gc.label, gc.code));
        });
        return allLabels.join(" ").toLowerCase().includes(q);
      });
    }

    return result;
  }, [sidebarRows, cardsByParent, searchQuery, menuFilter]);

  const setHubAccess = (code, level) => {
    setSidebarAccess((prev) => ({ ...prev, [code]: level }));
  };

  const setModuleAccess = (parentCode, code, level) => {
    setCardAccess((prev) => {
      const next = { ...prev, [code]: level };
      return next;
    });
    if (level !== "none") {
      setSidebarAccess((prev) => {
        const current = prev[parentCode] || "none";
        if (current === "none") return { ...prev, [parentCode]: level };
        if (level === "full" && current === "view") return { ...prev, [parentCode]: "full" };
        return prev;
      });
    }
  };

  const applyToAllModules = (parentCode, level) => {
    const cards = cardsByParent[parentCode] || [];
    setCardAccess((prev) => {
      const next = { ...prev };
      cards.forEach((c) => {
        if (!c.isEssential) next[c.code] = level;
        const grandChildren = cardsByParent[c.code] || [];
        grandChildren.forEach((gc) => {
          if (!gc.isEssential) next[gc.code] = level;
        });
      });
      return next;
    });
    if (level !== "none") setHubAccess(parentCode, level);
  };

  const toggleExpand = (code) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const expandAll = () => {
    const next = {};
    sidebarRows.forEach((s) => {
      if ((cardsByParent[s.code] || []).length) next[s.code] = true;
    });
    cardRows.forEach((c) => {
      if ((cardsByParent[c.code] || []).length) next[c.code] = true;
    });
    setExpanded(next);
  };

  const collapseAll = () => {
    const next = {};
    sidebarRows.forEach((s) => { next[s.code] = false; });
    cardRows.forEach((c) => { next[c.code] = false; });
    setExpanded(next);
  };

  const handleSave = async () => {
    if (!selectedRoleId || !roleData) return;
    setSaving(true);
    try {
      const syncedSidebar = syncParentAccessFromChildren(
        sidebarAccess,
        cardAccess,
        cardsByParent
      );
      const permissions = buildRolePermissions(
        syncedSidebar,
        cardAccess,
        catalogCodes,
        roleData.permissions || []
      );
      await updateRoleRequest(selectedRoleId, { permissions });
      await refreshPermissions?.();
      setRoleData((r) => (r ? { ...r, permissions } : r));
      setSidebarAccess(syncedSidebar);
      setInitialSnapshot(
        JSON.stringify({ sidebar: syncedSidebar, card: cardAccess })
      );
      toast.success("Permissions saved successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!initialSnapshot) return;
    try {
      const { sidebar, card } = JSON.parse(initialSnapshot);
      setSidebarAccess(sidebar);
      setCardAccess(card);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const moduleCount = cardRows.length;
    const hubCount = sidebarRows.length;
    setFooterContent(
      selectedRoleId
        ? `Managing ${hubCount} sidebar menus and ${moduleCount} module cards for ${roleData?.displayRoleName || roleData?.roleName || "selected role"}.`
        : "Select a role to manage menu and module access."
    );
    return () => setFooterContent(null);
  }, [
    setFooterContent,
    selectedRoleId,
    roleData,
    sidebarRows.length,
    cardRows.length,
  ]);

  if (loading) return null;

  return (
    <div className={`erp-page ${layoutStyles.page}`}>
      <header className={layoutStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/roles-access"))} ariaLabel="Back to Roles and Access" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration"))}
          >
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration/roles-access"))}
          >
            Roles &amp; Access
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Permission Management</span>
        </h1>
      </header>

      <div className={styles.layout}>
        <div className={styles.roleBar}>
          <div className={styles.roleField}>
            <label htmlFor="perm-role-select">Role</label>
            <select
              id="perm-role-select"
              className={styles.roleSelect}
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={!roles.length || saving}
            >
              {!roles.length ? (
                <option value="">No roles available</option>
              ) : (
                roles.map((r) => (
                  <option key={r._id || r.id} value={r._id || r.id}>
                    {r.roleCode} — {r.displayRoleName || r.roleName}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className={styles.roleField}>
            <label htmlFor="perm-menu-filter">Menu</label>
            <select
              id="perm-menu-filter"
              className={styles.roleSelect}
              value={menuFilter}
              onChange={(e) => {
                setMenuFilter(e.target.value);
                if (e.target.value) {
                  setExpanded((prev) => ({ ...prev, [e.target.value]: true }));
                }
              }}
              disabled={saving}
            >
              <option value="">All Menus</option>
              {sidebarRows.map((hub) => (
                <option key={hub.code} value={hub.code}>
                  {hub.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.legend} aria-hidden="false">
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotFull}`} />
              Full access (open &amp; edit)
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotView}`} />
              View only
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotNone}`} />
              Hidden / blocked
            </span>
          </div>
        </div>

        <div className={styles.toolbarRow}>
          <div className={`erp-search-wrap ${styles.searchWrap}`}>
            <SearchIcon className="erp-search-icon" aria-hidden />
            <input
              type="text"
              className="erp-search-input"
              placeholder="Search menus and modules…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={expandAll}>
            Expand all
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={collapseAll}>
            Collapse all
          </button>
        </div>

        <div className={styles.scrollArea}>
          {!selectedRoleId ? (
            <p className={styles.emptyState}>Create a role in Access Management first.</p>
          ) : filteredSidebars.length === 0 ? (
            <p className={styles.emptyState}>No menus match your search.</p>
          ) : (
            filteredSidebars.map((hub) => {
              const children = cardsByParent[hub.code] || [];
              const hasChildren = children.length > 0;
              const isOpen = !!expanded[hub.code] && hasChildren;
              const hubLevel = sidebarAccess[hub.code] || "none";
              return (
                <section key={hub.code} className={styles.hubSection}>
                  <div
                    className={styles.hubHeader}
                    onClick={() => hasChildren && toggleExpand(hub.code)}
                    onKeyDown={(e) => {
                      if (hasChildren && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        toggleExpand(hub.code);
                      }
                    }}
                    role={hasChildren ? "button" : undefined}
                    tabIndex={hasChildren ? 0 : undefined}
                  >
                    <HubMenuIcon hub={hub} />
                    <span className={styles.hubTitle}>{hub.label}</span>
                    <span className={styles.hubMeta}>
                      {hasChildren
                        ? `${children.length} module${children.length === 1 ? "" : "s"}`
                        : hub.segment
                          ? "Sidebar link"
                          : "No route"}
                    </span>
                    {hasChildren ? (
                      <span
                        className={`${styles.chevron}${isOpen ? ` ${styles.chevronOpen}` : ""}`}
                        aria-hidden
                      />
                    ) : null}
                    <AccessToggle
                      value={hub.isEssential ? "full" : hubLevel}
                      onChange={(level) => setHubAccess(hub.code, level)}
                      disabled={!!hub.isEssential || saving}
                      compact
                    />
                  </div>

                  {hasChildren && isOpen ? (
                    <div className={styles.hubBody}>
                      <div className={styles.row}>
                        <span className={styles.rowLabel}>
                          <strong>All modules</strong> under {hub.label}
                        </span>
                        <AccessToggle
                          value={hubLevel}
                          onChange={(level) => applyToAllModules(hub.code, level)}
                          disabled={saving}
                          compact
                        />
                      </div>
                      {children.map((card) => {
                        const level = cardAccess[card.code] || "none";
                        const q = searchQuery.trim().toLowerCase();
                        const grandChildren = cardsByParent[card.code] || [];
                        const hasGrandChildren = grandChildren.length > 0;
                        const isSubOpen = !!expanded[card.code];

                        if (
                          q &&
                          !`${card.label} ${card.code} ${hub.label} ${grandChildren.map((g) => `${g.label} ${g.code}`).join(" ")}`
                            .toLowerCase()
                            .includes(q)
                        ) {
                          return null;
                        }

                        return (
                          <div key={card.code}>
                            <div className={`${styles.row}${hasGrandChildren ? ` ${styles.rowGroup}` : ""}`}>
                              {hasGrandChildren ? (
                                <span
                                  className={`${styles.subChevron}${isSubOpen ? ` ${styles.subChevronOpen}` : ""}`}
                                  onClick={(e) => { e.stopPropagation(); toggleExpand(card.code); }}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={isSubOpen ? "Collapse" : "Expand"}
                                />
                              ) : null}
                              <span className={styles.rowLabel}>
                                {card.label}
                                {hasGrandChildren ? (
                                  <span className={styles.groupCount}>{grandChildren.length} cards</span>
                                ) : null}
                                {card.isEssential ? (
                                  <span className={styles.essentialBadge}>Required</span>
                                ) : null}
                                {card.description && !hasGrandChildren ? (
                                  <span className={styles.rowDesc}>{card.description}</span>
                                ) : null}
                              </span>
                              <AccessToggle
                                value={card.isEssential ? "full" : level}
                                onChange={(l) => {
                                  setModuleAccess(hub.code, card.code, l);
                                  if (hasGrandChildren) {
                                    setCardAccess((prev) => {
                                      const next = { ...prev };
                                      grandChildren.forEach((gc) => { next[gc.code] = l; });
                                      return next;
                                    });
                                  }
                                }}
                                disabled={!!card.isEssential || saving}
                                compact
                              />
                            </div>
                            {hasGrandChildren && isSubOpen ? (
                              <div className={styles.subGroup}>
                                {grandChildren.map((gc) => {
                                  const gcLevel = cardAccess[gc.code] || "none";
                                  if (
                                    q &&
                                    !`${gc.label} ${gc.code} ${card.label}`
                                      .toLowerCase()
                                      .includes(q)
                                  ) {
                                    return null;
                                  }
                                  return (
                                    <div key={gc.code} className={styles.row}>
                                      <span className={styles.rowLabel}>
                                        {gc.label}
                                        {gc.description ? (
                                          <span className={styles.rowDesc}>{gc.description}</span>
                                        ) : null}
                                      </span>
                                      <AccessToggle
                                        value={gc.isEssential ? "full" : gcLevel}
                                        onChange={(l) => {
                                          setModuleAccess(hub.code, gc.code, l);
                                          if (l !== "none") {
                                            setCardAccess((prev) => {
                                              const parentLevel = prev[card.code] || "none";
                                              if (parentLevel === "none") return { ...prev, [card.code]: l };
                                              if (l === "full" && parentLevel === "view") return { ...prev, [card.code]: "full" };
                                              return prev;
                                            });
                                          }
                                        }}
                                        disabled={!!gc.isEssential || saving}
                                        compact
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={!isDirty || saving}
          >
            Reset changes
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!selectedRoleId || !isDirty || saving}
          >
            {saving ? "Saving…" : "Save permissions"}
          </button>
        </footer>
      </div>
    </div>
  );
}
