import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import {
  getCsvTemplateUrl,
  parseCsvUploadRequest,
  executeCsvImportRequest,
} from "../../services/api.js";
import { getToken } from "../../utils/authStorage.js";
import "../../styles/subcomponents.css";

const STEPS = ["upload", "preview", "result"];

/**
 * Reusable CSV Import Modal — any page can use this.
 *
 * @param {string}   profileKey  - Backend import profile key (e.g. "master_data", "users")
 * @param {string}   profileLabel - Human label shown in the title
 * @param {Function} onClose     - Called on close
 * @param {Function} [onComplete] - Called after successful import with result data
 */
export default function CsvImportModal({ profileKey, profileLabel, onClose, onComplete }) {
  const toast = useToast();
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewTab, setPreviewTab] = useState("valid");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  async function handleDownloadTemplate() {
    const url = getCsvTemplateUrl(profileKey);
    const token = getToken();
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${profileKey}_template.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Failed to download template");
    }
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }
    setFile(f);
  }

  async function handleParse() {
    if (!file) { toast.error("Please select a file first"); return; }
    setParsing(true);
    try {
      const res = await parseCsvUploadRequest(file, profileKey);
      setPreview(res?.data);
      setPreviewTab(res?.data?.valid?.length ? "valid" : "invalid");
      setStep("preview");
    } catch (err) {
      toast.error(err?.message || "Failed to parse CSV");
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!preview?.valid?.length) return;
    setImporting(true);
    try {
      const res = await executeCsvImportRequest(profileKey, preview.valid);
      setResult(res?.data);
      setStep("result");
      onComplete?.(res?.data);
    } catch (err) {
      toast.error(err?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const s = {
    label: { fontSize: "0.85vw", fontWeight: 550, color: "#334155", fontFamily: "Inter, sans-serif" },
    hint: { fontSize: "0.78vw", color: "#94a3b8", fontFamily: "Inter, sans-serif" },
    btn: {
      padding: "0.7vh 1.4vw", fontSize: "0.85vw", fontWeight: 500, fontFamily: "Inter, sans-serif",
      border: "0.08vw solid", cursor: "pointer",
    },
    card: {
      border: "0.08vw solid #d2d2d2", background: "#f8fafc", padding: "2vh 1.5vw",
    },
    tab: (active) => ({
      padding: "0.5vh 1.2vw", fontSize: "0.82vw", fontFamily: "Inter, sans-serif", fontWeight: 500,
      border: "none", borderBottom: active ? "0.15vw solid var(--brand-primary)" : "0.15vw solid transparent",
      background: "none", color: active ? "var(--brand-primary)" : "#64748b", cursor: "pointer",
    }),
  };

  return createPortal(
    <div className="sc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={overlayStyle}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw", maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Bulk CSV Import — {profileLabel || profileKey}</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: "2vh" }}>

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <>
              {/* Download template */}
              <div style={s.card}>
                <p style={s.label}>1. Download Template</p>
                <p style={{ ...s.hint, margin: "0.5vh 0 1vh" }}>
                  Download the CSV template with the correct headers, fill in your data, then upload.
                </p>
                <button type="button" onClick={handleDownloadTemplate}
                  style={{ ...s.btn, borderColor: "var(--brand-primary)", background: "#fff", color: "var(--brand-primary)" }}>
                  Download CSV Template
                </button>
              </div>

              {/* Upload file */}
              <div style={s.card}>
                <p style={s.label}>2. Upload File</p>
                <div style={{
                  margin: "1vh 0", border: "0.12vw dashed #c1d0e0", padding: "3vh 2vw",
                  textAlign: "center", background: "#ffffff", cursor: "pointer",
                }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".csv" hidden onChange={handleFileChange} />
                  {file ? (
                    <p style={{ ...s.label, color: "var(--brand-primary)" }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                  ) : (
                    <>
                      <p style={s.label}>Click to choose a CSV file</p>
                      <p style={s.hint}>Max 5 MB</p>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8vw" }}>
                <button type="button" onClick={onClose}
                  style={{ ...s.btn, borderColor: "#d2d2d2", background: "#fff", color: "#64748b" }}>
                  Cancel
                </button>
                <button type="button" onClick={handleParse} disabled={!file || parsing}
                  style={{
                    ...s.btn, borderColor: "var(--brand-primary)",
                    background: !file || parsing ? "#e2e8f0" : "var(--brand-primary)",
                    color: !file || parsing ? "#94a3b8" : "#fff",
                    cursor: !file || parsing ? "not-allowed" : "pointer",
                  }}>
                  {parsing ? "Parsing..." : "Upload & Validate"}
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && preview && (
            <>
              {/* Stats */}
              <div style={{ display: "flex", gap: "1.5vw" }}>
                <StatBox label="Total Rows" value={preview.totalRows} color="#334155" />
                <StatBox label="Valid" value={preview.valid?.length || 0} color="#16a34a" />
                <StatBox label="Errors" value={preview.invalid?.length || 0} color="#dc2626" />
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "0.5vw", borderBottom: "0.06vw solid #e2e8f0" }}>
                <button type="button" style={s.tab(previewTab === "valid")} onClick={() => setPreviewTab("valid")}>
                  Valid ({preview.valid?.length || 0})
                </button>
                <button type="button" style={s.tab(previewTab === "invalid")} onClick={() => setPreviewTab("invalid")}>
                  Errors ({preview.invalid?.length || 0})
                </button>
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflow: "auto", maxHeight: "36vh" }}>
                {previewTab === "valid" && (
                  <PreviewTable rows={preview.valid} type="valid" />
                )}
                {previewTab === "invalid" && (
                  <PreviewTable rows={preview.invalid} type="invalid" />
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8vw" }}>
                <button type="button" onClick={() => { setStep("upload"); setPreview(null); setFile(null); }}
                  style={{ ...s.btn, borderColor: "#d2d2d2", background: "#fff", color: "#64748b" }}>
                  Back
                </button>
                <button type="button" onClick={handleImport}
                  disabled={!preview.valid?.length || importing}
                  style={{
                    ...s.btn, borderColor: "#16a34a",
                    background: !preview.valid?.length || importing ? "#e2e8f0" : "#16a34a",
                    color: !preview.valid?.length || importing ? "#94a3b8" : "#fff",
                    cursor: !preview.valid?.length || importing ? "not-allowed" : "pointer",
                  }}>
                  {importing ? "Importing..." : `Import ${preview.valid?.length || 0} Row(s)`}
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Result ── */}
          {step === "result" && result && (
            <>
              <div style={{ display: "flex", gap: "1.5vw" }}>
                <StatBox label="Inserted" value={result.inserted} color="#16a34a" />
                <StatBox label="Skipped" value={result.skipped} color="#e07b00" />
              </div>

              {result.errors?.length > 0 && (
                <div style={s.card}>
                  <p style={{ ...s.label, marginBottom: "1vh" }}>Import Errors</p>
                  <div style={{ maxHeight: "28vh", overflow: "auto" }}>
                    {result.errors.map((e, i) => (
                      <div key={i} style={{
                        padding: "0.6vh 0.8vw", borderBottom: "0.06vw solid #f1f5f9",
                        fontSize: "0.8vw", fontFamily: "Inter, sans-serif",
                      }}>
                        <span style={{ fontWeight: 600, color: "#dc2626" }}>Row {e.rowNum}:</span>{" "}
                        <span style={{ color: "#334155" }}>{e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose}
                  style={{ ...s.btn, borderColor: "var(--brand-primary)", background: "var(--brand-primary)", color: "#fff" }}>
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      flex: 1, border: "0.08vw solid #e2e8f0", padding: "1.2vh 1vw",
      background: "#fff", textAlign: "center",
    }}>
      <p style={{ margin: 0, fontSize: "1.4vw", fontWeight: 700, color, fontFamily: "Inter, sans-serif" }}>
        {value}
      </p>
      <p style={{ margin: "0.3vh 0 0", fontSize: "0.78vw", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
        {label}
      </p>
    </div>
  );
}

function PreviewTable({ rows, type }) {
  if (!rows?.length) {
    return (
      <p style={{ textAlign: "center", padding: "3vh 0", fontSize: "0.85vw", color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>
        {type === "valid" ? "No valid rows" : "No errors found"}
      </p>
    );
  }

  const dataKey = type === "valid" ? "data" : "data";
  const firstRow = rows[0]?.[dataKey] || rows[0]?.raw || {};
  const headers = Object.keys(firstRow);

  const cellStyle = {
    padding: "0.5vh 0.6vw", fontSize: "0.76vw", fontFamily: "Inter, sans-serif",
    borderBottom: "0.06vw solid #f1f5f9", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis", maxWidth: "12vw",
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#f1f5f9" }}>
          <th style={{ ...cellStyle, fontWeight: 600, color: "#64748b" }}>Row</th>
          {headers.map((h) => (
            <th key={h} style={{ ...cellStyle, fontWeight: 600, color: "#64748b" }}>{h}</th>
          ))}
          {type === "invalid" && (
            <th style={{ ...cellStyle, fontWeight: 600, color: "#dc2626" }}>Errors</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const data = row[dataKey] || row.raw || {};
          return (
            <tr key={i} style={{ background: type === "invalid" ? "#fff5f5" : "#fff" }}>
              <td style={{ ...cellStyle, color: "#94a3b8" }}>{row.rowNum}</td>
              {headers.map((h) => (
                <td key={h} style={{ ...cellStyle, color: "#334155" }}>
                  {String(data[h] ?? "")}
                </td>
              ))}
              {type === "invalid" && (
                <td style={{ ...cellStyle, color: "#dc2626", whiteSpace: "normal", maxWidth: "18vw" }}>
                  {(row.errors || []).join("; ")}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
