import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import FileUploader from "../common/FileUploader.jsx";
import { deleteFileRequest, getApiRoot, listFilesRequest } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { GRN_DOCUMENT_TYPES } from "../../config/goodsReceiptMpbcdcOptions.js";
import styles from "../../pages/purchase/PurchaseIndentForm.module.css";

export default function GoodsReceiptDocumentsSection({ grnId, disabled, readOnly = false }) {
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
    if (!grnId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const res = await listFilesRequest({
        entityType: "goods_receipt",
        entityId: grnId,
        limit: 200,
      });
      setFiles(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [grnId]);

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
    <section className={styles.sectionPanel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Documents</h2>
          <p className={styles.sectionSubtitle}>
            Delivery challan, invoice, inspection certificates, and supporting attachments
          </p>
        </div>
      </div>
      <div className={styles.sectionBody}>
        {disabled ? (
          <p className={styles.docHint}>Save the goods receipt first to upload documents.</p>
        ) : readOnly ? (
          loading ? (
            <p className={styles.docHint}>Loading documents…</p>
          ) : files.length === 0 ? (
            <p className={styles.docHint}>No documents attached.</p>
          ) : (
            GRN_DOCUMENT_TYPES.map((docType) => {
              const typeFiles = filesByType[docType.code] || [];
              if (!typeFiles.length) return null;
              return (
                <div key={docType.code} className={styles.docTypeBlock}>
                  <h3 className={styles.docTypeTitle}>{docType.label}</h3>
                  <ul className={styles.docFileList}>
                    {typeFiles.map((file) => (
                      <li key={file._id || file.id}>
                        <a href={`${apiRoot}${file.url || file.filePath || ""}`} target="_blank" rel="noreferrer">
                          {file.originalName || file.fileName || "Document"}
                          <ExternalLink size={14} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )
        ) : (
          GRN_DOCUMENT_TYPES.map((docType) => (
            <FileUploader
              key={docType.code}
              label={docType.label}
              entityType="goods_receipt"
              entityId={grnId}
              documentTypeCode={docType.code}
              maxFiles={docType.maxFiles}
              existingFiles={filesByType[docType.code] || []}
              onUploaded={loadFiles}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>
    </section>
  );
}
