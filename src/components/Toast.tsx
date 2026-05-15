"use client";

import { clsx } from "clsx";
import { useEffect } from "react";

type ToastProps = {
  message: string;
  onClose: () => void;
  variant?: "error" | "info";
};

export function Toast({ message, onClose, variant = "error" }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      className={clsx(
        "fixed left-6 right-6 top-6 z-[100] mx-auto max-w-lg rounded-2xl px-4 py-3 text-center text-sm font-medium shadow-soft-lg",
        variant === "error"
          ? "bg-warning/15 text-warning"
          : "bg-primary/15 text-text-primary"
      )}
    >
      {message}
    </div>
  );
}
