import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./context/ToastProvider.jsx";
import { FooterProvider } from "./context/FooterContext.jsx";
import { PermissionsProvider } from "./context/PermissionsContext.jsx";
import { LocationScopeProvider } from "./context/LocationScopeContext.jsx";
import { AppBrandingProvider } from "./context/AppBrandingContext.jsx";
import "./styles/global.css";
import "./styles/enterprise-theme.css";
import "./styles/erp-layout.css";
import "./styles/theme.css";
import "./styles/subcomponents.css";
import "./styles/scrollbars.css";
import "./styles/mobile-responsive.css";
import "./styles/square-corners.css";
import "./styles/enterprise-buttons.css";
import App from "./App.jsx";
import { MobileNavProvider } from "./context/MobileNavContext.jsx";
import PwaUpdatePrompt from "./components/pwa/PwaUpdatePrompt.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppBrandingProvider>
        <ToastProvider>
          <MobileNavProvider>
            <PwaUpdatePrompt />
            <PermissionsProvider>
              <LocationScopeProvider>
                <FooterProvider>
                  <App />
                </FooterProvider>
              </LocationScopeProvider>
            </PermissionsProvider>
          </MobileNavProvider>
        </ToastProvider>
      </AppBrandingProvider>
    </BrowserRouter>
  </StrictMode>
);
