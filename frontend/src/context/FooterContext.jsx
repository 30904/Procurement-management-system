import { createContext, useContext, useState } from "react";

const FooterContext = createContext(null);

export function FooterProvider({ children }) {
  const [footerContent, setFooterContent] = useState(null);
  /** When true, the main app footer bar (.erp-footer) is not rendered at all. */
  const [footerBarHidden, setFooterBarHidden] = useState(false);
  return (
    <FooterContext.Provider
      value={{ footerContent, setFooterContent, footerBarHidden, setFooterBarHidden }}
    >
      {children}
    </FooterContext.Provider>
  );
}

export function useFooter() {
  return useContext(FooterContext);
}
