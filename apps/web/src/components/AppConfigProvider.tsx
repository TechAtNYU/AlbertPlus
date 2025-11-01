"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { createContext, type ReactNode, useContext, useMemo } from "react";

export type Term = "spring" | "summer" | "fall" | "j-term";

export type AppConfig = {
  current_term: Term | null;
  current_year: number | null;
  next_term: Term | null;
  next_year: number | null;
};

const AppConfigContext = createContext<AppConfig | null>(null);

function validateTerm(value: string | undefined): Term | null {
  if (!value) return null;
  const validTerms: Term[] = ["spring", "summer", "fall", "j-term"];
  return validTerms.includes(value as Term) ? (value as Term) : null;
}

function parseYear(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const configs = useQuery(
    api.appConfigs.getAllAppConfigs,
    isAuthenticated ? {} : "skip",
  );

  const value = useMemo((): AppConfig => {
    if (!configs) {
      return {
        current_term: null,
        current_year: null,
        next_term: null,
        next_year: null,
      };
    }

    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    return {
      current_term: validateTerm(configMap.get("current_term")),
      current_year: parseYear(configMap.get("current_year")),
      next_term: validateTerm(configMap.get("next_term")),
      next_year: parseYear(configMap.get("next_year")),
    };
  }, [configs]);

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig(): AppConfig {
  const context = useContext(AppConfigContext);
  if (context === null) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return context;
}

export function useCurrentTerm() {
  return useAppConfig().current_term;
}

export function useCurrentYear() {
  return useAppConfig().current_year;
}

export function useNextTerm() {
  return useAppConfig().next_term;
}

export function useNextYear() {
  return useAppConfig().next_year;
}
