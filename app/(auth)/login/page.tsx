"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, TrendingUp, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const t = useT();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push("/dashboard");
    },
    onError: () => {
      setError("root", { message: t.auth.invalidCreds });
    },
  });

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-glow">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.welcomeBack}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.auth.signInSubtitle}</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
          {errors.root && (
            <div className="bg-expense/10 border border-expense/30 rounded-xl px-4 py-3 text-sm text-expense">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t.auth.email}</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(
                "w-full h-11 rounded-xl bg-muted border px-4 text-sm transition-colors",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.email ? "border-expense/50" : "border-border focus:border-primary/50"
              )}
            />
            {errors.email && <p className="text-xs text-expense">{t.auth.emailRequired}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t.auth.password}</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  "w-full h-11 rounded-xl bg-muted border px-4 pr-10 text-sm transition-colors",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                  errors.password ? "border-expense/50" : "border-border focus:border-primary/50"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-expense">{t.auth.passwordRequired}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-11 rounded-xl font-semibold text-sm transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2 shadow-glow"
            )}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{t.auth.signingIn}</>
            ) : t.auth.signIn}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          {t.auth.createOne}
        </Link>
      </p>
    </div>
  );
}
