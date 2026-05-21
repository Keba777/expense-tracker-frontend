"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  User, Palette, Bell, Globe, LogOut, ChevronRight,
  Sun, Moon, Monitor, Trash2, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useLangStore } from "@/store/lang-store";
import { categoriesApi } from "@/lib/api/transactions";
import { apiClient } from "@/lib/api/client";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const profileSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  currency: z.string().length(3),
  timezone: z.string().min(1),
});
type ProfileData = z.infer<typeof profileSchema>;

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "ETB", "CAD", "AUD", "CHF", "CNY", "INR"];
const TIMEZONES = Intl.supportedValuesOf("timeZone").slice(0, 50);

export default function SettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { user, clearAuth, updateUser } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const t = useT();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      currency: user?.currency ?? "USD",
      timezone: user?.timezone ?? "UTC",
    },
  });

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: (data: ProfileData) => apiClient.put("/users/profile", data).then(r => r.data.data),
    onSuccess: (updated) => {
      updateUser(updated);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const { mutate: deleteCategory } = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const inputClass = "w-full h-11 bg-muted rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border";

  const sections = [
    { id: "profile", icon: User, label: t.settings.profile, description: t.settings.profileDesc },
    { id: "appearance", icon: Palette, label: t.settings.appearance, description: t.settings.appearanceDesc },
    { id: "categories", icon: Bell, label: t.settings.categories, description: t.settings.categoriesDesc },
    { id: "language", icon: Globe, label: t.settings.language, description: t.settings.languageDesc },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold">{t.settings.title}</h1>

      {/* User card */}
      <div className="surface-1 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            {user?.plan} {t.settings.planLabel}
          </span>
        </div>
      </div>

      {/* Section list */}
      <div className="surface-1 rounded-2xl divide-y divide-border overflow-hidden">
        {sections.map(({ id, icon: Icon, label, description }) => (
          <button
            key={id}
            onClick={() => setActiveSection(activeSection === id ? null : id)}
            className="flex items-center gap-3 w-full p-4 hover:bg-accent/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", activeSection === id && "rotate-90")} />
          </button>
        ))}
      </div>

      {/* Profile section */}
      {activeSection === "profile" && (
        <div className="surface-1 rounded-2xl p-4 space-y-4 animate-slide-down">
          <h3 className="text-sm font-semibold">{t.settings.profileSettings}</h3>
          <form onSubmit={handleSubmit((d) => saveProfile(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t.settings.firstName}</label>
                <input {...register("firstName")} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t.settings.lastName}</label>
                <input {...register("lastName")} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.settings.currency}</label>
              <select {...register("currency")} className={cn(inputClass, "cursor-pointer")}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.settings.timezone}</label>
              <select {...register("timezone")} className={cn(inputClass, "cursor-pointer")}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={savingProfile || !isDirty}
              className={cn(
                "w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2",
                "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {savingProfile ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.settings.saving}</> : t.settings.saveChanges}
            </button>
          </form>
        </div>
      )}

      {/* Appearance section */}
      {activeSection === "appearance" && (
        <div className="surface-1 rounded-2xl p-4 space-y-3 animate-slide-down">
          <h3 className="text-sm font-semibold">{t.settings.theme}</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "light", label: t.settings.light, icon: Sun },
              { value: "dark", label: t.settings.dark, icon: Moon },
              { value: "system", label: t.settings.system, icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories section */}
      {activeSection === "categories" && (
        <div className="surface-1 rounded-2xl p-4 space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t.settings.categories}</h3>
          </div>
          {catsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {(categories as Category[]).map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted">
                  <span className="text-base">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  {!cat.isDefault && (
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1 text-muted-foreground hover:text-expense transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Language section */}
      {activeSection === "language" && (
        <div className="surface-1 rounded-2xl p-4 space-y-3 animate-slide-down">
          <h3 className="text-sm font-semibold">{t.settings.language}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "am"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "h-10 rounded-xl text-sm font-semibold transition-all border",
                  lang === l
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {l === "en" ? t.settings.english : t.settings.amharic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="surface-1 rounded-2xl overflow-hidden">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-4 hover:bg-expense/5 transition-colors text-expense"
        >
          <div className="w-9 h-9 rounded-xl bg-expense/10 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">{t.settings.signOut}</p>
            <p className="text-xs text-muted-foreground">{t.settings.signOutDesc}</p>
          </div>
        </button>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground">{t.settings.version}</p>
        <p className="text-xs text-muted-foreground/50 mt-0.5">{t.settings.tagline}</p>
      </div>
    </div>
  );
}
