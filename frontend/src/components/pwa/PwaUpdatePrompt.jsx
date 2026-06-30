import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import { useToast } from "../../hooks/useToast.js";

/**
 * Registers the service worker and notifies when a new build is available.
 */
export default function PwaUpdatePrompt() {
  const toast = useToast();

  useEffect(() => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        toast.info("A new version is available. Refresh the page to get the latest updates.");
      },
      onOfflineReady() {
        toast.info("App is ready to work offline.");
      },
      onRegisterError(error) {
        console.warn("[PWA] Service worker registration failed:", error);
      },
    });
  }, [toast]);

  return null;
}
