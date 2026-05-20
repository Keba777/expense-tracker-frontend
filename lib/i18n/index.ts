"use client";

import { useLangStore } from "@/store/lang-store";
import { en, type AppTranslations } from "./en";
import { am } from "./am";

const translations: Record<"en" | "am", AppTranslations> = { en, am };

export function useT(): AppTranslations {
  const lang = useLangStore((s) => s.lang);
  return translations[lang];
}

export type { AppTranslations };
