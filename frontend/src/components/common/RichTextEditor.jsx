import { useCallback, useEffect, useRef } from "react";
import styles from "./RichTextEditor.module.css";

function exec(cmd, value = null) {
  document.execCommand(cmd, false, value);
}

export default function RichTextEditor({
  label,
  hint,
  value = "",
  onChange,
  placeholder = "Enter text…",
  minHeight = "8rem",
  disabled = false,
}) {
  const editorRef = useRef(null);
  const lastHtml = useRef(value || "");

  const syncFromProp = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = value || "";
    if (html !== el.innerHTML) {
      el.innerHTML = html;
    }
    lastHtml.current = html;
  }, [value]);

  useEffect(() => {
    syncFromProp();
  }, [syncFromProp]);

  function emitChange() {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html === lastHtml.current) return;
    lastHtml.current = html;
    onChange?.(html);
  }

  function handleToolbarMouseDown(e) {
    e.preventDefault();
  }

  function run(cmd, val = null) {
    if (disabled) return;
    editorRef.current?.focus();
    exec(cmd, val);
    emitChange();
  }

  return (
    <div className={styles.wrap}>
      {label ? <div className={styles.label}>{label}</div> : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      <div className={`${styles.editorShell}${disabled ? ` ${styles.disabled}` : ""}`}>
        <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
          <button type="button" className={styles.toolBtn} title="Bold" onMouseDown={handleToolbarMouseDown} onClick={() => run("bold")}>
            <strong>B</strong>
          </button>
          <button type="button" className={styles.toolBtn} title="Italic" onMouseDown={handleToolbarMouseDown} onClick={() => run("italic")}>
            <em>I</em>
          </button>
          <button type="button" className={styles.toolBtn} title="Underline" onMouseDown={handleToolbarMouseDown} onClick={() => run("underline")}>
            <u>U</u>
          </button>
          <span className={styles.toolSep} />
          <button type="button" className={styles.toolBtn} title="Bullet list" onMouseDown={handleToolbarMouseDown} onClick={() => run("insertUnorderedList")}>
            • List
          </button>
          <button type="button" className={styles.toolBtn} title="Numbered list" onMouseDown={handleToolbarMouseDown} onClick={() => run("insertOrderedList")}>
            1. List
          </button>
          <span className={styles.toolSep} />
          <button type="button" className={styles.toolBtn} title="Clear formatting" onMouseDown={handleToolbarMouseDown} onClick={() => run("removeFormat")}>
            Clear
          </button>
        </div>
        <div
          ref={editorRef}
          className={styles.editor}
          style={{ minHeight }}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={emitChange}
          onBlur={emitChange}
        />
      </div>
    </div>
  );
}
