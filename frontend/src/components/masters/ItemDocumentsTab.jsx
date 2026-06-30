import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";
import FileUploader from "../common/FileUploader.jsx";
import styles from "../../pages/masters/ItemUpsertPage.module.css";
import { deleteFileRequest, getItemApplicableConfigRequest, getItemComplianceRequest, listFilesRequest } from "../../services/api.js";
import { getApiRoot } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";

function mandatoryLabel(rule) {
  if (rule === "always") return "Required";
  if (rule === "by_item_category") return "Required for category";
  return "";
}

export default function ItemDocumentsTab({ itemId, itemCategory, disabled }) {
  const toast = useToast();
  const [docTypes, setDocTypes] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compliance, setCompliance] = useState(null);

  const filesByType = useMemo(() => {
    const map = {};
    files.forEach((f) => {
      const code = String(f.documentTypeCode || "").trim();
      if (!code) return;
      if (!map[code]) map[code] = [];
      map[code].push(f);
    });
    return map;
  }, [files]);

  const loadConfig = useCallback(async () => {
    try {
      const res = await getItemApplicableConfigRequest(itemCategory || "");
      setDocTypes(Array.isArray(res?.data?.documentTypes) ? res.data.documentTypes : []);
    } catch {
      setDocTypes([]);
    }
  }, [itemCategory]);

  const loadFiles = useCallback(async () => {
    if (!itemId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const res = await listFilesRequest({ entityType: "item", entityId: itemId, limit: 200 });
      setFiles(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  const loadCompliance = useCallback(async () => {
    if (!itemId) {
      setCompliance(null);
      return;
    }
    try {
      const res = await getItemComplianceRequest(itemId);
      setCompliance(res?.data || null);
    } catch {
      setCompliance(null);
    }
  }, [itemId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadFiles();
    loadCompliance();
  }, [loadFiles, loadCompliance]);

  const handleUpload = () => {
    loadFiles();
    loadCompliance();
  };

  const handleRemove = async (fileId) => {
    try {
      await deleteFileRequest(fileId);
      toast.success("File removed");
      loadFiles();
      loadCompliance();
    } catch (err) {
      toast.error(err?.message || "Failed to remove file");
    }
  };

  if (disabled) {
    return <p className={styles.sectionHint}>Save material details first to upload drawings and documents.</p>;
  }

  const apiRoot = getApiRoot().replace(/\/api$/, "");

  return (
    <div>
      <h2 className={styles.sectionTitle}>Drawings &amp; Documents</h2>
      <p className={styles.sectionHint}>
        Upload files per configured document type. Required types are marked below.
        {compliance && !compliance.valid ? (
          <span className={styles.complianceWarn} style={{ display: "inline-flex", marginLeft: "0.5vw" }}>
            <AlertCircle size={14} /> Missing required uploads
          </span>
        ) : compliance?.valid ? (
          <span className={styles.complianceOk} style={{ marginLeft: "0.5vw" }}> — complete</span>
        ) : null}
      </p>
      {loading && docTypes.length === 0 ? <p className={styles.sectionHint}>Loading…</p> : null}
      {docTypes.length === 0 ? (
        <p className={styles.sectionHint}>No document types configured. Add types under Settings → Data Management → Material Document Types.</p>
      ) : (
        <div className={styles.docTypeList}>
          {docTypes.map((dt) => {
            const typeFiles = filesByType[dt.code] || [];
            const req = mandatoryLabel(dt.mandatoryRule);
            const missing = compliance?.missingDocuments?.some((m) => m.code === dt.code);
            return (
              <section key={dt.code} className={`${styles.docTypeBlock} ${missing ? styles.docTypeBlockMissing : ""}`}>
                <div className={styles.docTypeHead}>
                  <strong>{dt.label}</strong>
                  {req ? <span className={styles.requiredBadge}>{req}</span> : null}
                  <span className={styles.docTypeMeta}>Max {dt.maxFiles} file(s)</span>
                </div>
                {dt.description ? <p className={styles.docTypeDesc}>{dt.description}</p> : null}
                {typeFiles.length > 0 ? (
                  <ul className={styles.fileList}>
                    {typeFiles.map((f) => (
                      <li key={f._id || f.id}>
                        <a href={`${apiRoot}${f.url}`} target="_blank" rel="noreferrer" className={styles.fileLink}>
                          {f.originalName} <ExternalLink size={12} />
                        </a>
                        <button type="button" className={styles.actionBtnDanger} onClick={() => handleRemove(f._id || f.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {typeFiles.length < (dt.maxFiles || 1) ? (
                  <FileUploader
                    category="item_drawing"
                    entityType="item"
                    entityId={itemId}
                    documentTypeCode={dt.code}
                    compact
                    accept={dt.allowedMimeTypes}
                    existingFiles={[]}
                    onUpload={handleUpload}
                  />
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
