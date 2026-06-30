import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CircleHelp } from "lucide-react";
import closeBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { appPath } from "../../config/navigation.js";
import CompanySetupGuideContent from "./CompanySetupGuideContent.jsx";
import styles from "./CompanySetupHelpModal.module.css";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "modules", label: "Modules" },
  { id: "order", label: "Setup order" },
  { id: "single-vs-multi", label: "Single vs multi" },
  { id: "example-single", label: "Example" },
  { id: "checklist", label: "Checklist" },
  { id: "links", label: "Screens" },
];

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function CompanySetupHelpModal({ open, onClose }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag({ open });

  const handleNavigate = useCallback(
    (segment) => {
      onClose();
      navigate(appPath(segment));
    },
    [navigate, onClose]
  );

  const scrollToSection = useCallback((id) => {
    const root = scrollRef.current;
    const el = root?.querySelector(`#${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      style={overlayStyle}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={styles.dialog}
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-setup-help-title"
      >
        <div className={styles.bar} />
        <header
          className={styles.header}
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <div className={styles.headerTitle}>
            <CircleHelp className={styles.headerIcon} strokeWidth={2} aria-hidden />
            <h2 id="company-setup-help-title" className={styles.title}>
              Company Setup — Foundation Guide
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close help">
            <img src={closeBtnIcon} alt="" />
          </button>
        </header>

        <nav className={styles.toc} aria-label="Guide sections">
          {TOC.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.tocItem}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div ref={scrollRef} className={styles.body}>
          <CompanySetupGuideContent onNavigate={handleNavigate} hideHeroTitle />
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
