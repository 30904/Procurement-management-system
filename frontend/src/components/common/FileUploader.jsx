import { useCallback, useRef, useState } from "react";
import { uploadFileRequest, uploadMultipleFilesRequest } from "../../services/api.js";
import { getApiRoot } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/subcomponents.css";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reusable file uploader with drag-drop, preview, and file-type restrictions.
 *
 * @param {string}   [category]       - Upload category (profile_photo, document, certificate, general)
 * @param {string}   [entityType]     - Link upload to an entity type (e.g. "user", "student")
 * @param {string}   [entityId]       - Link upload to an entity ID
 * @param {boolean}  [multiple=false] - Allow multiple file selection
 * @param {string[]} [accept]         - MIME types to accept (falls back to category defaults)
 * @param {number}   [maxSizeMB]      - Max size in MB
 * @param {Function} [onUpload]       - Called with uploaded file doc(s) after success
 * @param {Array}    [existingFiles]  - Already-uploaded files to display
 * @param {Function} [onRemove]       - Called with file id when remove is clicked
 * @param {boolean}  [compact=false]  - Compact mode (smaller zone)
 * @param {boolean}  [disabled=false] - Disable interaction
 */
export default function FileUploader({
  category = "general",
  entityType = "",
  entityId = "",
  documentTypeCode = "",
  multiple = false,
  accept,
  maxSizeMB,
  onUpload,
  existingFiles = [],
  onRemove,
  compact = false,
  disabled = false,
}) {
  const toast = useToast();
  const fileRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);

  const acceptStr = accept ? accept.join(",") : undefined;

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList?.length || disabled || uploading) return;

    const files = multiple ? Array.from(fileList) : [fileList[0]];
    const previewItems = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      previewUrl: IMAGE_TYPES.has(f.type) ? URL.createObjectURL(f) : null,
    }));
    setPreviews(previewItems);

    setUploading(true);
    try {
      const meta = { category, entityType, entityId, documentTypeCode };
      let result;
      if (multiple && files.length > 1) {
        result = await uploadMultipleFilesRequest(files, meta);
        const uploaded = (result?.data || []).filter((r) => r.success).map((r) => r.data);
        const failed = (result?.data || []).filter((r) => !r.success);
        if (failed.length) toast.error(`${failed.length} file(s) failed to upload`);
        if (uploaded.length) {
          toast.success(`${uploaded.length} file(s) uploaded`);
          onUpload?.(uploaded);
        }
      } else {
        result = await uploadFileRequest(files[0], meta);
        toast.success("File uploaded");
        onUpload?.(result?.data);
      }
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      setPreviews([]);
      previewItems.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    }
  }, [category, entityType, entityId, documentTypeCode, multiple, disabled, uploading, onUpload, toast]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  const s = {
    zone: {
      border: `0.12vw dashed ${dragOver ? "var(--brand-primary)" : "#c1d0e0"}`,
      background: dragOver ? "#f0f7ff" : "#fafbfc",
      padding: compact ? "1.5vh 1.5vw" : "3vh 2vw",
      textAlign: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "border-color 0.15s, background 0.15s",
      opacity: disabled ? 0.5 : 1,
    },
    label: { fontSize: "0.88vw", fontWeight: 550, color: "#334155", fontFamily: "Inter, sans-serif" },
    hint: { fontSize: "0.76vw", color: "#94a3b8", fontFamily: "Inter, sans-serif", marginTop: "0.3vh" },
    fileList: { display: "flex", flexDirection: "column", gap: "0.6vh", marginTop: "1vh" },
    fileItem: {
      display: "flex", alignItems: "center", gap: "0.8vw",
      padding: "0.6vh 0.8vw", background: "#fff", border: "0.06vw solid #e2e8f0",
      fontSize: "0.8vw", fontFamily: "Inter, sans-serif",
    },
    thumb: { width: "2.5vw", height: "2.5vw", objectFit: "cover", flexShrink: 0, border: "0.06vw solid #e8eef5" },
    removeBtn: {
      marginLeft: "auto", background: "none", border: "none",
      color: "#dc2626", fontSize: "0.78vw", fontWeight: 600, cursor: "pointer",
      fontFamily: "Inter, sans-serif",
    },
  };

  const allFiles = [...existingFiles];

  return (
    <div>
      {/* Drop zone */}
      <div
        style={s.zone}
        onClick={() => !disabled && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple={multiple}
          accept={acceptStr}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <p style={s.label}>Uploading...</p>
        ) : (
          <>
            <p style={s.label}>
              {dragOver ? "Drop file(s) here" : "Click or drag file(s) to upload"}
            </p>
            <p style={s.hint}>
              {maxSizeMB ? `Max ${maxSizeMB} MB` : ""} {multiple ? " · Multiple files allowed" : ""}
            </p>
          </>
        )}
      </div>

      {/* Upload previews */}
      {previews.length > 0 && (
        <div style={s.fileList}>
          {previews.map((p, i) => (
            <div key={i} style={s.fileItem}>
              {p.previewUrl && <img src={p.previewUrl} alt="" style={s.thumb} />}
              <span style={{ color: "#334155", flex: 1 }}>{p.name}</span>
              <span style={{ color: "#94a3b8" }}>{formatSize(p.size)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Existing files */}
      {allFiles.length > 0 && (
        <div style={s.fileList}>
          {allFiles.map((f) => {
            const isImage = IMAGE_TYPES.has(f.mimeType);
            const thumbUrl = isImage ? `${getApiRoot().replace(/\/api$/, "")}${f.url}` : null;
            return (
              <div key={f._id || f.id} style={s.fileItem}>
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" style={s.thumb} />
                ) : (
                  <div style={{ ...s.thumb, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontSize: "0.6vw", color: "#64748b" }}>
                    {(f.mimeType || "").split("/").pop()?.toUpperCase() || "FILE"}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.originalName}
                  </p>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.72vw" }}>
                    {formatSize(f.size)} · {f.category}
                  </p>
                </div>
                {onRemove && (
                  <button type="button" style={s.removeBtn} onClick={() => onRemove(f._id || f.id)}>
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
