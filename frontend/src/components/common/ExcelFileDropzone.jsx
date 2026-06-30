import { useCallback, useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import "../../styles/global.css";

const DEFAULT_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Excel (.xlsx) drag-and-drop zone with click-to-browse.
 */
export default function ExcelFileDropzone({
  file,
  onFileChange,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  inputId = "excel-dropzone-input",
  title = "Drag & drop your Excel file here",
  subtitle = "or click to browse (.xlsx only)",
  dragTitle = "Drop file here",
  className = "",
}) {
  const inputRef = useRef(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const blockBrowserDrop = (e) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", blockBrowserDrop);
    window.addEventListener("drop", blockBrowserDrop);
    return () => {
      window.removeEventListener("dragover", blockBrowserDrop);
      window.removeEventListener("drop", blockBrowserDrop);
    };
  }, []);

  const validateAndSet = useCallback(
    (picked) => {
      if (!picked || disabled) return;
      const name = picked.name?.toLowerCase() ?? "";
      const ok =
        name.endsWith(".xlsx") ||
        picked.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      if (!ok) {
        onFileChange?.(null, { error: "Only Excel files (.xlsx) are supported." });
        return;
      }
      onFileChange?.(picked, { error: null });
    },
    [disabled, onFileChange]
  );

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragDepth.current += 1;
    setDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragOver(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    validateAndSet(dropped ?? null);
  };

  const handleInputChange = (e) => {
    validateAndSet(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const zoneClass = [
    "coa-upload-dropzone",
    file ? "coa-upload-dropzone--file-ready" : "",
    dragOver ? "coa-upload-dropzone--drag-over" : "",
    disabled ? "coa-upload-dropzone--uploading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="coa-upload-dropzone-wrap">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="coa-upload-file-input"
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
      />

      <div
        className={zoneClass}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={title}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver ? (
          <>
            <Upload size={48} strokeWidth={1.5} className="coa-upload-dropzone__icon" aria-hidden />
            <p className="coa-upload-dropzone__title">{dragTitle}</p>
            <p className="coa-upload-dropzone__subtitle">Release to select the file</p>
          </>
        ) : file ? (
          <>
            <FileSpreadsheet size={48} strokeWidth={1.5} className="coa-upload-dropzone__icon" aria-hidden />
            <p className="coa-upload-dropzone__title coa-upload-dropzone__title--ready">File ready</p>
            <p className="coa-upload-dropzone__upload-filename">{file.name}</p>
            <p className="coa-upload-dropzone__hint">
              {(file.size / 1024).toFixed(1)} KB · Drag another file or click to replace
            </p>
          </>
        ) : (
          <>
            <FileSpreadsheet size={48} strokeWidth={1.5} className="coa-upload-dropzone__icon" aria-hidden />
            <p className="coa-upload-dropzone__title">{title}</p>
            <p className="coa-upload-dropzone__subtitle">{subtitle}</p>
          </>
        )}
      </div>
    </div>
  );
}
