import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import SearchIcon from "../../assets/search-icon.svg?react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ErpMasterListFooter from "../common/ErpMasterListFooter.jsx";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import { buildChecklistRows } from "../../utils/rmSpecificationLines.js";
import styles from "./RmSpecificationInspectionChecklistModal.module.css";

const PAGE_SIZE = 7;

export default function RmSpecificationInspectionChecklistModal({
  open,
  readOnly = false,
  masterRows = [],
  savedRows = [],
  onClose,
  onSave,
}) {
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [previewOnly, setPreviewOnly] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows(buildChecklistRows(masterRows, savedRows));
    setSearchQuery("");
    setPage(1);
    setPreviewOnly(false);
  }, [open, masterRows, savedRows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (previewOnly) result = result.filter((r) => r.selected);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;
    return result.filter((r) =>
      [r.checklistId, r.checklistItem].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rows, searchQuery, previewOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers({
    setPage,
    totalPages,
  });

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const patchRow = (indexOnPage, patch) => {
    const globalIndex = (safePage - 1) * PAGE_SIZE + indexOnPage;
    const target = filtered[globalIndex];
    if (!target) return;
    setRows((prev) =>
      prev.map((r) => {
        const key = r.inspectionChecklistId || r.checklistId;
        const tKey = target.inspectionChecklistId || target.checklistId;
        return key === tKey ? { ...r, ...patch } : r;
      })
    );
  };

  const handleSave = () => {
    onSave?.(rows);
    onClose?.();
  };

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-labelledby="rm-icl-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="rm-icl-title" className={styles.title}>
            Inspection Checklist
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className="erp-search-wrap">
            <SearchIcon className="erp-search-icon" />
            <input
              type="text"
              className="erp-search-input"
              placeholder="Search here"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="im-toolbar-pagination">
            <ErpMasterListFooter
              currentPage={safePage}
              totalPages={totalPages}
              totalRecords={filtered.length}
              onPrevPageClick={onPrevPageClick}
              onNextPageClick={onNextPageClick}
              hideTotalRecords
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Seq.</th>
                <th>Inspection Parameter</th>
                <th style={{ width: "12%" }}>Select</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.empty}>
                    No checklist items found. Configure them under Masters → Inspection Checklist.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, idx) => (
                  <tr key={row.inspectionChecklistId || row.checklistId}>
                    <td>
                      <input
                        className={styles.seqInput}
                        value={row.sequence === 0 ? "" : String(row.sequence)}
                        readOnly={readOnly}
                        onChange={(e) =>
                          patchRow(idx, { sequence: e.target.value === "" ? 0 : Number(e.target.value) })
                        }
                        inputMode="numeric"
                      />
                    </td>
                    <td>{row.checklistItem}</td>
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        checked={Boolean(row.selected)}
                        disabled={readOnly}
                        onChange={(e) => patchRow(idx, { selected: e.target.checked })}
                        aria-label={`Select ${row.checklistItem}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.backBtn} onClick={onClose} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.btnOutlinePink}
              onClick={() => {
                setPreviewOnly((p) => !p);
                setPage(1);
              }}
            >
              {previewOnly ? "Show All" : "Preview"}
            </button>
            <button type="button" className={styles.btnOutlinePink} onClick={onClose}>
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly ? (
              <button type="button" className={styles.btnSavePink} onClick={handleSave}>
                Save
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
