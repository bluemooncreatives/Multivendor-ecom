"use client";
import { createContext, useContext } from "react";
import { emptySiteSettings, type SiteSettings } from "./site-settings";

const Context = createContext<SiteSettings>(emptySiteSettings);
export function SiteSettingsProvider({ value, children }: { value: SiteSettings; children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useSiteSettings = () => useContext(Context);
