"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, ArrowDownUp, TrendingUp, BarChart2,
  Settings, LogOut, TrendingUpIcon, HandCoins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useT } from "@/lib/i18n";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const t = useT();

  const navItems = [
    { href: "/dashboard", icon: Home, label: t.nav.dashboard },
    { href: "/expenses", icon: ArrowDownUp, label: t.nav.expenses },
    { href: "/income", icon: TrendingUp, label: t.nav.income },
    { href: "/reports", icon: BarChart2, label: t.nav.reports },
    { href: "/people", icon: HandCoins, label: t.nav.people },
    { href: "/settings", icon: Settings, label: t.nav.settings },
  ];

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-dvh bg-card border-r border-border fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
          <TrendingUpIcon className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">ሒሳብ</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", isActive && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.plan}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-expense/10 hover:text-expense transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {t.nav.signOut}
        </button>
      </div>
    </aside>
  );
}
