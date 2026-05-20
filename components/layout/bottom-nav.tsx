"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowDownUp, TrendingUp, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/expenses", icon: ArrowDownUp, label: "Expenses" },
  { href: "/income", icon: TrendingUp, label: "Income" },
  { href: "/reports", icon: BarChart2, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/15 scale-110"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-all", isActive && "stroke-[2.5]")} />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={cn("text-[10px] font-medium leading-none", isActive && "font-semibold")}>
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
