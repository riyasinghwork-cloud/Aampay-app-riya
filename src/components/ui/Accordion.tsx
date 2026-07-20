"use client";

import type { ReactNode } from "react";

export function AccordionStep({
  step,
  title,
  summary,
  open,
  onToggle,
  done = false,
  locked = false,
  inProgress = false,
  children,
}: {
  step: number;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  done?: boolean;
  locked?: boolean;
  /** Show clock icon instead of step number (e.g. verification waiting). */
  inProgress?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border bg-white transition-[border-color,box-shadow,opacity,transform] duration-200 ${
        locked
          ? "border-border opacity-70"
          : open
            ? "border-black app-active-shadow animate-active-border"
            : "border-border motion-list-item"
      }`}
    >
      <button
        type="button"
        disabled={locked}
        onClick={onToggle}
        className="flex w-full items-start gap-4 px-4 py-4 text-left disabled:cursor-not-allowed"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold ${
            done
              ? "animate-check-pop bg-lime text-black"
              : locked
                ? "bg-bg text-text-muted"
                : inProgress
                  ? "animate-pulse-soft bg-black text-white"
                  : open
                    ? "animate-pulse-ring bg-black text-white"
                    : "bg-black text-white"
          }`}
        >
          {done ? (
            <svg className="animate-tick-draw" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : inProgress ? (
            <svg
              className="animate-spin-slow"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" opacity="0.35" />
              <path
                d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            step
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold leading-snug text-text">{title}</span>
          {summary && !open && (
            <span className="block truncate text-[16px] text-text-secondary">{summary}</span>
          )}
          {locked && !summary && (
            <span className="block text-[16px] text-text-muted">Finish the previous step first</span>
          )}
        </span>
        {!locked && (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center text-[16px] text-text-muted transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        )}
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-4 pb-4 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
