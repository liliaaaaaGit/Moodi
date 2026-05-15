"use client";

import { clsx } from "clsx";
import { LineChart, Plus, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

const tabs = [
  { href: "/", label: "Heute", icon: Sun, center: false },
  { href: "/checkin", label: "Check-in", icon: Plus, center: true },
  { href: "/history", label: "Verlauf", icon: LineChart, center: false },
  { href: "/skills", label: "Skills", icon: Sparkles, center: false, longPressSettings: true },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      router.push("/settings");
    }, 600);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white shadow-soft-lg"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Hauptnavigation"
    >
      <div className="mx-auto flex h-20 max-w-lg items-end justify-around px-2 pt-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const longPressProps =
            "longPressSettings" in tab && tab.longPressSettings
              ? {
                  onTouchStart: startLongPress,
                  onTouchEnd: cancelLongPress,
                  onTouchCancel: cancelLongPress,
                  onMouseDown: startLongPress,
                  onMouseUp: cancelLongPress,
                  onMouseLeave: cancelLongPress,
                }
              : {};

          if (tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex -mt-6 flex-col items-center gap-1"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={clsx(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-soft transition-colors duration-200 ease-gentle",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-primary/90 text-white"
                  )}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.25} aria-hidden />
                </span>
                <span
                  className={clsx(
                    "text-xs font-medium",
                    isActive ? "text-primary" : "text-text-secondary"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              {...longPressProps}
              className="flex min-w-[4.5rem] flex-col items-center gap-1 pb-2"
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={clsx(
                  "h-6 w-6 transition-colors duration-200 ease-gentle",
                  isActive ? "text-primary" : "text-text-secondary"
                )}
                strokeWidth={isActive ? 2.25 : 2}
                aria-hidden
              />
              <span
                className={clsx(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-text-secondary"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
