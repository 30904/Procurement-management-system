import { useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import SaveBtnIcon from "../../assets/save-btn.svg?react";
import RichTextEditor from "../../components/common/RichTextEditor.jsx";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./PoTermsAndConditionsPage.module.css";
import {
  getPoTermsConfigRequest,
  savePoTermsConfigRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const DEFAULT_OPENING = "<p>Dear Sir/Madam,</p>";
const DEFAULT_BODY = `<p>Please supply following goods/material in accordance with agreed terms and conditions or contract purchase agreement.</p>
<p>Please mention our Material code &amp; Purchase Order number on your tax invoice without which invoice will not be processed.</p>
<p>Please send the material along with valid Test Report</p>`;
const DEFAULT_FORMATS = [
  { key: "traditional", name: "Traditional", templateKey: "traditional", isActive: true },
  { key: "compact", name: "Compact", templateKey: "compact", isActive: true },
  { key: "modern", name: "Modern", templateKey: "modern", isActive: true },
];
const DEFAULT_FORMAT_KEY = "traditional";

export default function PoTermsAndConditionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingLineHtml, setOpeningLineHtml] = useState(DEFAULT_OPENING);
  const [termsBodyHtml, setTermsBodyHtml] = useState(DEFAULT_BODY);
  const [poPrintFormats, setPoPrintFormats] = useState(DEFAULT_FORMATS);
  const [defaultPoPrintFormatKey, setDefaultPoPrintFormatKey] = useState(DEFAULT_FORMAT_KEY);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPoTermsConfigRequest();
        const data = res?.data;
        if (data) {
          setOpeningLineHtml(data.openingLineHtml || DEFAULT_OPENING);
          setTermsBodyHtml(data.termsBodyHtml || DEFAULT_BODY);
          const formats = Array.isArray(data.poPrintFormats) && data.poPrintFormats.length
            ? data.poPrintFormats
            : DEFAULT_FORMATS;
          setPoPrintFormats(formats);
          setDefaultPoPrintFormatKey(data.defaultPoPrintFormatKey || formats[0]?.key || DEFAULT_FORMAT_KEY);
        }
      } catch (err) {
        toast.error(err?.message || "Failed to load PO terms");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await savePoTermsConfigRequest({
        openingLineHtml,
        termsBodyHtml,
        poPrintFormats,
        defaultPoPrintFormatKey,
      });
      toast.success("PO terms and conditions saved.");
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    setOpeningLineHtml(DEFAULT_OPENING);
    setTermsBodyHtml(DEFAULT_BODY);
    setPoPrintFormats(DEFAULT_FORMATS);
    setDefaultPoPrintFormatKey(DEFAULT_FORMAT_KEY);
    toast.info("Default template restored. Click Save to apply.");
  }

  function handleAddFormat() {
    const uid = Date.now().toString(36);
    setPoPrintFormats((prev) => [
      ...prev,
      { key: `format_${uid}`, name: "", templateKey: "traditional", isActive: true },
    ]);
  }

  function handleFormatNameChange(index, name) {
    setPoPrintFormats((prev) =>
      prev.map((row, i) => (i === index ? { ...row, name } : row))
    );
  }

  function handleTemplateChange(index, templateKey) {
    setPoPrintFormats((prev) =>
      prev.map((row, i) => (i === index ? { ...row, templateKey } : row))
    );
  }

  function handleRemoveFormat(index) {
    setPoPrintFormats((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const fallbackKey = next[0]?.key || DEFAULT_FORMAT_KEY;
      setDefaultPoPrintFormatKey((current) =>
        next.some((f) => f.key === current) ? current : fallbackKey
      );
      return next.length ? next : DEFAULT_FORMATS;
    });
  }

  const formatCardStyle = {
    border: "1px solid #d7e3f4",
    borderRadius: "10px",
    padding: "0.95rem",
    background: "#ffffff",
    boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)",
  };
  const formatHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.8rem",
    padding: "0.7rem 0.8rem",
    border: "1px solid #e2ebf8",
    borderRadius: "8px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
  };
  const tableWrapStyle = {
    border: "1px solid #dbe6f5",
    borderRadius: "8px",
    overflowX: "auto",
    background: "#fff",
  };
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
  };
  const thStyle = {
    background: "#eaf3ff",
    color: "#334155",
    fontSize: "0.8rem",
    fontWeight: 700,
    textAlign: "left",
    letterSpacing: "0.01em",
    padding: "0.55rem 0.7rem",
    borderBottom: "1px solid #edf2fa",
    whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "0.55rem 0.7rem",
    borderBottom: "1px solid #edf2fa",
    verticalAlign: "middle",
  };
  const inputStyle = {
    width: "100%",
    height: "36px",
    border: "1px solid #c9d8eb",
    borderRadius: "6px",
    padding: "0 0.7rem",
    fontSize: "0.85rem",
    color: "#0f172a",
    background: "#fff",
    fontFamily: "Inter, sans-serif",
  };
  const selectStyle = { ...inputStyle };
  const removeBtnStyle = {
    height: "36px",
    border: "1px solid #f1c9c9",
    borderRadius: "6px",
    background: "#fff6f6",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#b42318",
    padding: "0 0.75rem",
    cursor: "pointer",
  };

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/data-management"))} ariaLabel="Back to Data Management" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration/data-management"))}
          >
            Data Management
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">PO Terms &amp; Conditions</span>
        </h1>
        <div className={pageStyles.headerActions}>
          <button type="button" className={pageStyles.btnSecondary} onClick={handleResetDefaults} disabled={loading}>
            Restore defaults
          </button>
          <SaveBtnIcon
            className="erp-action-svg-btn"
            onClick={handleSave}
            title={saving ? "Saving…" : "Save"}
            style={{
              height: "2.1vw",
              cursor: loading || saving ? "not-allowed" : "pointer",
              opacity: loading || saving ? 0.6 : 1,
            }}
          />
        </div>
      </header>

      <div className={pageStyles.card}>
        {loading ? (
          <p className={pageStyles.loading}>Loading…</p>
        ) : (
          <>
            <RichTextEditor
              label="Opening line (attached with PO)"
              hint="Short salutation or one-line message shown at the start of the supplier PO copy."
              value={openingLineHtml}
              onChange={setOpeningLineHtml}
              placeholder="e.g. Dear Sir/Madam,"
              minHeight="5rem"
            />
            <RichTextEditor
              label="Terms & conditions (appended with PO)"
              hint="Standard terms printed or emailed with every purchase order. Snapshotted on each new PO at save time."
              value={termsBodyHtml}
              onChange={setTermsBodyHtml}
              placeholder="Enter terms and conditions…"
              minHeight="14rem"
            />

            <section className={pageStyles.formatCard} style={formatCardStyle}>
              <div className={pageStyles.formatHeader} style={formatHeaderStyle}>
                <div>
                  <h3>PO Print Formats</h3>
                  <p>
                    Configure multiple PO format names and map the default format for newly created
                    purchase orders.
                  </p>
                </div>
                <button
                  type="button"
                  className={`${pageStyles.btnSecondary} ${pageStyles.addFormatBtn}`}
                  onClick={handleAddFormat}
                >
                  Add format
                </button>
              </div>

              <div className={pageStyles.formatTableWrap} style={tableWrapStyle}>
                <table className={pageStyles.formatTable} style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Default</th>
                      <th style={thStyle}>Format name</th>
                      <th style={thStyle}>Template mapping</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poPrintFormats.map((row, idx) => (
                      <tr key={`${row.key}-${idx}`} style={{ background: idx % 2 ? "#fbfdff" : "#fff" }}>
                        <td style={tdStyle}>
                          <label className={pageStyles.radioWrap} title="Set as default format">
                            <input
                              type="radio"
                              name="defaultPoFormat"
                              checked={defaultPoPrintFormatKey === row.key}
                              onChange={() => setDefaultPoPrintFormatKey(row.key)}
                            />
                            <span className={pageStyles.defaultPill}>Default</span>
                          </label>
                        </td>
                        <td style={tdStyle}>
                          <input
                            type="text"
                            className={pageStyles.formatInput}
                            style={inputStyle}
                            placeholder="e.g. Traditional, Compact, Modern"
                            value={row.name || ""}
                            onChange={(e) => handleFormatNameChange(idx, e.target.value)}
                          />
                        </td>
                        <td style={tdStyle}>
                          <select
                            className={pageStyles.formatSelect}
                            style={selectStyle}
                            value={row.templateKey || "traditional"}
                            onChange={(e) => handleTemplateChange(idx, e.target.value)}
                          >
                            <option value="traditional">Traditional (Current PO print layout)</option>
                            <option value="compact">Compact (Single-page condensed layout)</option>
                            <option value="modern">Modern (Premium card-based layout)</option>
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            className={pageStyles.rowDelete}
                            style={removeBtnStyle}
                            onClick={() => handleRemoveFormat(idx)}
                            disabled={poPrintFormats.length <= 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
