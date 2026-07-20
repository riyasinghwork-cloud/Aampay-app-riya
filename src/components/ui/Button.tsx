"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "lime" | "lagoon" | "ghost" | "secondary";

const styles: Record<Variant, string> = {
  primary:
    "border border-black bg-black text-white app-active-shadow app-press-shadow hover:bg-neutral-800",
  lime: "border border-black bg-lime text-black app-active-shadow app-press-shadow hover:brightness-95",
  lagoon:
    "border border-black bg-lagoon text-white app-active-shadow app-press-shadow hover:brightness-95",
  ghost: "bg-transparent text-black transition hover:bg-black/5 active:scale-[0.98]",
  secondary:
    "border border-black bg-white text-black transition hover:bg-bg active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex h-12 w-full items-center justify-center rounded-full px-4 text-[16px] font-semibold disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
