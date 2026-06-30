import { createContext, useCallback, useContext, useMemo, useState } from "react";

const MobileNavContext = createContext(null);

export function MobileNavProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openNav = useCallback(() => setIsOpen(true), []);
  const closeNav = useCallback(() => setIsOpen(false), []);
  const toggleNav = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, openNav, closeNav, toggleNav }),
    [isOpen, openNav, closeNav, toggleNav]
  );

  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    return {
      isOpen: false,
      openNav: () => {},
      closeNav: () => {},
      toggleNav: () => {},
    };
  }
  return ctx;
}
