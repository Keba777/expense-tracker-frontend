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
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  currency: z.string().default("USD"),
});
type FormData = z.infer<typeof schema>;

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "ETB", "CAD", "AUD", "CHF", "CNY", "INR"];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { currency: "USD" } });

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push("/dashboard");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError("root", { message: msg ?? "Registration failed. Please try again." });
    },
  });

  const inputClass = (hasError?: boolean) =>
    cn(
      "w-full h-11 rounded-xl bg-muted border px-4 text-sm transition-colors",
      "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
      hasError ? "border-expense/50" : "border-border focus:border-primary/50"
    );

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-glow">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground text-sm mt-1">Start tracking your finances</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
          {errors.root && (
            <div className="bg-expense/10 border border-expense/30 rounded-xl px-4 py-3 text-sm text-expense">
              {errors.root.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">First name</label>
              <input
                {...register("firstName")}
                placeholder="John"
                className={inputClass(!!errors.firstName)}
              />
              {errors.firstName && <p className="text-xs text-expense">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Last name</label>
              <input
                {...register("lastName")}
                placeholder="Doe"
                className={inputClass(!!errors.lastName)}
              />
              {errors.lastName && <p className="text-xs text-expense">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass(!!errors.email)}
            />
            {errors.email && <p className="text-xs text-expense">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
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
            {errors.password && <p className="text-xs text-expense">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Currency</label>
            <select {...register("currency")} className={cn(inputClass(), "cursor-pointer")}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-11 rounded-xl font-semibold text-sm transition-all mt-2",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2 shadow-glow"
            )}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
