import { useEffect, useState, useRef } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { getRoleRequest, updateRoleRequest } from "../../services/api.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { useToast } from "../../hooks/useToast.js";

import SearchIcon from "../../assets/search-icon.svg?react";
import SaveBtnIcon from "../../assets/save-btn.svg?react";
import CancelBtn from "../../assets/cancel.svg";
import CloseBtn from "../../assets/close-btn.svg";

import styles from "../../styles/page-toolbar.module.css";

// Importing icons for the actual sidebar modules
import SalesIcon from "../../assets/sales.svg?react";
import PurchaseIcon from "../../assets/purchase.svg?react";
import ExpenseIcon from "../../assets/expense.svg?react";
import PaymentIcon from "../../assets/payment.svg?react";
import ReceiptIcon from "../../assets/receipt.svg?react";
import ContraIcon from "../../assets/contra.svg?react";
import JournalIcon from "../../assets/journal.svg?react";
import ReportsIcon from "../../assets/reports.svg?react";
import MastersIcon from "../../assets/masters.svg?react";
import SettingsIcon from "../../assets/settings-icon.svg?react";

import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

// Fetching sub-modules from a separate config file
import { SUBMODULES_MAP } from "../../config/subModulesConfig.js";

const MODULES_DATA = [
  { id: "menu_1", label: "Menu 1", icon: SalesIcon },
  { id: "menu_2", label: "Menu 2", icon: PurchaseIcon },
  { id: "menu_3", label: "Menu 3", icon: ExpenseIcon },
  { id: "menu_4", label: "Menu 4", icon: PaymentIcon },
  { id: "menu_5", label: "Menu 5", icon: ReceiptIcon },
  { id: "menu_6", label: "Menu 6", icon: ContraIcon },
  { id: "menu_7", label: "Menu 7", icon: JournalIcon },
  { id: "menu_8", label: "Menu 8", icon: ReportsIcon },
  { id: "masters", label: "Masters", icon: MastersIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function ModuleManagementPage() {
  const { checkPermission, refreshPermissions } = usePermissions();
  const toast = useToast();
  const navigate = useNavigate();
  const { id: roleId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [restrictedIds, setRestrictedIds] = useState([]);
  const containerRef = useRef(null);
  const modalRef = useRef(null);
  
  const [roleData, setRoleData] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [subSelections, setSubSelections] = useState({}); // { subId: { enabled: bool, view: bool, edit: bool } }
  const [expandedSubs, setExpandedSubs] = useState([]); // Array of subIds that are expanded

  // Draggable logic
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load role data on mount
  useEffect(() => {
    async function loadRole() {
      if (!roleId) return;
      try {
        const res = await getRoleRequest(roleId);
        const role = res?.data;
        if (!role) return;
        setRoleData(role);

        const permissions = role.permissions || [];
        const selIds = [];
        const restIds = [];
        const subSels = {};

        permissions.forEach(p => {
          const bf = p.businessFunction;
          const isMainModule = MODULES_DATA.some(m => m.id === bf);
          
          if (isMainModule) {
            if (!p.view && !p.edit) restIds.push(bf);
            else selIds.push(bf);
          } else {
            subSels[bf] = {
              enabled: !!p.view || !!p.edit,
              view: !!p.view,
              edit: !!p.edit,
              restricted: !p.view && !p.edit
            };
          }
        });

        setSelectedIds(selIds);
        setRestrictedIds(restIds);
        setSubSelections(subSels);
      } catch (err) {
        console.error("Failed to load role permissions:", err);
      }
    }
    loadRole();
  }, [roleId]);


  // Set initial position when modal opens
  useEffect(() => {
    if (activeModule) {
      setTimeout(() => {
        if (modalRef.current) {
          const rect = modalRef.current.getBoundingClientRect();
          const initialX = (window.innerWidth - rect.width) / 2;
          const initialY = (window.innerHeight - rect.height) / 2;
          setPos({ x: initialX, y: initialY });
        }
      }, 0);
    }
  }, [activeModule]);


  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest("img") || e.target.closest(".module-card__checkbox")) return;
    setDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };
    const handleMouseUp = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragOffset]);

  const openSubModal = (module) => {
    setActiveModule(module);
  };

  const closeSubModal = () => {
    setActiveModule(null);
  };

  const getAllSubIds = (moduleId) => {
    const ids = [];
    const collect = (list) => {
      list.forEach(i => {
        ids.push(i.id);
        if (i.subModules) collect(i.subModules);
      });
    };
    collect(SUBMODULES_MAP[moduleId] || []);
    return ids;
  };

  const handleModuleToggle = (e, moduleId) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const isCurrentlySelected = prev.includes(moduleId);
      if (isCurrentlySelected) {
        // Deselecting: clear all sub-modules for this module
        setSubSelections(subPrev => {
          const next = { ...subPrev };
          const subIds = getAllSubIds(moduleId);
          subIds.forEach(id => delete next[id]);
          return next;
        });
        return prev.filter(i => i !== moduleId);
      } else {
        // Selecting: remove from restricted if it was there (sync logic handles this too)
        setRestrictedIds(rPrev => rPrev.filter(i => i !== moduleId));
        return [...prev, moduleId];
      }
    });
  };

  useEffect(() => {
    let changed = false;
    const nextSelectedIds = [...selectedIds];
    const nextRestrictedIds = [...restrictedIds];

    Object.keys(SUBMODULES_MAP).forEach(moduleId => {
      const subIds = getAllSubIds(moduleId);
      const hasAnySubEnabled = subIds.some(sid => subSelections[sid]?.enabled);
      const hasAnySubRestricted = subIds.some(sid => subSelections[sid]?.restricted);
      
      const isSelected = nextSelectedIds.includes(moduleId);
      const isRestricted = nextRestrictedIds.includes(moduleId);

      if (hasAnySubEnabled && !isSelected) {
        nextSelectedIds.push(moduleId);
        // Remove from restricted if it was there
        const rIndex = nextRestrictedIds.indexOf(moduleId);
        if (rIndex > -1) nextRestrictedIds.splice(rIndex, 1);
        changed = true;
      } else if (!hasAnySubEnabled && hasAnySubRestricted && !isRestricted && !isSelected) {
        nextRestrictedIds.push(moduleId);
        changed = true;
      }
    });

    if (changed) {
      setSelectedIds(nextSelectedIds);
      setRestrictedIds(nextRestrictedIds);
    }
  }, [subSelections]);

  const handleSubToggle = (subId, children = []) => {
    setSubSelections(prev => {
      const isSelected = !!prev[subId]?.enabled;
      const newState = { ...prev };
      
      const toggle = (id, val) => {
        if (val) newState[id] = { enabled: true, view: true, edit: true, restricted: false };
        else delete newState[id];
      };

      toggle(subId, !isSelected);

      const toggleChildren = (list, val) => {
        list.forEach(c => {
          toggle(c.id, val);
          if (c.subModules) toggleChildren(c.subModules, val);
        });
      };
      toggleChildren(children, !isSelected);

      return newState;
    });
  };

  const handleSubVisibilityToggle = (id) => {
    setSubSelections(prev => {
      const current = prev[id] || { enabled: false, view: false, edit: false, restricted: false };
      const nextRestricted = !current.restricted;
      return {
        ...prev,
        [id]: {
          ...current,
          enabled: false,
          view: false,
          edit: false,
          restricted: nextRestricted
        }
      };
    });
  };

  const getSubState = (sub) => {
    if (!sub.subModules || sub.subModules.length === 0) {
      return !!subSelections[sub.id]?.enabled ? "checked" : "none";
    }
    const children = sub.subModules;
    const selectedCount = children.filter(c => !!subSelections[c.id]?.enabled).length;
    
    if (selectedCount === children.length && children.length > 0) return "checked";
    if (selectedCount > 0) return "indeterminate";
    return "none";
  };

  const toggleExpand = (subId) => {
    setExpandedSubs(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleActionToggle = (subId, action, children = []) => {
    setSubSelections(prev => {
      const newState = { ...prev };
      const current = newState[subId] || { enabled: false, view: false, edit: false, restricted: false };
      const nextActionVal = !current[action];

      const toggle = (id, val) => {
        const item = newState[id] || { enabled: false, view: false, edit: false, restricted: false };
        let updated = { ...item, [action]: val };

        // If either permission is active, it's enabled and not restricted
        if (updated.view || updated.edit) {
          updated.enabled = true;
          updated.restricted = false;
        } else {
          updated.enabled = false;
        }

        if (updated.enabled || updated.restricted) {
          newState[id] = updated;
        } else {
          delete newState[id];
        }
      };

      toggle(subId, nextActionVal);

      const cascade = (list, val) => {
        list.forEach(c => {
          toggle(c.id, val);
          if (c.subModules) cascade(c.subModules, val);
        });
      };
      if (children.length > 0) {
        cascade(children, nextActionVal);
      }

      return newState;
    });
  };

  const isAllSelected = selectedIds.length === MODULES_DATA.length && MODULES_DATA.length > 0;

  const handleSelectAllModules = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(MODULES_DATA.map(m => m.id));
    }
  };

  const handleSave = async () => {
    try {
      const permissions = [];
      
      // Add top-level modules
      [...selectedIds, ...restrictedIds].forEach(id => {
        const isRest = restrictedIds.includes(id);
        permissions.push({
          businessFunction: id,
          view: !isRest,
          edit: !isRest,
          restricted: isRest
        });
      });

      // Add sub-modules
      Object.entries(subSelections).forEach(([subId, state]) => {
        if (state.enabled || state.view || state.restricted) {
          permissions.push({
            businessFunction: subId,
            view: !!state.view,
            edit: !!state.edit,
            restricted: !!state.restricted
          });
        }
      });

      await updateRoleRequest(roleId, { permissions });
      await refreshPermissions();
      toast.success("Module access updated successfully");
      navigate(-1);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(err?.message || "Failed to save permissions");
    }
  };

  const filteredModules = MODULES_DATA.filter(m =>
    m.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSubModules = activeModule ? (SUBMODULES_MAP[activeModule.id] || []) : [];
  
  const getAllActiveSubIds = () => {
    const ids = [];
    const collect = (list) => {
      list.forEach(i => {
        ids.push(i.id);
        if (i.subModules) collect(i.subModules);
      });
    };
    collect(activeSubModules);
    return ids;
  };

  const currentSubIds = getAllActiveSubIds();
  const selectedSubCount = currentSubIds.filter(id => subSelections[id]?.enabled).length;
  const isAllSubsSelected = currentSubIds.length > 0 && currentSubIds.every(id => subSelections[id]?.enabled);

  return (
    <div className={`erp-page ${styles.page} module-management-page`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(-1)} ariaLabel="Back" />
        <h1 className={styles.title}>Module Management — {roleData?.roleName || "Loading..."}</h1>
      </header>

      <div className="im-toolbar">
        <div className="erp-search-wrap">
          <SearchIcon className="erp-search-icon" />
          <input
            type="text"
            className="erp-search-input"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="module-toolbar-right">
          <div className="module-counter">
            Total Modules → {MODULES_DATA.length}
          </div>
          <button 
            className="module-deselect-btn" 
            onClick={handleSelectAllModules}
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
      </div>

      <div className="module-management-container" ref={containerRef}>
        <div className="module-cards-grid">
          {filteredModules.map((module) => {
            const isSelected = selectedIds.includes(module.id);
            return (
              <div
                key={module.id}
                className={`module-card ${isSelected ? "module-card--selected" : ""}`}
                onClick={() => openSubModal(module)}
              >
                <div 
                  className={`module-card__checkbox ${isSelected ? "module-card__checkbox--checked" : ""}`}
                  onClick={(e) => handleModuleToggle(e, module.id)}
                >
                  {isSelected && (
                    <svg viewBox="0 0 14 10" className="module-card__checkbox-tick" fill="none">
                      <path d="M1 5L4.5 8.5L13 1" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {(() => { const Icon = module.icon; return <Icon className="module-card__icon" />; })()}
                <span className="module-card__label">{module.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="module-management-footer">
        <div className="module-footer-actions">
           <SaveBtnIcon className="module-save-img erp-action-svg-btn" onClick={handleSave} />
        </div>
      </div>

      {activeModule && createPortal(
        <div className="sc-modal-overlay module-management-page" onClick={(e) => e.target === e.currentTarget && closeSubModal()}>
          <div 
            className={`sc-modal submodule-modal-content ${dragging ? 'submodule-modal-header-grabbing' : ''}`}
            ref={modalRef}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`
            }}
          >
            <div className="sc-modal-bar" />
            <div 
              className="sc-modal-header submodule-modal-header-grab" 
              onMouseDown={handleMouseDown}
            >
              <span className="sc-modal-title">{activeModule.label} — Sub-Modules</span>
              <button type="button" className="submodule-modal-close" onClick={closeSubModal}>
                <img src={CloseBtn} alt="Close" />
              </button>
            </div>
            
            <div className="sc-modal-body submodule-modal-body slim-scrollbar">
              {activeSubModules.length > 0 ? (
                activeSubModules.map(sub => {
                  const subState = getSubState(sub);
                  const isExpanded = expandedSubs.includes(sub.id);
                  const hasChildren = sub.subModules && sub.subModules.length > 0;

                    return (
                      <div key={sub.id} className="submodule-group">
                        <div className="submodule-row-card">
                          <div className="submodule-title-row">
                          <div 
                            className={`submodule-checkbox ${subState === "checked" ? "submodule-checkbox--checked" : subState === "indeterminate" ? "submodule-checkbox--indeterminate" : ""}`}
                            onClick={() => handleSubToggle(sub.id, sub.subModules || [])}
                          />
                          <span 
                            className={`submodule-label ${hasChildren ? "submodule-label--clickable" : "submodule-label--default"}`}
                            onClick={() => hasChildren && toggleExpand(sub.id)}
                          >
                            {sub.label}
                            {hasChildren && (
                              <span className={`submodule-expand-arrow ${isExpanded ? 'expanded' : ''}`}>
                                ▼
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="submodule-actions-row">
                          {!hasChildren && (
                            <>
                              <button 
                                className={`submodule-action-btn ${subSelections[sub.id]?.view ? 'submodule-action-btn--enabled' : ''}`}
                                onClick={() => handleActionToggle(sub.id, 'view', sub.subModules || [])}
                              >
                                View
                              </button>
                              <button 
                                className={`submodule-action-btn ${subSelections[sub.id]?.edit ? 'submodule-action-btn--enabled' : ''}`}
                                onClick={() => handleActionToggle(sub.id, 'edit', sub.subModules || [])}
                              >
                                Edit
                              </button>
                            </>
                          )}
                          {!subSelections[sub.id]?.enabled && !hasChildren && (
                            <div className="submodule-visibility-control">
                              <span className="submodule-visibility-label">
                                {subSelections[sub.id]?.restricted ? "Disabled" : "Hidden"}
                              </span>
                              <label className="sc-toggle sc-toggle--margin">
                                <input 
                                  type="checkbox" 
                                  checked={!!subSelections[sub.id]?.restricted}
                                  onChange={() => handleSubVisibilityToggle(sub.id)}
                                />
                                <span className="sc-toggle-slider" />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {hasChildren && isExpanded && (
                        <div className="submodule-children-list">
                          {sub.subModules.map(child => {
                            const isChildSelected = !!subSelections[child.id]?.enabled;
                            return (
                              <div key={child.id} className="submodule-row-card submodule-row-card--child">
                                <div className="submodule-title-row">
                                  <div 
                                    className={`submodule-checkbox ${isChildSelected ? "submodule-checkbox--checked" : ""}`}
                                    onClick={() => handleSubToggle(child.id)}
                                  />
                                  <span className="submodule-label">{child.label}</span>
                                </div>
                                <div className="submodule-actions-row">
                                  <button 
                                    className={`submodule-action-btn ${subSelections[child.id]?.view ? 'submodule-action-btn--enabled' : ''}`}
                                    onClick={() => handleActionToggle(child.id, 'view')}
                                  >
                                    View
                                  </button>
                                  <button 
                                    className={`submodule-action-btn ${subSelections[child.id]?.edit ? 'submodule-action-btn--enabled' : ''}`}
                                    onClick={() => handleActionToggle(child.id, 'edit')}
                                  >
                                    Edit
                                  </button>
                                  {!subSelections[child.id]?.enabled && (
                                    <div className="submodule-visibility-control">
                                      <span className="submodule-visibility-label">
                                        {subSelections[child.id]?.restricted ? "Disabled" : "Hidden"}
                                      </span>
                                      <label className="sc-toggle sc-toggle--margin">
                                        <input 
                                          type="checkbox" 
                                          checked={!!subSelections[child.id]?.restricted}
                                          onChange={() => handleSubVisibilityToggle(child.id)}
                                        />
                                        <span className="sc-toggle-slider" />
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="submodule-empty-msg">
                  No sub-modules available for this module yet.
                </div>
              )}
            </div>

            <div className="submodule-modal-footer">
              <div className="submodule-footer-left">
                <button 
                  className="submodule-footer-btn"
                  onClick={() => {
                    if (currentSubIds.length === 0) return;
                    const newSelections = { ...subSelections };
                    
                    currentSubIds.forEach(id => {
                      if (isAllSubsSelected) {
                        delete newSelections[id];
                      } else {
                        newSelections[id] = { enabled: true, view: true, edit: true };
                      }
                    });
                    setSubSelections(newSelections);
                  }}
                >
                  {isAllSubsSelected ? "Deselect All" : "Select All"}
                </button>
                <span className="submodule-option-count">{selectedSubCount} options selected</span>
              </div>
              <div className="submodule-footer-right">
                <button type="button" className="submodule-footer-cancel-btn" onClick={closeSubModal}>Cancel</button>
                <button type="button" className="submodule-footer-save-btn" onClick={closeSubModal}>Save</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
