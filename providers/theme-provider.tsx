"use client";

import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import { useEffect, useState } from "react";
import { create } from "zustand";

interface ThemeStore {
  resolvedTheme: "light" | "dark" | undefined;
  setResolvedTheme: (theme: "light" | "dark" | undefined) => void;
}

const useThemeStore = create<ThemeStore>((set) => ({
  resolvedTheme: undefined,
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
}));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      storageKey="theme"
    >
      <ThemeSyncProvider>{children}</ThemeSyncProvider>
    </NextThemesProvider>
  );
}

function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useNextTheme();
  const setResolvedTheme = useThemeStore((state) => state.setResolvedTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setResolvedTheme(resolvedTheme as "light" | "dark" | undefined);
    }
  }, [mounted, resolvedTheme, setResolvedTheme]);

  return <>{children}</>;
}

export const useTheme = useThemeStore;
