import { clsx } from "clsx";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx("rounded-2xl bg-white p-5 shadow-soft", className)}>
      {children}
    </div>
  );
}
