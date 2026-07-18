"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { loansApi } from "@/lib/api/loans";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useT } from "@/lib/i18n";
import { useDateFormat } from "@/lib/use-date-format";
import { EthiopianDatePicker } from "@/components/transactions/ethiopian-date-picker";
import { formatCurrency, cn } from "@/lib/utils";

const schema = z.object({
  amount: z.string().min(1, "Amount required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be > 0"),
  date: z.string().min(1, "Date required"),
  notes: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export function AddPaymentSheet() {
  const qc = useQueryClient();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const { lang } = useDateFormat();
  const { isAddPaymentOpen, closeAddPayment, payingLoan } = useUIStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" },
  });

  useEffect(() => {
    if (payingLoan) {
      reset({
        amount: String(payingLoan.remainingAmount),
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    }
  }, [payingLoan, reset]);

  const { mutate: addPayment, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      loansApi.addPayment(payingLoan!.id, {
        amount: Number(data.amount),
        date: data.date,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["people"] });
      closeAddPayment();
    },
  });

  if (!isAddPaymentOpen || !payingLoan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAddPayment} />

      <div
        className={cn(
          "relative w-full max-w-lg bg-[hsl(var(--surface-1))] shadow-sheet animate-slide-up",
          "rounded-t-3xl md:rounded-3xl max-h-[92dvh] overflow-y-auto scrollbar-hide"
        )}
      >
        <div className="md:hidden sheet-handle" />
        <div className="sticky top-0 glass-nav z-10 flex items-center justify-between px-5 pt-3 pb-3">
          <h2 className="text-lg font-semibold">{t.lending.recordPayment}</h2>
          <button
            onClick={closeAddPayment}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => addPayment(data))} className="p-5 space-y-5">
          <div className="surface-2 rounded-2xl p-4">
            <p className="text-sm font-medium truncate">{payingLoan.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.lending.remaining}: {formatCurrency(payingLoan.remainingAmount, user?.currency)}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.lending.paymentAmount}</label>
            <input
              {...register("amount")}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              className={cn(
                "w-full h-14 bg-muted rounded-2xl px-4 text-2xl font-bold",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                errors.amount ? "ring-2 ring-expense/50" : ""
              )}
            />
            {errors.amount && <p className="text-xs text-expense">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.lending.date}</label>
            {lang === "am" ? (
              <Controller
                name="date"
                control={control}
                render={({ field }) => <EthiopianDatePicker value={field.value} onChange={field.onChange} />}
              />
            ) : (
              <input
                {...register("date")}
                type="date"
                className="w-full h-11 bg-muted rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t.lending.notes}</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2",
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-all press",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.lending.saving}</> : t.lending.recordPayment}
          </button>
        </form>
      </div>
    </div>
  );
}
