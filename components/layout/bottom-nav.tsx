"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowDownUp, TrendingUp, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const navItems = [
    { href: "/dashboard", icon: Home, label: t.nav.home },
    { href: "/expenses", icon: ArrowDownUp, label: t.nav.expenses },
    { href: "/income", icon: TrendingUp, label: t.nav.income },
    { href: "/reports", icon: BarChart2, label: t.nav.reports },
    { href: "/settings", icon: Settings, label: t.nav.settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      <div className="glass-nav safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-full h-full press",
                  "transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary" />
                )}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200",
                    isActive && "bg-primary/12"
                  )}
                >
                  <Icon className={cn("w-[22px] h-[22px] transition-all", isActive && "stroke-[2.4]")} />
                </div>
                <span className={cn("text-[10px] leading-none", isActive ? "font-semibold" : "font-medium")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
