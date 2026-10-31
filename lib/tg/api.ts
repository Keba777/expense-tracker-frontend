import type { ApiResponse, AuthResponse, Category, CreateTransactionInput, Summary, Transaction } from "@/types";

// Deliberately axios/zustand-free so the Mini App route stays light.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const TOKEN_KEY = "tg.token";

export class TgApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface TelegramWebApp {
  initData: string;
  colorScheme?: "light" | "dark";
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  HapticFeedback?: {
    impactOccurred: (style: "light") => void;
    notificationOccurred: (type: "success" | "error") => void;
  };
}

export function getWebApp(): TelegramWebApp | undefined {
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

export function getInitData(): string {
  // The launch hash is available before the SDK script finishes loading.
  const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("tgWebAppData");
  return fromHash || getWebApp()?.initData || "";
}

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

async function send<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<ApiResponse<T>> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok) throw new TgApiError(res.status, body.error ?? res.statusText);
  return body;
}

function saveAuth(auth: AuthResponse): AuthResponse {
  writeToken(auth.tokens.accessToken);
  return auth;
}

/** Throws TgApiError(404) when this Telegram account isn't linked yet. */
export async function telegramLogin(): Promise<AuthResponse> {
  const body = await send<AuthResponse>("/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData: getInitData() }),
  });
  return saveAuth(body.data!);
}

export async function telegramLink(identifier: string, password: string): Promise<AuthResponse> {
  const body = await send<AuthResponse>("/auth/telegram/link", {
    method: "POST",
    body: JSON.stringify({ initData: getInitData(), identifier, password }),
  });
  return saveAuth(body.data!);
}

/** Authed request using the cached token; re-authenticates via initData once on 401. */
async function authed<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    return await send<T>(path, init, readToken());
  } catch (e) {
    if (!(e instanceof TgApiError) || e.status !== 401) throw e;
    await telegramLogin();
    return send<T>(path, init, readToken());
  }
}

export const hasToken = () => !!readToken();

export const tgApi = {
  categories: async () => (await authed<Category[]>("/categories")).data ?? [],
  summary: async (from: string, to: string) =>
    (await authed<Summary>(`/transactions/summary?from=${from}&to=${to}`)).data!,
  recent: async (n = 5) => (await authed<Transaction[]>(`/transactions?page=1&perPage=${n}`)).data ?? [],
  create: async (input: CreateTransactionInput) =>
    (await authed<Transaction>("/transactions", { method: "POST", body: JSON.stringify(input) })).data!,
};
