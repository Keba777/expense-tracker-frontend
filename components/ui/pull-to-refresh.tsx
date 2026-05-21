"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 64;   // px of damped pull needed to trigger
const MAX_PULL = 96;    // max damped pull distance
const DAMPEN = 0.45;    // resistance factor

interface Props {
  onRefresh: () => void;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isActive = useRef(false);
  const isBusy = useRef(false);
  const lastPull = useRef(0);
  const directionLocked = useRef<"v" | "h" | null>(null);

  const doRefresh = useCallback(async () => {
    if (isBusy.current) return;
    isBusy.current = true;
    setRefreshing(true);
    setDragging(false);
    setPullY(52);
    lastPull.current = 0;
    onRefresh();
    await new Promise<void>((r) => setTimeout(r, 900));
    setPullY(0);
    setRefreshing(false);
    isBusy.current = false;
  }, [onRefresh]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (isBusy.current || window.scrollY > 2) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isActive.current = true;
      directionLocked.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isActive.current || isBusy.current) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);

      // Lock direction in the first 10px to avoid interfering with horizontal swipes
      if (directionLocked.current === null) {
        if (Math.abs(dy) > 10 || dx > 10) {
          directionLocked.current = Math.abs(dy) > dx ? "v" : "h";
        }
        return;
      }

      if (directionLocked.current === "h" || dy <= 0) {
        isActive.current = false;
        return;
      }

      const damped = Math.min(dy * DAMPEN, MAX_PULL);
      lastPull.current = damped;
      setPullY(damped);
      setDragging(true);
    };

    const onTouchEnd = () => {
      if (!isActive.current) return;
      isActive.current = false;
      if (lastPull.current >= THRESHOLD) {
        doRefresh();
      } else {
        setPullY(0);
        lastPull.current = 0;
        setDragging(false);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [doRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const visible = pullY > 6 || refreshing;

  // The indicator orbits from y=-40 (hidden above) to y=8 (visible below top)
  const indicatorTranslateY = refreshing ? 8 : pullY > 6 ? Math.min(pullY - 28, 8) : -40;

  return (
    <div className="relative">
      {/* Spinner indicator */}
      <div
        aria-hidden
        className="absolute inset-x-0 flex justify-center pointer-events-none z-50"
        style={{
          top: 0,
          transform: `translateY(${indicatorTranslateY}px)`,
          opacity: visible ? 1 : 0,
          transition: dragging
            ? "opacity 0.15s"
            : "transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s",
        }}
      >
        <div className="w-9 h-9 rounded-full surface-1 shadow-md flex items-center justify-center">
          <RefreshCw
            className={cn("w-4 h-4 text-primary", refreshing && "animate-spin")}
            style={refreshing ? undefined : { transform: `rotate(${progress * 300}deg)` }}
          />
        </div>
      </div>

      {/* Page content shifts down slightly during pull.
          No transform at rest — any transform (even translateY(0)) creates a new
          containing block that breaks position:fixed on child FABs. */}
      <div
        style={
          dragging || refreshing
            ? {
                transform: `translateY(${pullY * 0.12}px)`,
                transition: dragging
                  ? "none"
                  : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }
            : { transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }
        }
      >
        {children}
      </div>
    </div>
  );
}
