"use client";

import type { ReactNode } from "react";

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const active = pct > 0 && pct < 100;
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-[16px] font-semibold">
        <span className="text-text-secondary">{label ?? "Progress"}</span>
        <span className={`text-text ${active ? "animate-badge-in" : ""}`}>{pct}%</span>
      </div>
      <div className="motion-progress-track h-[8px] overflow-hidden rounded-full bg-black/5">
        <div
          className={`motion-progress-fill h-full rounded-full ${pct >= 100 ? "bg-lime" : "bg-black"}`}
          data-active={active ? "true" : "false"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 animate-backdrop-in bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92%] w-full animate-slide-up flex-col rounded-t-[24px] bg-white">
        <div className="relative flex shrink-0 items-center justify-between border-b border-border px-4 pb-4 pt-4">
          <div className="absolute left-1/2 top-1 h-1 w-10 -translate-x-1/2 rounded-full bg-black/15" />
          <h2 className="animate-fade-in text-[20px] font-semibold tracking-[-0.02em]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-text-secondary transition hover:bg-border hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
