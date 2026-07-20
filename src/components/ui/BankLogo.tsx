"use client";

import type { BankOffer } from "@/lib/types";

const sizeClass = {
  sm: "h-6 w-6",
  md: "h-[30px] w-[30px]",
  lg: "h-[33px] w-[33px]",
} as const;

export function BankLogo({
  bankId,
  size = "md",
  className = "",
}: {
  bankId: string;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const box = `${sizeClass[size]} shrink-0 overflow-hidden rounded-full ${className}`;

  if (bankId === "hdfc") {
    return (
      <div className={`${box} bg-[#004C8F]`} aria-hidden title="HDFC Bank">
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <rect x="8" y="8" width="24" height="24" rx="3" fill="#ED1C24" />
          <rect x="12" y="12" width="16" height="16" rx="1.5" fill="#004C8F" />
          <rect x="16" y="16" width="8" height="8" rx="1" fill="#fff" />
        </svg>
      </div>
    );
  }

  if (bankId === "sbi") {
    return (
      <div className={`${box} bg-[#2274B7]`} aria-hidden title="SBI">
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <circle cx="20" cy="20" r="14" fill="#fff" />
          <circle cx="20" cy="20" r="8" fill="none" stroke="#2274B7" strokeWidth="3.5" />
          <circle cx="20" cy="20" r="3.2" fill="#2274B7" />
        </svg>
      </div>
    );
  }

  if (bankId === "icici") {
    return (
      <div className={`${box} bg-[#F37021]`} aria-hidden title="ICICI Bank">
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path
            d="M10 28V12h5.2c4.6 0 7.4 2.2 7.4 5.8 0 2.4-1.3 4.3-3.5 5.2L26 28h-5.4l-5.2-6.6H15V28H10zm5-10.8h1.4c1.8 0 2.9-.8 2.9-2.2S18.2 13 16.4 13H15v4.2z"
            fill="#fff"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${box} flex items-center justify-center bg-black text-[16px] font-semibold text-white`}
      aria-hidden
    >
      {bankId.slice(0, 2).toUpperCase()}
    </div>
  );
}

/** Overlapping / row of partner bank marks. */
export function BankLogoStack({
  banks,
  size = "md",
}: {
  banks: Pick<BankOffer, "id" | "name">[];
  size?: keyof typeof sizeClass;
}) {
  return (
    <div className="flex items-center" role="list" aria-label="Partner banks">
      {banks.map((bank, i) => (
        <div
          key={bank.id}
          role="listitem"
          className="rounded-full ring-2 ring-lime"
          style={{ marginLeft: i === 0 ? 0 : -7 }}
          title={bank.name}
        >
          <BankLogo bankId={bank.id} size={size} />
        </div>
      ))}
    </div>
  );
}
