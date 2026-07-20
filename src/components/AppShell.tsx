"use client";

import type { ReactNode } from "react";
import type { NavSection, ScreenId } from "@/lib/types";
import { usePrototype } from "@/lib/state";
import { BottomSheet } from "@/components/ui/Sheet";
import { EmbeddedProvider } from "@/components/ui/Screen";
import { DiscoverScreen } from "@/components/screens/DiscoverScreens";
import { ApplyScreen } from "@/components/screens/ApplyScreens";
import { KycScreen } from "@/components/screens/KycScreens";
import { TrackScreen, VerifyChecklistScreen } from "@/components/screens/LoanHubScreens";
import { StateMachineNav } from "@/components/StateMachineNav";

const sheetTitle: Record<string, string> = {
  discover: "Check eligibility",
  apply: "Add Personal details",
  kyc: "Complete KYC",
  verify: "Verify loan",
  track: "Track loan",
};

function PhoneFrame({ children }: { children: ReactNode }) {
  const { state, goTo, closeSheet } = usePrototype();
  const sheetOpen = !!state.sheet;

  const items: { id: NavSection; label: string; icon: string; screen: ScreenId }[] = [
    { id: "loan", label: "My Loan", icon: "⌂", screen: "overview" },
    { id: "profile", label: "Profile", icon: "☺", screen: "profile" },
    { id: "help", label: "Help", icon: "?", screen: "help" },
  ];

  return (
    <div className="app-canvas relative flex h-[100dvh] w-full flex-col overflow-hidden lg:h-[min(844px,calc(100dvh-3rem))] lg:max-w-[430px] lg:rounded-[28px] lg:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_64px_rgba(0,0,0,0.45)]">
      <a
        href="#main-content"
        className="sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-black focus:px-4 focus:py-1 focus:text-[16px] focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-lime"
      >
        Skip to main content
      </a>
      <header className="app-glass z-30 flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <button
          type="button"
          onClick={() => goTo("overview", "loan")}
          className="rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          aria-label="AAMPAY home"
        >
          <span className="text-[16px] font-semibold tracking-[0.22em] text-text" aria-hidden="true">
            AAM<span className="text-black">PAY</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => goTo("help", "help")}
          aria-label="Notifications"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition hover:bg-black/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 9a6 6 0 0 1 12 0c0 3.2.8 4.6 1.5 5.5.3.4 0 1-.5 1H5c-.5 0-.8-.6-.5-1C5.2 13.6 6 12.2 6 9Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M10 18a2 2 0 0 0 4 0"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <main
          id="main-content"
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent ${
            sheetOpen ? "" : "pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))]"
          }`}
        >
          {children}
        </main>

        {!sheetOpen && (
          <nav
            aria-label="Primary"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-8 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-1"
          >
            <div
              role="presentation"
              className="app-glass-nav pointer-events-auto flex w-fit animate-nav-in items-center gap-1 rounded-full p-1"
            >
              {items.map((item) => {
                const active = state.nav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.screen, item.id)}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                    title={item.label}
                    className={`flex h-9 items-center justify-center gap-1 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      active
                        ? "animate-pop-in bg-lime px-4 text-black"
                        : "min-w-10 px-1 text-text-secondary hover:bg-black/5 hover:text-text active:scale-95"
                    }`}
                  >
                    <span className="text-[20px] leading-none" aria-hidden="true">
                      {item.icon}
                    </span>
                    {active && (
                      <span className="animate-badge-in text-[16px] font-semibold leading-none" aria-hidden="true">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <BottomSheet
          open={sheetOpen}
          title={state.sheet ? sheetTitle[state.sheet] : ""}
          onClose={closeSheet}
        >
          <EmbeddedProvider>
            {state.sheet === "discover" && <DiscoverScreen />}
            {state.sheet === "apply" && <ApplyScreen />}
            {state.sheet === "kyc" && <KycScreen />}
            {state.sheet === "verify" && <VerifyChecklistScreen />}
            {state.sheet === "track" && <TrackScreen />}
          </EmbeddedProvider>
        </BottomSheet>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg lg:bg-[#212121]">
      {/* Desktop-only journey debugger — hidden on mobile & tablet */}
      <div className="hidden min-h-0 w-[min(380px,36vw)] shrink-0 lg:flex lg:flex-col">
        <StateMachineNav />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 items-stretch justify-center overflow-hidden lg:items-center lg:px-4 lg:py-8">
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    </div>
  );
}
