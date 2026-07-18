"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/lib/i18n";
import { peopleApi } from "@/lib/api/people";
import { PersonCard } from "@/components/people/person-card";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import type { PersonWithBalance } from "@/types";

export default function PeoplePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { openAddPerson, openEditPerson } = useUIStore();
  const t = useT();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people"],
    queryFn: peopleApi.list,
  });

  const filtered = people
    .filter((p) => p.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

  const { mutate: deletePerson } = useMutation({
    mutationFn: peopleApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
    onError: () => alert(t.lending.deletePersonBlocked),
  });

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["people"] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t.lending.title}</h1>
          <button
            onClick={openAddPerson}
            className="flex items-center gap-1.5 bg-primary/15 text-primary text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-primary/25 press transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.lending.addPerson}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.lending.personName}
            className="w-full h-10 surface-1 rounded-xl pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="surface-1 rounded-2xl divide-y divide-border overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 h-16 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="surface-1 rounded-2xl p-10 text-center">
            <span className="text-4xl block mb-3">🤝</span>
            <p className="font-semibold">{t.lending.noPeople}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.lending.addFirstPerson}</p>
          </div>
        ) : (
          <div className="surface-1 rounded-2xl overflow-hidden divide-y divide-border">
            {filtered.map((p: PersonWithBalance) => (
              <PersonCard
                key={p.id}
                person={p}
                currency={user?.currency}
                onEdit={openEditPerson}
                onDelete={deletePerson}
                onTap={(person) => router.push(`/people/${person.id}`)}
              />
            ))}
          </div>
        )}

        <button
          onClick={openAddPerson}
          className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </PullToRefresh>
  );
}
