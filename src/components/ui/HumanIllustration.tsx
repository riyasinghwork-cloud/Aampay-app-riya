"use client";

export type IllustrationScene =
  | "loan-start"
  | "loan-journey"
  | "loan-track"
  | "loan-active"
  | "profile"
  | "help"
  | "timeline";

/** One shared human mark — same figure, scene-specific prop. Small & minimal. */
export function HumanIllustration({
  scene,
  className = "",
}: {
  scene: IllustrationScene;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 72 72"
      width={72}
      height={72}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* Shared person */}
      <circle cx="28" cy="18" r="8" fill="var(--color-lime)" stroke="var(--color-black)" strokeWidth="1.75" />
      <path
        d="M16 52c0-10 5.5-16 12-16s12 6 12 16"
        fill="none"
        stroke="var(--color-black)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M22 36.5c-3 3-5 7-5.5 11M34 36.5c3 3 5 7 5.5 11"
        fill="none"
        stroke="var(--color-black)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {scene === "loan-start" && (
        <g stroke="var(--color-black)" strokeWidth="1.75" fill="none" strokeLinejoin="round">
          <path d="M48 48V34l8-6 8 6v14" />
          <path d="M54 48v-8h4v8" />
          <circle cx="56" cy="28" r="1.5" fill="var(--color-lime)" stroke="none" />
        </g>
      )}

      {scene === "loan-journey" && (
        <g stroke="var(--color-black)" strokeWidth="1.75" fill="none" strokeLinecap="round">
          <path d="M46 28v28" />
          <circle cx="46" cy="28" r="3.5" fill="var(--color-lime)" />
          <circle cx="46" cy="42" r="3.5" fill="var(--color-white)" />
          <circle cx="46" cy="56" r="3.5" fill="var(--color-white)" />
        </g>
      )}

      {scene === "loan-track" && (
        <g stroke="var(--color-black)" strokeWidth="1.75" fill="none" strokeLinecap="round">
          <circle cx="54" cy="34" r="10" />
          <path d="M54 30v5l3 2" />
          <circle cx="54" cy="34" r="1.5" fill="var(--color-lime)" stroke="none" />
        </g>
      )}

      {scene === "loan-active" && (
        <g stroke="var(--color-black)" strokeWidth="1.75" fill="none" strokeLinejoin="round">
          <path d="M46 50l6-10 6 4v14H46z" fill="var(--color-lime-soft)" />
          <path d="M49 58v-6h6v6" />
          <path d="M58 28l4 4M62 28l-4 4" strokeLinecap="round" />
        </g>
      )}

      {scene === "profile" && (
        <g stroke="var(--color-black)" strokeWidth="1.75" fill="none" strokeLinejoin="round">
          <rect x="44" y="28" width="20" height="26" rx="3" fill="var(--color-white)" />
          <circle cx="54" cy="36" r="4" fill="var(--color-lime)" />
          <path d="M48 48h12M50 52h8" strokeLinecap="round" />
        </g>
      )}

      {scene === "help" && (
        <g stroke="var(--color-black)" strokeWidth="1.75" fill="none" strokeLinejoin="round">
          <path
            d="M46 30h18a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H56l-6 6v-6h-4a4 4 0 0 1-4-4V34a4 4 0 0 1 4-4z"
            fill="var(--color-lime-soft)"
          />
          <path d="M54 36c0-2 1.5-3.5 3.5-3.5S61 34 61 36c0 1.5-1 2.2-2.5 3v2" strokeLinecap="round" />
          <circle cx="58.5" cy="44" r="1.2" fill="var(--color-black)" stroke="none" />
        </g>
      )}

      {scene === "timeline" && (
        <g stroke="var(--color-black)" strokeWidth="1.75" fill="none" strokeLinecap="round">
          <path d="M46 24h20v8H46z" fill="var(--color-lime-soft)" strokeLinejoin="round" />
          <path d="M50 22v4M62 22v4" />
          <path d="M46 36h20v24H46z" strokeLinejoin="round" />
          <path d="M50 44h12M50 50h8" />
        </g>
      )}
    </svg>
  );
}
