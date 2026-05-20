"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "en" | "am";

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
    }),
    { name: "expense-tracker-lang" }
  )
);
