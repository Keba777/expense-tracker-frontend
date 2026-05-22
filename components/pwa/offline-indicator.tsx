"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const online = () => {
      setIsOnline(true);
      // Show "back online" briefly then hide
      setTimeout(() => setVisible(false), 2000);
    };
    const offline = () => {
      setIsOnline(false);
      setVisible(true);
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium",
        "transition-colors duration-300",
        isOnline
          ? "bg-income/90 text-white"
          : "bg-expense/90 text-white"
      )}
      style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
    >
      {isOnline ? (
        "Back online"
      ) : (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          You&apos;re offline — showing cached data
        </>
      )}
    </div>
  );
}
