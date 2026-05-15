import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export function PrimaryButton({
  children,
  className,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "min-h-touch w-full rounded-2xl bg-primary px-6 text-lg font-medium text-white shadow-soft transition-opacity duration-200 ease-gentle hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
