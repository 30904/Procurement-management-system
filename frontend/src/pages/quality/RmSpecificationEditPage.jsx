import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SearchIcon from "../../assets/search-icon.svg?react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import ErpMasterListFooter from "../../components/common/ErpMasterListFooter.jsx";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import RmSpecificationInspectionChecklistModal from "../../components/modals/RmSpecificationInspectionChecklistModal.jsx";
import RmSpecificationPreviewModal from "../../components/modals/RmSpecificationPreviewModal.jsx";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { DEFAULT_INSPECTION_STANDARD_OPTIONS } from "../../config/inspectionStandardDefaults.js";
import { useToast } from "../../hooks/useToast.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useHistoryBack, useHubReturn } from "../../utils/hubNavigation.js";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import {
  getRmSpecificationRequest,
  listInspectionChecklistsRequest,
  listStandardSpecificationsRequest,
  saveRmSpecificationRequest,
} from "../../services/api.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  buildChecklistRows,
  buildLinesFromStandardSpecs,
  isStandardSpecInspectionType,
  sortRmSpecLines,
} from "../../utils/rmSpecificationLines.js";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import styles from "./RmSpecificationEditPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LINE_PAGE_SIZE = 10;

export default function RmSpecificationEditPage({ mode: modeProp }) {
  const { itemId } = useParams();
  const toast = useToast();
  const { navigateWithHubReturn } = useHubReturn("masters/quality");
  const goBack = useHistoryBack("masters/quality/rm-specifications");
  const readOnly = modeProp === "view";

  const { options: inspectionStandardOptions, loading: inspectionStandardLoading } =
    useMasterDataOptions(MASTER_DATA_CATEGORY.INSPECTION_STANDARD);

  const standardOptions = useMemo(
    () =>
      inspectionStandardOptions.length
        ? inspectionStandardOptions
        : DEFAULT_INSPECTION_STANDARD_OPTIONS,
    [inspectionStandardOptions]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState(null);
  const [inspectionStandard, setInspectionStandard] = useState("");
  const [lines, setLines] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [stdSpecRows, setStdSpecRows] = useState([]);
  const [masterChecklistRows, setMasterChecklistRows] = useState([]);
  const [lineSearch, setLineSearch] = useState("");
  const [linePage, setLinePage] = useState(1);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  const showSpecTable = isStandardSpecInspectionType(inspectionStandard);

  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const [itemRes, specRes, checklistRes] = await Promise.all([
        getRmSpecificationRequest(itemId),
        listStandardSpecificationsRequest(),
        listInspectionChecklistsRequest(),
      ]);
      const data = itemRes?.data ?? {};
      const rm = data.rmSpecification ?? {};
      const specs = (Array.isArray(specRes?.data) ? specRes.data : []).filter(
        (s) => s.status === "Active"
      );
      const checklistMaster = Array.isArray(checklistRes?.data) ? checklistRes.data : [];

      setItem(data);
      setStdSpecRows(specs);
      setMasterChecklistRows(checklistMaster);

      const storedStandard = String(rm.inspectionStandard || "").trim();
      const defaultStandard =
        storedStandard || DEFAULT_INSPECTION_STANDARD_OPTIONS[0]?.value || "";

      let nextLines = Array.isArray(rm.lines) ? rm.lines : [];
      if (!nextLines.length && isStandardSpecInspectionType(defaultStandard)) {
        nextLines = buildLinesFromStandardSpecs(specs, []);
      }
      setInspectionStandard(defaultStandard);
      setLines(sortRmSpecLines(nextLines));

      const nextChecklist = buildChecklistRows(checklistMaster, rm.inspectionChecklist || []);
      setChecklist(nextChecklist);

      setInitialSnapshot({
        inspectionStandard: defaultStandard,
        lines: sortRmSpecLines(nextLines),
        checklist: nextChecklist,
      });
    } catch (err) {
      toast.error(err?.message || "Failed to load RM specification");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [itemId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (inspectionStandard || !standardOptions.length) return;
    setInspectionStandard(standardOptions[0].value);
  }, [inspectionStandard, standardOptions]);

  const handleInspectionStandardChange = (value) => {
    setInspectionStandard(value);
    if (isStandardSpecInspectionType(value)) {
      setLines((prev) => {
        if (prev.length) return sortRmSpecLines(prev);
        return buildLinesFromStandardSpecs(stdSpecRows, []);
      });
    } else {
      setLines([]);
    }
    setLinePage(1);
  };

  const filteredLines = useMemo(() => {
    const q = lineSearch.trim().toLowerCase();
    let rows = sortRmSpecLines(lines);
    if (!q) return rows;
    return rows.filter((line) =>
      [
        line.specId,
        line.inspectionParameter,
        line.uom,
        line.testStandard,
        line.testMethod,
        line.specValue,
        line.ltl,
        line.utl,
        String(line.sequence),
      ].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [lines, lineSearch]);

  const lineTotalPages = Math.max(1, Math.ceil(filteredLines.length / LINE_PAGE_SIZE));
  const safeLinePage = Math.min(linePage, lineTotalPages);
  const pageLines = filteredLines.slice(
    (safeLinePage - 1) * LINE_PAGE_SIZE,
    safeLinePage * LINE_PAGE_SIZE
  );
  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers({
    setPage: setLinePage,
    totalPages: lineTotalPages,
  });

  useEffect(() => {
    if (linePage > lineTotalPages) setLinePage(lineTotalPages);
  }, [linePage, lineTotalPages]);

  const patchLine = (lineKey, patch) => {
    setLines((prev) =>
      sortRmSpecLines(
        prev.map((line) => {
          const key = line.standardSpecificationId || line.specId;
          return key === lineKey ? { ...line, ...patch } : line;
        })
      )
    );
  };

  const resolveInspectionStandardLabel = () => {
    const key = String(inspectionStandard || "").trim();
    const match = standardOptions.find((o) => o.value === key || o.label === key);
    return match?.label || key;
  };

  const buildPayload = () => ({
    inspectionStandard: resolveInspectionStandardLabel(),
    lines: showSpecTable ? sortRmSpecLines(lines) : [],
    inspectionChecklist: checklist,
  });

  const persist = async (payload, revisionInfo) => {
    await saveRmSpecificationRequest(itemId, { ...payload, revisionInfo });
    toast.success("RM specification saved.");
    setRevisionOpen(false);
    setPendingPayload(null);
    await load();
  };

  const handleSave = async () => {
    if (readOnly || !itemId) return;
    const payload = buildPayload();
    if (!payload.inspectionStandard) {
      toast.error("Please select an Inspection Standard.");
      return;
    }
    if (showSpecTable && !payload.lines.length) {
      toast.error("Add at least one specification line.");
      return;
    }
    const needsRevision = Number(item?.rmSpecification?.revNumber || 0) > 0;
    if (needsRevision) {
      setPendingPayload(payload);
      setRevisionOpen(true);
      return;
    }
    setSaving(true);
    try {
      await persist(payload);
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initialSnapshot) return;
    setInspectionStandard(initialSnapshot.inspectionStandard);
    setLines(initialSnapshot.lines);
    setChecklist(initialSnapshot.checklist);
    setLineSearch("");
    setLinePage(1);
    toast.info("Form reset to last loaded values.");
  };

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <MasterFormBreadcrumbToolbar
          defaultHubReturn="masters/quality"
          listSegment="masters/quality/rm-specifications"
          listTitle="RM Specifications"
          formTitle="Add Specification"
        />
        <p className={styles.loadingText}>Loading…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <MasterFormBreadcrumbToolbar
          defaultHubReturn="masters/quality"
          listSegment="masters/quality/rm-specifications"
          listTitle="RM Specifications"
          formTitle="Add Specification"
        />
        <p className={styles.loadingText}>Material not found.</p>
      </div>
    );
  }

  const formTitle = readOnly
    ? "RM Specification — View"
    : "Add Specification";

  return (
    <div className={`erp-page ${toolbarStyles.page} ${styles.pageWrap}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/quality"
        listSegment="masters/quality/rm-specifications"
        listTitle="RM Specifications"
        formTitle={formTitle}
      />

      <div className={styles.formShell}>
        <div className={styles.formHeader}>Quality Control Specification</div>

        <div className={styles.itemSection}>
          <div className={styles.itemGrid5}>
            <InputField label="Material Code" required value={item.itemNo} locked />
            <InputField label="Material Name" required value={item.itemName} locked />
            <InputField label="Material Description" required value={item.itemDescription} locked />
            <InputField label="Material Category" required value={item.itemCategory} locked />
            <SelectField
              label="Inspection Standard"
              required
              options={standardOptions}
              value={inspectionStandard}
              onChange={handleInspectionStandardChange}
              locked={readOnly}
              disabled={readOnly || inspectionStandardLoading}
              placeholder="Select inspection standard"
            />
          </div>
        </div>

        {showSpecTable ? (
          <div className={styles.tableSection}>
            <div className={styles.tableToolbar}>
              <div className="erp-search-wrap">
                <SearchIcon className="erp-search-icon" />
                <input
                  type="text"
                  className="erp-search-input"
                  placeholder="Search here"
                  value={lineSearch}
                  onChange={(e) => {
                    setLineSearch(e.target.value);
                    setLinePage(1);
                  }}
                />
              </div>
              <div className="im-toolbar-pagination">
                <ErpMasterListFooter
                  currentPage={safeLinePage}
                  totalPages={lineTotalPages}
                  totalRecords={filteredLines.length}
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
                    <th>Seq.</th>
                    <th>Inspection/Test Parameter</th>
                    <th>UoM</th>
                    <th>Inspection Standard</th>
                    <th>Inspection Method</th>
                    <th>Spec Value</th>
                    <th>LTL</th>
                    <th>UTL</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.empty}>
                        {stdSpecRows.length
                          ? "No lines match your search."
                          : "No active Standard Specifications found. Add them under Masters → Standard Specifications."}
                      </td>
                    </tr>
                  ) : (
                    pageLines.map((line) => {
                      const lineKey = line.standardSpecificationId || line.specId;
                      return (
                        <tr key={lineKey}>
                          <td>
                            <input
                              className={styles.seqInput}
                              value={line.sequence === 0 ? "" : String(line.sequence)}
                              readOnly={readOnly}
                              onChange={(e) =>
                                patchLine(lineKey, {
                                  sequence:
                                    e.target.value === "" ? 0 : Number(e.target.value),
                                })
                              }
                              inputMode="numeric"
                            />
                          </td>
                          <td className={styles.readOnlyCell}>{line.inspectionParameter}</td>
                          <td className={styles.readOnlyCell}>{line.uom}</td>
                          <td className={styles.readOnlyCell}>{line.testStandard || "—"}</td>
                          <td className={styles.readOnlyCell}>{line.testMethod}</td>
                          <td>
                            <input
                              className={styles.cellInput}
                              value={line.specValue ?? ""}
                              readOnly={readOnly}
                              onChange={(e) => patchLine(lineKey, { specValue: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              className={styles.cellInput}
                              value={line.ltl ?? ""}
                              readOnly={readOnly}
                              onChange={(e) => patchLine(lineKey, { ltl: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              className={styles.cellInput}
                              value={line.utl ?? ""}
                              readOnly={readOnly}
                              onChange={(e) => patchLine(lineKey, { utl: e.target.value })}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className={styles.naMessage}>
            Specification parameters apply when Inspection Standard is &quot;Standard
            Specification&quot;. Checklist items can still be configured below.
          </p>
        )}

        <footer className={styles.formFooter}>
          <div className={styles.footerLeft}>
            <button type="button" className={styles.backBtn} onClick={goBack} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.btnOutlinePink}
              onClick={() => setChecklistOpen(true)}
            >
              Inspection Checklist
            </button>
          </div>
          <div className={styles.footerRight}>
            {!readOnly && (
              <button type="button" className={styles.btnOutlinePink} onClick={handleReset} disabled={saving}>
                Reset
              </button>
            )}
            <button
              type="button"
              className={styles.btnOutlinePink}
              onClick={() => setPreviewOpen(true)}
              disabled={saving}
            >
              Preview
            </button>
            {!readOnly && (
              <button type="button" className={styles.btnSavePink} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            )}
          </div>
        </footer>
      </div>

      <RmSpecificationInspectionChecklistModal
        open={checklistOpen}
        readOnly={readOnly}
        masterRows={masterChecklistRows}
        savedRows={checklist}
        onClose={() => setChecklistOpen(false)}
        onSave={(rows) => {
          setChecklist(rows);
          toast.success("Inspection checklist updated. Click Save to persist.");
        }}
      />

      <RmSpecificationPreviewModal
        open={previewOpen}
        item={item}
        inspectionStandard={resolveInspectionStandardLabel()}
        lines={showSpecTable ? lines : []}
        checklistRows={checklist}
        onClose={() => setPreviewOpen(false)}
      />

      <HsnPRevisionModal
        open={revisionOpen}
        revisionNo={Number(item?.rmSpecification?.revNumber || 0) + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => {
          setRevisionOpen(false);
          setPendingPayload(null);
        }}
        onSave={async (revisionInfo) => {
          setSaving(true);
          try {
            await persist(pendingPayload || buildPayload(), revisionInfo);
          } catch (err) {
            toast.error(err?.message || "Failed to save revision");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
