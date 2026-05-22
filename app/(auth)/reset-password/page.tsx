"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { TrendingUp, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.resetPassword(token, data.password),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError("root", { message: msg ?? t.auth.invalidResetToken });
    },
  });

  const inputClass = (hasError?: boolean) =>
    cn(
      "w-full h-11 rounded-xl bg-muted border px-4 text-sm transition-colors",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
      hasError ? "border-expense/50" : "border-border focus:border-primary/50"
    );

  if (!token) {
    return (
      <div className="surface-1 rounded-3xl p-6 shadow-card text-center space-y-3">
        <p className="text-sm text-expense">{t.auth.invalidResetToken}</p>
        <Link href="/forgot-password" className="text-sm text-primary font-medium hover:underline">
          {t.auth.requestNewLink}
        </Link>
      </div>
    );
  }

  return (
    <div className="surface-1 rounded-3xl p-6 shadow-card">
      {success ? (
        <div className="flex flex-col items-center py-4 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-income/10 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-income" />
          </div>
          <p className="text-sm text-muted-foreground">{t.auth.resetSuccess}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
          {errors.root && (
            <div className="bg-expense/10 border border-expense/30 rounded-xl px-4 py-3 text-sm text-expense">
              {errors.root.message}
              {errors.root.message === t.auth.invalidResetToken && (
                <Link href="/forgot-password" className="block mt-1 text-primary font-medium hover:underline">
                  {t.auth.requestNewLink}
                </Link>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.auth.newPassword}</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t.auth.minChars}
                className={cn(inputClass(!!errors.password), "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-expense">{t.auth.passwordMinLength}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.auth.confirmPassword}</label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t.auth.minChars}
                className={cn(inputClass(!!errors.confirmPassword), "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-expense">
                {errors.confirmPassword.message === "passwordsDoNotMatch"
                  ? t.auth.passwordsDoNotMatch
                  : t.auth.passwordRequired}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-11 rounded-xl font-semibold text-sm transition-all mt-2",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2 press"
            )}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{t.auth.resettingPassword}</>
            ) : t.auth.resetPasswordBtn}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const t = useT();

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-glow">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.auth.resetPasswordTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.auth.resetPasswordSubtitle}</p>
      </div>

      <Suspense fallback={
        <div className="surface-1 rounded-3xl p-6 shadow-card flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>

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
