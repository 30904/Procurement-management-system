import { useEffect } from "react";

/**
 * On create modals and create pages: Alt+F1 fills sample form data (dev/demo).
 * Pass `enabled: false` in edit mode.
 */
export function useCreateModalDevFill({ enabled = true, onFill }) {
  useEffect(() => {
    if (!enabled || typeof onFill !== "function") return;

    function handleKeyDown(e) {
      if (e.altKey && e.key === "F1") {
        e.preventDefault();
        onFill();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onFill]);
}
