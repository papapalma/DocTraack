"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface NavContextType {
  mobileOpen: boolean;
  desktopCollapsed: boolean;
  toggleSidebar: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleDesktop: () => void;
}

const NavContext = createContext<NavContextType>({
  mobileOpen: false,
  desktopCollapsed: false,
  toggleSidebar: () => {},
  openMobile: () => {},
  closeMobile: () => {},
  toggleDesktop: () => {},
});

export const NavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleDesktop = useCallback(() => setDesktopCollapsed((prev) => !prev), []);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  }, []);

  return (
    <NavContext.Provider
      value={{
        mobileOpen,
        desktopCollapsed,
        toggleSidebar,
        openMobile,
        closeMobile,
        toggleDesktop,
      }}
    >
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);
