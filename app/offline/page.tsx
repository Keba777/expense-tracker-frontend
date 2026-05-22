"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
        <WifiOff className="w-9 h-9 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">You&apos;re offline</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          Check your connection and try again. Your data is safe and will sync when you&apos;re back online.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm press"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
