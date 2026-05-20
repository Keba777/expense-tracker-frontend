"use client";

import { useEffect } from "react";
import { useLangStore } from "@/store/lang-store";

export function LangSync() {
  const lang = useLangStore((s) => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang === "am" ? "am" : "en";
  }, [lang]);
  return null;
}
