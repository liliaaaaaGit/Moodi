"use client";

import { IosInstallHint } from "@/components/IosInstallHint";
import { PushOptIn } from "@/components/PushOptIn";

export function HeutePwaExtras() {
  return (
    <div className="mt-4 space-y-4">
      <PushOptIn />
      <IosInstallHint />
    </div>
  );
}
