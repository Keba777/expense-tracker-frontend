"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { peopleApi } from "@/lib/api/people";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  phone: z.string().max(30).optional(),
  notes: z.string().max(1000).optional(),
});
type FormData = z.infer<typeof schema>;

export function AddPersonSheet() {
  const qc = useQueryClient();
  const t = useT();
  const { isAddPersonOpen, closeAddPerson, editingPerson } = useUIStore();
  const isEditing = editingPerson !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  useEffect(() => {
    if (editingPerson) {
      reset({
        name: editingPerson.name,
        phone: editingPerson.phone ?? "",
        notes: editingPerson.notes ?? "",
      });
    } else {
      reset({ name: "", phone: "", notes: "" });
    }
  }, [editingPerson, reset]);

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: (data: FormData) =>
      peopleApi.create({ name: data.name, phone: data.phone || undefined, notes: data.notes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      closeAddPerson();
    },
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (data: FormData) =>
      peopleApi.update(editingPerson!.id, {
        name: data.name,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      closeAddPerson();
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

  if (!isAddPersonOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAddPerson} />

      <div
        className={cn(
          "relative w-full max-w-lg bg-[hsl(var(--surface-1))] shadow-sheet animate-slide-up",
          "rounded-t-3xl md:rounded-3xl max-h-[92dvh] overflow-y-auto scrollbar-hide"
        )}
      >
        <div className="md:hidden sheet-handle" />
        <div className="sticky top-0 glass-nav z-10 flex items-center justify-between px-5 pt-3 pb-3">
          <h2 className="text-lg font-semibold">{isEditing ? t.lending.editPerson : t.lending.addPerson}</h2>
          <button
            onClick={closeAddPerson}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.lending.personName}</label>
            <input
              {...register("name")}
              placeholder={t.lending.personName}
              className={cn(
                "w-full h-11 bg-muted rounded-xl px-4 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.name ? "ring-2 ring-expense/50" : ""
              )}
            />
            {errors.name && <p className="text-xs text-expense">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.lending.phone}</label>
            <input
              {...register("phone")}
              className="w-full h-11 bg-muted rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
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
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.lending.saving}</> : t.lending.save}
          </button>
        </form>
      </div>
    </div>
  );
}
