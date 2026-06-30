import { useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import ExcelFileDropzone from "../../components/common/ExcelFileDropzone.jsx";
import { appPath } from "../../config/navigation.js";
import { useToast } from "../../hooks/useToast.js";
import {
  downloadItemMasterUploadTemplateRequest,
  uploadItemMasterFileRequest,
} from "../../services/api.js";
import styles from "./UploadItemMasterPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";
import "../../styles/global.css";

const INSTRUCTION_STEPS = [
  "Download the Excel template (includes New Materials, Instructions, and Reference sheets).",
  "Fill rows only on the New Materials sheet — material codes are generated from Material Category.",
  "Use category codes (e.g. IRM, ICN, IPK) from the Reference sheet.",
  "HSN Code must exist in HSN/P Master (Active).",
  "Location and Inventory Store must match Location Master and Inventory Stores setup.",
  "Status: Active or Inactive (default Active). Dual Unit: Yes/No with conversion if Yes.",
];

const COLUMN_HINTS = [
  { col: "Material Category *", note: "Master data code (Reference sheet)" },
  { col: "Material Name *", note: "Unique display name" },
  { col: "Material Description *", note: "Full description" },
  { col: "UoM *", note: "Unit of measure from Master Data" },
  { col: "HSN Code *", note: "Must exist in HSN/P Master" },
  { col: "Location *", note: "Location Master ID or name (e.g. Factory)" },
  { col: "Inventory Store *", note: "Store code at that location (e.g. RM-MAIN)" },
  { col: "Sub Location", note: "Optional — sub-location ID or name at that site" },
  { col: "Reorder Level", note: "Optional minimum stock trigger (number ≥ 0)" },
  { col: "Status", note: "Active or Inactive" },
  { col: "Dual Unit (Yes/No)", note: "Optional; Yes enables secondary unit fields" },
];

export default function UploadItemMasterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadItemMasterUploadTemplateRequest();
      toast.success("Template downloaded.");
    } catch (err) {
      toast.error(err?.message || "Failed to download template");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (picked, meta) => {
    if (meta?.error) {
      toast.error(meta.error);
      return;
    }
    setFile(picked);
    setResult(null);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select or drop an Excel file (.xlsx).");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const res = await uploadItemMasterFileRequest(file);
      const data = res?.data ?? {};
      setResult(data);
      if (data.created > 0 && data.failed === 0) {
        toast.success(`${data.created} material(s) imported successfully.`);
      } else if (data.created > 0) {
        toast.info(`${data.created} imported, ${data.failed} failed. See details below.`);
      } else {
        toast.error("No materials were imported. Check errors below.");
      }
      setFile(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`erp-page ${toolbarStyles.page} ${styles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("masters/purchase"))} ariaLabel="Back to Purchase" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters"))}>
            Masters
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters/purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Upload Material Master</span>
        </h1>
      </header>

      {/* Step 1 + 2: download and upload — always visible, not flex-collapsed */}
      <article className={styles.importCard} id="upload-item-zone">
        <div className={styles.importCardHeader}>Import Material Master</div>

        <div className={styles.importSection}>
          <div className={styles.stepBadge}>1</div>
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Download template</h2>
            <p className={styles.stepText}>
              Excel template with the same fields as Material Master (category, name, UoM, HSN, store,
              status, and optional dual unit).
            </p>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={18} strokeWidth={2.25} style={{ marginRight: 8 }} aria-hidden />
              {downloading ? "Downloading…" : "Download template"}
            </button>
          </div>
        </div>

        <hr className={styles.importDivider} />

        <div className={styles.importSection}>
          <div className={styles.stepBadge}>2</div>
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>Upload filled file</h2>
            <p className={styles.stepText}>
              Drag your completed <strong>.xlsx</strong> into the box below, or click the box to
              browse. Then click Upload.
            </p>

            <div className={styles.dropzoneHost}>
              <ExcelFileDropzone
                inputId="upload-item-master-file"
                file={file}
                disabled={uploading}
                onFileChange={handleFileChange}
                title="Drag & drop your Excel file here"
                subtitle="or click to browse — .xlsx only"
                dragTitle="Drop file to attach"
              />
            </div>

            <div className={styles.uploadActions}>
              {file ? (
                <button type="button" className={styles.btnGhost} onClick={clearFile} disabled={uploading}>
                  Clear file
                </button>
              ) : null}
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                <Upload size={18} strokeWidth={2.25} style={{ marginRight: 8 }} aria-hidden />
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>

            {result ? (
              <div className={styles.resultPanel}>
                <h3 className={styles.resultTitle}>Import summary</h3>
                <div className={styles.resultStats}>
                  <span className={styles.resultSuccess}>Created: {result.created ?? 0}</span>
                  <span className={styles.resultFailed}>Failed: {result.failed ?? 0}</span>
                </div>
                {result.errors?.length > 0 ? (
                  <ul className={styles.errorList}>
                    {result.errors.map((err) => (
                      <li key={`row-${err.row}`}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {result.created > 0 ? (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => navigate(appPath("masters/purchase/item-master"))}
                  >
                    View Material Summary →
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <section className={styles.instructionsCard} aria-labelledby="upload-item-instructions-title">
        <h2 id="upload-item-instructions-title" className={styles.instructionsTitle}>
          Instructions & column reference
        </h2>
        <ol className={styles.instructionsList}>
          {INSTRUCTION_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className={styles.columnTableWrap}>
          <table className={styles.columnTable}>
            <thead>
              <tr>
                <th>Column</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {COLUMN_HINTS.map((row) => (
                <tr key={row.col}>
                  <td>{row.col}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.instructionsNote}>
          Required columns are marked with * in the template. Do not change header row text on the New
          Materials sheet.
        </p>
      </section>
    </div>
  );
}
