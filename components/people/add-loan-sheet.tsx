"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { loansApi } from "@/lib/api/loans";
import { peopleApi } from "@/lib/api/people";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/lib/i18n";
import { useDateFormat } from "@/lib/use-date-format";
import { EthiopianDatePicker } from "@/components/transactions/ethiopian-date-picker";
import { cn } from "@/lib/utils";
import type { PersonWithBalance } from "@/types";

const schema = z.object({
  direction: z.enum(["lent", "borrowed"]),
  personId: z.string().uuid("Select a person"),
  amount: z.string().min(1, "Amount required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be > 0"),
  description: z.string().min(1, "Description required").max(255),
  date: z.string().min(1, "Date required"),
  dueDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
type FormData = z.infer<typeof schema>;

export function AddLoanSheet() {
  const qc = useQueryClient();
  const t = useT();
  const { lang } = useDateFormat();
  const {
    isAddLoanOpen,
    closeAddLoan,
    defaultLoanDirection,
    prefilledPersonId,
    editingLoan,
  } = useUIStore();

  const isEditing = editingLoan !== null;

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: peopleApi.list,
    enabled: isAddLoanOpen,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      direction: defaultLoanDirection,
      personId: prefilledPersonId ?? "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  useEffect(() => {
    if (editingLoan) {
      reset({
        direction: editingLoan.direction,
        personId: editingLoan.personId,
        amount: String(editingLoan.amount),
        description: editingLoan.description,
        date: editingLoan.date.slice(0, 10),
        dueDate: editingLoan.dueDate?.slice(0, 10) ?? "",
        notes: editingLoan.notes ?? "",
      });
    } else {
      reset({
        direction: defaultLoanDirection,
        personId: prefilledPersonId ?? "",
        amount: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        dueDate: "",
        notes: "",
      });
    }
  }, [editingLoan, defaultLoanDirection, prefilledPersonId, reset]);

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: (data: FormData) =>
      loansApi.create({
        personId: data.personId,
        direction: data.direction,
        amount: Number(data.amount),
        description: data.description,
        date: data.date,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["people"] });
      closeAddLoan();
    },
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (data: FormData) =>
      loansApi.update(editingLoan!.id, {
        description: data.description,
        date: data.date,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["people"] });
      closeAddLoan();
    },
  });

  const isPending = isCreating || isUpdating;

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      update(data);
      return;
    }
    create(data);
  };

  if (!isAddLoanOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAddLoan} />

      <div
        className={cn(
          "relative w-full max-w-lg bg-[hsl(var(--surface-1))] shadow-sheet animate-slide-up",
          "rounded-t-3xl md:rounded-3xl max-h-[92dvh] overflow-y-auto scrollbar-hide"
        )}
      >
        <div className="md:hidden sheet-handle" />
        <div className="sticky top-0 glass-nav z-10 flex items-center justify-between px-5 pt-3 pb-3">
          <h2 className="text-lg font-semibold">{isEditing ? t.lending.editLoan : t.lending.addLoan}</h2>
          <button
            onClick={closeAddLoan}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Direction toggle */}
          <Controller
            name="direction"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-2xl">
                {(["lent", "borrowed"] as const).map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    disabled={isEditing}
                    onClick={() => field.onChange(direction)}
                    className={cn(
                      "h-10 rounded-xl text-sm font-semibold capitalize transition-all",
                      field.value === direction
                        ? direction === "lent"
                          ? "bg-income text-white"
                          : "bg-expense text-white"
                        : "text-muted-foreground hover:text-foreground",
                      isEditing && "cursor-not-allowed opacity-80"
                    )}
                  >
                    {direction === "lent" ? t.lending.lent : t.lending.borrowed}
                  </button>
                ))}
              </div>
            )}
          />

          {/* Person */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.lending.person}</label>
            <Controller
              name="personId"
              control={control}
              render={({ field }) => (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {people.map((p: PersonWithBalance) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isEditing}
                      onClick={() => field.onChange(p.id)}
                      className={cn(
                        "w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-all border",
                        field.value === p.id
                          ? "border-primary/60 bg-primary/10"
                          : "border-border bg-muted hover:border-border/80",
                        isEditing && "cursor-not-allowed opacity-80"
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                  {people.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">{t.lending.noPeople}</p>
                  )}
                </div>
              )}
            />
            {errors.personId && <p className="text-xs text-expense">{t.lending.selectPerson}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.lending.amount}</label>
            <input
              {...register("amount")}
              type="number"
              inputMode="decimal"
              step="0.01"
              disabled={isEditing}
              placeholder="0.00"
              className={cn(
                "w-full h-14 bg-muted rounded-2xl px-4 text-2xl font-bold",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                errors.amount ? "ring-2 ring-expense/50" : "",
                isEditing && "opacity-70 cursor-not-allowed"
              )}
            />
            {errors.amount && <p className="text-xs text-expense">{errors.amount.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.lending.description}</label>
            <input
              {...register("description")}
              placeholder={t.lending.whatFor}
              className={cn(
                "w-full h-11 bg-muted rounded-xl px-4 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.description ? "ring-2 ring-expense/50" : ""
              )}
            />
            {errors.description && <p className="text-xs text-expense">{errors.description.message}</p>}
          </div>

          {/* Date + Due date */}
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-sm font-medium">{t.lending.dueDate}</label>
              {lang === "am" ? (
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <EthiopianDatePicker value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
              ) : (
                <input
                  {...register("dueDate")}
                  type="date"
                  className="w-full h-11 bg-muted rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}
            </div>
          </div>

          {/* Notes */}
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
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.lending.saving}</> : t.lending.save}
          </button>
        </form>
      </div>
    </div>
  );
}
