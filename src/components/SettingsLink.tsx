"use client";

import { Settings } from "lucide-react";
import Link from "next/link";

export function SettingsLink() {
  return (
    <Link
      href="/settings"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-text-secondary shadow-soft transition-colors hover:text-primary"
      aria-label="Einstellungen"
    >
      <Settings className="h-5 w-5" strokeWidth={2} />
    </Link>
  );
}
