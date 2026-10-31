"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Delete } from "lucide-react";
import { useLangStore } from "@/store/lang-store";
import { useT } from "@/lib/i18n";
import { translateCategory } from "@/lib/category-translations";
import { formatCurrency } from "@/lib/utils";
import { getInitData, getWebApp, hasToken, telegramLink, telegramLogin, tgApi, TgApiError } from "@/lib/tg/api";
import type { Category, Summary, Transaction, TransactionType } from "@/types";

const CACHE_KEY = "tg.cache";
const LAST_CAT_KEY = "tg.lastCat";

interface Cache {
  name: string;
  currency: string;
  categories: Category[];
  summary: Summary | null;
  recent: Transaction[];
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function monthRange() {
  const now = new Date();
  return { from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
}

const readJSON = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const haptic = (kind: "light" | "success" | "error") => {
  const h = getWebApp()?.HapticFeedback;
  if (!h) return;
  if (kind === "light") h.impactOccurred("light");
  else h.notificationOccurred(kind);
};

export default function TelegramMiniApp() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const { setTheme } = useTheme();

  const [status, setStatus] = useState<"loading" | "link" | "ready" | "no-telegram">("loading");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [catId, setCatId] = useState<Record<TransactionType, string>>({ expense: "", income: "" });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const persist = useCallback(
    (patch: Partial<Cache>) => {
      const prev = readJSON<Cache>(CACHE_KEY) ?? { name: "", currency: "USD", categories: [], summary: null, recent: [] };
      writeJSON(CACHE_KEY, { ...prev, ...patch });
    },
    []
  );

  const refresh = useCallback(async () => {
    const { from, to } = monthRange();
    const [cats, sum, rec] = await Promise.all([tgApi.categories(), tgApi.summary(from, to), tgApi.recent(5)]);
    setCategories(cats);
    setSummary(sum);
    setRecent(rec);
    persist({ categories: cats, summary: sum, recent: rec });
  }, [persist]);

  const boot = useCallback(async () => {
    const cache = readJSON<Cache>(CACHE_KEY);
    if (cache) {
      setName(cache.name);
      setCurrency(cache.currency);
      setCategories(cache.categories);
      setSummary(cache.summary);
      setRecent(cache.recent);
      setStatus("ready");
    }
    const last = readJSON<Record<TransactionType, string>>(LAST_CAT_KEY);
    if (last) setCatId(last);

    try {
      // Cached token → fire data requests immediately; authed() re-logins on 401.
      if (!hasToken()) {
        const auth = await telegramLogin();
        setName(auth.user.firstName);
        setCurrency(auth.user.currency);
        persist({ name: auth.user.firstName, currency: auth.user.currency });
      }
      await refresh();
      setStatus("ready");
    } catch (e) {
      if (e instanceof TgApiError && e.status === 404) setStatus("link");
      else if (e instanceof TgApiError && e.status === 401 && !getInitData()) setStatus("no-telegram");
      else setStatus((s) => (s === "ready" ? s : "no-telegram"));
    }
  }, [persist, refresh]);

  // Paint from cache first, then revalidate.
  useEffect(() => {
    const init = () => {
      const app = getWebApp();
      app?.ready?.();
      app?.expand?.();
      app?.disableVerticalSwipes?.();
      if (app?.colorScheme) setTheme(app.colorScheme);
    };
    if (getWebApp()) init();
    else window.addEventListener("load", init, { once: true });

    // boot() hydrates from localStorage (client-only) before the network round-trip
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void boot();
  }, [boot, setTheme]);

  const typeCats = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const selectedCat = typeCats.find((c) => c.id === catId[type]) ?? typeCats[0];
  const parsed = parseFloat(amount);
  const canSave = !!selectedCat && Number.isFinite(parsed) && parsed > 0;

  const press = (key: (typeof KEYS)[number]) => {
    haptic("light");
    setAmount((a) => {
      if (key === "del") return a.slice(0, -1);
      if (key === ".") return a.includes(".") ? a : (a || "0") + ".";
      if (a === "0") return key;
      if (a.includes(".") ? a.split(".")[1].length >= 2 : a.length >= 9) return a;
      return a + key;
    });
  };

  const save = async () => {
    if (!selectedCat || !canSave) return;
    const input = {
      categoryId: selectedCat.id,
      type,
      amount: parsed,
      description: note.trim() || selectedCat.name,
      date: localDate(),
    };
    const optimistic: Transaction = {
      id: `pending-${Date.now()}`,
      userId: "",
      recurrence: "once",
      tags: [],
      notes: undefined,
      createdAt: "",
      updatedAt: "",
      ...input,
      category: selectedCat,
      _pending: true,
    };

    // Optimistic: clear the composer and update totals instantly.
    const snapshot = { amount, note, recent, summary };
    setAmount("");
    setNote("");
    setRecent((r) => [optimistic, ...r].slice(0, 5));
    setSummary((s) =>
      s
        ? {
            ...s,
            totalIncome: s.totalIncome + (type === "income" ? parsed : 0),
            totalExpense: s.totalExpense + (type === "expense" ? parsed : 0),
            netBalance: s.netBalance + (type === "income" ? parsed : -parsed),
          }
        : s
    );
    writeJSON(LAST_CAT_KEY, { ...catId, [type]: selectedCat.id });
    setCatId((c) => ({ ...c, [type]: selectedCat.id }));
    haptic("success");
    showToast(t.tg.saved);

    try {
      await tgApi.create(input);
      void refresh();
    } catch {
      setAmount(snapshot.amount);
      setNote(snapshot.note);
      setRecent(snapshot.recent);
      setSummary(snapshot.summary);
      haptic("error");
      showToast(t.tg.failed);
    }
  };

  if (status === "no-telegram") {
    return <Centered>{t.tg.notTelegram}</Centered>;
  }
  if (status === "loading") {
    return <div className="min-h-dvh bg-background" />;
  }
  if (status === "link") {
    return <LinkForm onLinked={(a) => { setName(a.user.firstName); setCurrency(a.user.currency); persist({ name: a.user.firstName, currency: a.user.currency }); void refresh().then(() => setStatus("ready")); }} />;
  }

  const isExpense = type === "expense";
  const accent = isExpense ? "text-expense" : "text-income";

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] select-none">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{name}</p>
        <button
          onClick={() => setLang(lang === "en" ? "am" : "en")}
          className="text-xs font-medium rounded-full bg-surface-2 px-3 py-1 touch-manipulation"
        >
          {lang === "en" ? "አማ" : "EN"}
        </button>
      </header>

