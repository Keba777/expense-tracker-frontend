"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { TrendingUp, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const schema = z.object({
  identifier: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const t = useT();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.forgotPassword(data.identifier),
    onSuccess: () => setSent(true),
    onError: () => setSent(true), // still show success to prevent enumeration
  });

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-3 shadow-glow">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-violet-400 tracking-widest mb-3">ሒሳብ</p>
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.forgotPasswordTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1 text-center px-4">
          {t.auth.forgotPasswordSubtitle}
        </p>
      </div>

      <div className="surface-1 rounded-3xl p-6 shadow-card">
        {sent ? (
          <div className="flex flex-col items-center py-4 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-income/10 flex items-center justify-center">
              <MailCheck className="w-7 h-7 text-income" />
            </div>
            <h2 className="font-semibold text-base">{t.auth.resetLinkSent}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.auth.resetLinkSentDesc}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t.auth.emailOrPhone}</label>
              <input
                {...register("identifier")}
                type="text"
                autoComplete="username"
                placeholder="you@example.com or +251912345678"
                autoFocus
                className={cn(
                  "w-full h-11 rounded-xl bg-muted border px-4 text-sm transition-colors",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                  errors.identifier ? "border-expense/50" : "border-border focus:border-primary/50"
                )}
              />
              {errors.identifier && (
                <p className="text-xs text-expense">{t.auth.emailOrPhoneRequired}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full h-11 rounded-xl font-semibold text-sm transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2 press"
              )}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{t.auth.sendingResetLink}</>
              ) : t.auth.sendResetLink}
            </button>
          </form>
        )}
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.auth.backToSignIn}
      </Link>
    </div>
  );
}
