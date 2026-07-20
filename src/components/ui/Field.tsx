"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex w-full flex-col gap-1">
      <span className="text-[16px] font-normal text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-12 w-full rounded-[12px] border border-border bg-white px-4 text-[16px] text-text outline-none placeholder:text-text-muted transition-[border-color,box-shadow,background-color] duration-150 focus:border-black focus:shadow-[2px_2px_0_0_var(--color-black)] ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-12 w-full appearance-none rounded-[12px] border border-border bg-white px-4 text-[16px] text-text outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-black focus:shadow-[2px_2px_0_0_var(--color-black)] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function ChoicePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[14px] border px-4 py-4 text-left text-[16px] font-semibold transition motion-list-item ${
        selected
          ? "animate-badge-in border-black bg-lime-soft app-active-shadow"
          : "border-border bg-white hover:border-black/40"
      }`}
    >
      {children}
    </button>
  );
}
