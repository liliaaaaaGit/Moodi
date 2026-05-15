import { clsx } from "clsx";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return (
    <h3
      className={clsx(
        "text-sm font-medium uppercase tracking-wide text-text-secondary",
        className
      )}
    >
      {children}
    </h3>
  );
}