      <section className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label={t.tg.spent} value={summary?.totalExpense} currency={currency} className="text-expense" />
        <Stat label={t.tg.income} value={summary?.totalIncome} currency={currency} className="text-income" />
        <Stat label={t.tg.net} value={summary?.netBalance} currency={currency} />
      </section>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">{t.tg.thisMonth}</p>

      <div className="mt-4 grid grid-cols-2 rounded-xl bg-surface-2 p-1 text-sm font-medium">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setType(k)}
            className={`rounded-lg py-2 touch-manipulation transition-colors ${type === k ? "bg-surface-3 text-foreground" : "text-muted-foreground"}`}
          >
            {t.tg[k]}
          </button>
        ))}
      </div>

      <div className={`mt-4 text-center text-5xl font-semibold tabular-nums tracking-tight ${amount ? accent : "text-muted-foreground"}`}>
        {amount || "0"}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none]">
        {typeCats.map((c) => {
          const active = c.id === selectedCat?.id;
          return (
            <button
              key={c.id}
              onClick={() => { haptic("light"); setCatId((s) => ({ ...s, [type]: c.id })); }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm touch-manipulation transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"}`}
            >
              <span className="mr-1">{c.icon}</span>
              {translateCategory(c.name, lang)}
            </button>
          );
        })}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={255}
        placeholder={t.tg.note}
        className="mt-3 w-full rounded-xl border-0 bg-surface-2 px-4 py-2.5 text-sm placeholder:text-muted-foreground select-text"
      />

      <div className="mt-3 grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="flex h-12 items-center justify-center rounded-xl bg-surface-2 text-xl font-medium active:bg-surface-3 touch-manipulation"
          >
            {k === "del" ? <Delete size={20} /> : k}
          </button>
        ))}
      </div>

      <button
        onClick={save}
        disabled={!canSave}
        className="mt-3 h-12 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40 touch-manipulation active:scale-[0.99] transition-transform"
      >
        {isExpense ? t.tg.save : t.tg.saveIncome}
        {canSave && ` · ${formatCurrency(parsed, currency)}`}
      </button>

      <section className="mt-5">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.tg.recent}</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.tg.noRecent}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((tx) => {
              const cat = tx.category ?? categories.find((c) => c.id === tx.categoryId);
              return (
                <li key={tx.id} className={`flex items-center gap-3 py-2 ${tx._pending ? "opacity-60" : ""}`}>
                  <span className="text-lg">{cat?.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{tx.description}</span>
                  <span className={`text-sm font-medium tabular-nums ${tx.type === "income" ? "text-income" : "text-expense"}`}>
                    {tx.type === "income" ? "+" : "−"}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 flex justify-center">
          <div className="rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, currency, className = "" }: { label: string; value?: number; currency: string; className?: string }) {
  return (
    <div className="rounded-xl bg-surface-1 px-2 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`truncate text-sm font-semibold tabular-nums ${className}`}>
        {value === undefined ? "—" : formatCurrency(value, currency)}
      </p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-center text-muted-foreground">{children}</div>;
}

function LinkForm({ onLinked }: { onLinked: (a: Awaited<ReturnType<typeof telegramLink>>) => void }) {
  const t = useT();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLinked(await telegramLink(identifier.trim(), password));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.tg.failed);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-dvh flex-col justify-center gap-3 bg-background px-6 text-foreground">
      <h1 className="text-xl font-semibold">{t.tg.linkTitle}</h1>
      <p className="text-sm text-muted-foreground">{t.tg.linkSubtitle}</p>
      <input
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder={t.tg.identifier}
        autoCapitalize="none"
        autoComplete="username"
        className="rounded-xl border-0 bg-surface-2 px-4 py-3"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t.tg.password}
        autoComplete="current-password"
        className="rounded-xl border-0 bg-surface-2 px-4 py-3"
        required
      />
      {error && <p className="text-sm text-expense">{error}</p>}
      <button disabled={busy} className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50">
        {busy ? t.tg.linking : t.tg.link}
      </button>
    </form>
  );
}
