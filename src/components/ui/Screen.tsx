"use client";

import { createContext, useContext, type ReactNode } from "react";
import { HumanIllustration, type IllustrationScene } from "@/components/ui/HumanIllustration";

const EmbeddedCtx = createContext(false);
export function useEmbedded() {
  return useContext(EmbeddedCtx);
}
export function EmbeddedProvider({ children }: { children: ReactNode }) {
  return <EmbeddedCtx.Provider value={true}>{children}</EmbeddedCtx.Provider>;
}

export function Screen({
  children,
  title,
  subtitle,
  onBack,
  wide = false,
  illustration,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  wide?: boolean;
  /** Main pages only — ignored inside bottom sheets. */
  illustration?: IllustrationScene;
}) {
  const embedded = useEmbedded();

  if (embedded) {
    return <div className="animate-fade-in motion-stagger space-y-4 pb-1">{children}</div>;
  }

  return (
    <div className={`animate-fade-in mx-auto w-full px-4 pb-8 pt-8 ${wide ? "max-w-lg" : ""}`}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-[16px] font-semibold text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <span aria-hidden>←</span> Back
        </button>
      )}
      {title && (
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-text">{title}</h1>
            {subtitle && <p className="text-[16px] leading-relaxed text-text-secondary">{subtitle}</p>}
          </div>
          {illustration && (
            <HumanIllustration scene={illustration} className="mt-1 animate-float-soft" />
          )}
        </div>
      )}
      <div className="motion-stagger">{children}</div>
    </div>
  );
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base = `app-glass-card rounded-[18px] p-4 ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} w-full text-left transition hover:border-black/25`}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

export function LimeBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-[18px] bg-lime p-4 text-black">
      <p className="text-[20px] font-semibold leading-snug">{title}</p>
      {subtitle && <p className="text-[16px] text-black/70">{subtitle}</p>}
    </div>
  );
}

/** One unit: status + next action + CTA. Prefer this over stacked LimeBanner + Card + Button. */
export function JourneyCard({
  title,
  subtitle,
  eyebrow = "",
  actionTitle,
  actionHint,
  cta,
  secondaryCta,
  onClick,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actionTitle?: string;
  actionHint?: string;
  cta: ReactNode;
  secondaryCta?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[22px] border border-black bg-white app-active-shadow animate-pop-in ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="bg-lime px-4 py-4 text-black animate-success-reveal">
        <p className="text-[20px] font-semibold leading-snug tracking-[-0.02em]">{title}</p>
        {subtitle && <p className="text-[16px] leading-relaxed text-black/65">{subtitle}</p>}
      </div>
      {(actionTitle || cta) && (
        <div className="space-y-4 px-4 py-4" onClick={(e) => e.stopPropagation()}>
          {actionTitle && (
            <div>
              {eyebrow ? (
                <p className="text-[16px] font-semibold uppercase tracking-[0.08em] text-text-muted">{eyebrow}</p>
              ) : null}
              <p className="text-[20px] font-semibold tracking-[-0.01em]">{actionTitle}</p>
              {actionHint && <p className="text-[16px] leading-relaxed text-text-secondary">{actionHint}</p>}
            </div>
          )}
          <div className="space-y-4">
            {cta}
            {secondaryCta}
          </div>
        </div>
      )}
    </div>
  );
}

export function StickyCta({ children }: { children: ReactNode }) {
  const embedded = useEmbedded();
  if (embedded) {
    return <div className="mt-8 space-y-4">{children}</div>;
  }
  return (
    <div className="app-glass sticky bottom-0 z-20 -mx-4 mt-8 border-t border-border/60 px-4 py-4">
      {children}
    </div>
  );
}
