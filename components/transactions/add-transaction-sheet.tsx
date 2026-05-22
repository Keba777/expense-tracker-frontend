"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { transactionsApi, categoriesApi } from "@/lib/api/transactions";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useOfflineQueue } from "@/store/offline-queue-store";
import { useT } from "@/lib/i18n";
import { useDateFormat } from "@/lib/use-date-format";
import { translateCategory } from "@/lib/category-translations";
import { EthiopianDatePicker } from "@/components/transactions/ethiopian-date-picker";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.string().min(1, "Amount required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be > 0"),
  description: z.string().min(1, "Description required").max(255),
  categoryId: z.string().uuid("Select a category"),
  date: z.string().min(1, "Date required"),
  notes: z.string().max(1000).optional(),
  recurrence: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
});
type FormData = z.infer<typeof schema>;

export function AddTransactionSheet() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const { enqueue } = useOfflineQueue();
  const { isAddTransactionOpen, closeAddTransaction, defaultTransactionType, editingTransaction } = useUIStore();

  const isEditing = editingTransaction !== null;
  const { lang } = useDateFormat();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    enabled: isAddTransactionOpen,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultTransactionType,
      date: format(new Date(), "yyyy-MM-dd"),
      recurrence: "once",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        amount: String(editingTransaction.amount),
        description: editingTransaction.description,
        categoryId: editingTransaction.categoryId,
        date: editingTransaction.date.slice(0, 10),
        recurrence: editingTransaction.recurrence,
        notes: editingTransaction.notes ?? "",
      });
    } else {
      reset({
        type: defaultTransactionType,
        amount: "",
        description: "",
        categoryId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        recurrence: "once",
        notes: "",
      });
    }
  }, [editingTransaction, defaultTransactionType, reset]);

  const filteredCategories = categories.filter((c: Category) => c.type === selectedType);

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi.create({
        categoryId: data.categoryId,
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
        notes: data.notes || undefined,
        date: data.date,
        recurrence: data.recurrence,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      closeAddTransaction();
    },
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (data: FormData) =>
      transactionsApi.update(editingTransaction!.id, {
        categoryId: data.categoryId,
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
        notes: data.notes || undefined,
        date: data.date,
        recurrence: data.recurrence,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      closeAddTransaction();
    },
  });

  const isPending = isCreating || isUpdating;

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      update(data);
      return;
    }

    // If offline, queue for sync and optimistically update the UI
    if (!navigator.onLine) {
      const optimisticId = crypto.randomUUID();
      const now = new Date().toISOString();
      const category = categories.find((c: Category) => c.id === data.categoryId);

      const optimisticTx: Transaction = {
        id: optimisticId,
        userId: user?.id ?? "",
        categoryId: data.categoryId,
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
        notes: data.notes || undefined,
        date: data.date,
        recurrence: data.recurrence,
        recurrenceEndDate: undefined,
        tags: [],
        createdAt: now,
        updatedAt: now,
        category,
        _pending: true,
      };

      enqueue({
        id: crypto.randomUUID(),
        type: "create",
        payload: {
          categoryId: data.categoryId,
          type: data.type,
          amount: Number(data.amount),
          description: data.description,
          notes: data.notes || undefined,
          date: data.date,
          recurrence: data.recurrence,
        },
        optimisticId,
        createdAt: Date.now(),
      });

      const prependOptimistic = (old: { data: Transaction[] } | undefined) => {
        if (!old) return old;
        return { ...old, data: [optimisticTx, ...old.data] };
      };

      qc.setQueryData(["transactions", { page: 1, perPage: 10 }], prependOptimistic);
      qc.setQueryData(["transactions", { page: 1, perPage: 30 }], prependOptimistic);
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      closeAddTransaction();
      return;
    }

    create(data);
  };

  if (!isAddTransactionOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAddTransaction}
      />

      <div
        className={cn(
          "relative w-full max-w-lg bg-[hsl(var(--surface-1))] shadow-sheet animate-slide-up",
          "rounded-t-3xl md:rounded-3xl max-h-[92dvh] overflow-y-auto scrollbar-hide"
        )}
      >
        <div className="md:hidden sheet-handle" />
        <div className="sticky top-0 glass-nav z-10 flex items-center justify-between px-5 pt-3 pb-3">
          <h2 className="text-lg font-semibold">{isEditing ? t.transaction.edit : t.transaction.new}</h2>
          <button
            onClick={closeAddTransaction}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Type toggle */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-2xl">
                {(["expense", "income"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={isEditing}
                    onClick={() => { field.onChange(type); setValue("categoryId", ""); }}
                    className={cn(
                      "h-10 rounded-xl text-sm font-semibold capitalize transition-all",
                      field.value === type
                        ? type === "income"
                          ? "bg-income text-white"
                          : "bg-expense text-white"
                        : "text-muted-foreground hover:text-foreground",
                      isEditing && "cursor-not-allowed opacity-80"
                    )}
                  >
                    {type === "income" ? t.transaction.income : t.transaction.expense}
                  </button>
                ))}
              </div>
            )}
          />

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.transaction.amount}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {lang === "am" && user?.currency === "ETB" ? "ብር" : (user?.currency ?? "USD")}
              </span>
              <input
                {...register("amount")}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className={cn(
                  "w-full h-14 bg-muted rounded-2xl pl-14 pr-4 text-2xl font-bold",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  errors.amount ? "ring-2 ring-expense/50" : ""
                )}
              />
            </div>
            {errors.amount && <p className="text-xs text-expense">{errors.amount.message === "Amount required" ? t.transaction.amountRequired : t.transaction.mustBePositive}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.transaction.description}</label>
            <input
              {...register("description")}
              placeholder={t.transaction.whatFor}
              className={cn(
                "w-full h-11 bg-muted rounded-xl px-4 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.description ? "ring-2 ring-expense/50" : ""
              )}
            />
            {errors.description && <p className="text-xs text-expense">{t.transaction.descriptionRequired}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.transaction.category}</label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {filteredCategories.map((cat: Category) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => field.onChange(cat.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all",
                        field.value === cat.id
                          ? "border-primary/60 bg-primary/10"
                          : "border-border bg-muted hover:border-border/80"
                      )}
                    >
                      <span className="text-lg leading-none">{cat.icon}</span>
                      <span className="text-[10px] text-center leading-tight font-medium truncate w-full">
                        {translateCategory(cat.name, lang).split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.categoryId && <p className="text-xs text-expense">{t.transaction.selectCategory}</p>}
          </div>

          {/* Date + Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t.transaction.date}</label>
              {lang === "am" ? (
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <EthiopianDatePicker value={field.value} onChange={field.onChange} />
                  )}
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
              <label className="text-sm font-medium">{t.transaction.repeat}</label>
              <select
                {...register("recurrence")}
                className="w-full h-11 bg-muted rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="once">{t.transaction.once}</option>
                <option value="daily">{t.transaction.daily}</option>
                <option value="weekly">{t.transaction.weekly}</option>
                <option value="monthly">{t.transaction.monthly}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t.transaction.notes}</label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder={t.transaction.notesPlaceholder}
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
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.transaction.saving}</> : isEditing ? t.transaction.saveChanges : t.transaction.save}
          </button>
        </form>
      </div>
    </div>
  );
}
