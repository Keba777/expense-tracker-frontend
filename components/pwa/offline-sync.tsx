"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineQueue } from "@/store/offline-queue-store";
import { transactionsApi } from "@/lib/api/transactions";

export function OfflineSync() {
  const qc = useQueryClient();
  const { dequeue } = useOfflineQueue();

  const drain = useCallback(async () => {
    if (!navigator.onLine) return;
    const { queue } = useOfflineQueue.getState();
    if (!queue.length) return;

    let synced = false;
    for (const item of queue) {
      try {
        if (item.type === "create") {
          await transactionsApi.create(item.payload);
          dequeue(item.id);
          synced = true;
        }
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        // 4xx means the data is bad and will never succeed — drop it
        if (status && status >= 400 && status < 500) {
          dequeue(item.id);
        }
        // Network error: leave in queue, try next time
      }
    }

    if (synced) {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["breakdown"] });
      qc.refetchQueries({ queryKey: ["transactions"], type: "active" });
      qc.refetchQueries({ queryKey: ["summary"], type: "active" });
      qc.refetchQueries({ queryKey: ["breakdown"], type: "active" });
    }
  }, [dequeue, qc]);

  useEffect(() => {
    drain();
    window.addEventListener("online", drain);
    return () => window.removeEventListener("online", drain);
  }, [drain]);

  return null;
}
