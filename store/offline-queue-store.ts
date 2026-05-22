"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CreateTransactionInput } from "@/types";

export interface PendingCreate {
  id: string;
  type: "create";
  payload: CreateTransactionInput;
  optimisticId: string;
  createdAt: number;
}

export type PendingMutation = PendingCreate;

interface OfflineQueueState {
  queue: PendingMutation[];
  enqueue: (item: PendingMutation) => void;
  dequeue: (id: string) => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
      dequeue: (id) => set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),
    }),
    { name: "offline-queue" }
  )
);
