import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import FileUploader from "../common/FileUploader.jsx";
import { deleteFileRequest, getApiRoot, listFilesRequest } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { VENDOR_DOCUMENT_TYPES } from "../../config/supplierGovProcurementOptions.js";
import styles from "../../pages/masters/SupplierCreatePage.module.css";

export default function SupplierDocumentsSection({ supplierId, disabled }) {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const loadFiles = useCallback(async () => {
    if (!supplierId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const res = await listFilesRequest({
        entityType: "supplier",
        entityId: supplierId,
        limit: 200,
      });
      setFiles(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleRemove = async (fileId) => {
    try {
      await deleteFileRequest(fileId);
      toast.success("File removed");
      loadFiles();
    } catch (err) {
      toast.error(err?.message || "Failed to remove file");
    }
  };

  const apiRoot = getApiRoot().replace(/\/api$/, "");

  return (
    <>
      <hr className={styles.sectionRule} />
      <h2 className={styles.sectionTitle}>Documents</h2>
      {disabled ? (
        <p className={styles.sectionHint}>
          Save the vendor record first to upload PAN, GST, MSME, GeM, and supporting documents.
        </p>
      ) : loading ? (
        <p className={styles.sectionHint}>Loading documents…</p>
      ) : (
        <div className={styles.docTypeList}>
          {VENDOR_DOCUMENT_TYPES.map((dt) => {
            const typeFiles = filesByType[dt.code] || [];
            const allowMultiple = dt.maxFiles > 1;
            return (
              <section key={dt.code} className={styles.docTypeBlock}>
                <div className={styles.docTypeHead}>
                  <strong>{dt.label}</strong>
                  <span className={styles.docTypeMeta}>
                    {allowMultiple ? "Multiple uploads allowed" : "Single file"}
                  </span>
                </div>
                {typeFiles.length > 0 ? (
                  <ul className={styles.fileList}>
                    {typeFiles.map((f) => (
                      <li key={f._id || f.id}>
                        <a
                          href={`${apiRoot}${f.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.fileLink}
                        >
                          {f.originalName} <ExternalLink size={12} />
                        </a>
                        <button
                          type="button"
                          className={styles.fileRemoveBtn}
                          onClick={() => handleRemove(f._id || f.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {typeFiles.length < dt.maxFiles ? (
                  <FileUploader
                    category="document"
                    entityType="supplier"
                    entityId={supplierId}
                    documentTypeCode={dt.code}
                    multiple={allowMultiple}
                    compact
                    existingFiles={[]}
                    onUpload={loadFiles}
                  />
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
