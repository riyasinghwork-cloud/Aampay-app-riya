"use client";

import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/UploadBox";
import { Card, JourneyCard, Screen, StickyCta } from "@/components/ui/Screen";
import { BankLogo, BankLogoStack } from "@/components/ui/BankLogo";
import { ProgressBar } from "@/components/ui/Sheet";
import { TRACK_MILESTONES, BANK_OFFERS, docLabel, progressForLoanStatus, trackMilestoneTitle } from "@/lib/types";
import { usePrototype } from "@/lib/state";

export function VerifyChecklistScreen() {
  const { state, goTo, setVerifyDoc, setField, closeSheet } = usePrototype();
  const entries = Object.entries(state.verifyDocs);
  const allDone = entries.every(([, status]) => status === "accepted" || status === "uploaded" || status === "under_review");
  const bankName = selectedBankName(state.selectedBankId);

  return (
    <Screen
      title="Verify loan"
      subtitle={`Upload pending docs for ${bankName}`}
      onBack={() => goTo("overview")}
    >
      <div className="space-y-4">
        {entries.map(([key, status]) => (
          <button
            key={key}
            type="button"
            onClick={() => setVerifyDoc(key)}
            className="flex w-full items-center justify-between gap-4 rounded-[16px] border border-border bg-white px-4 py-4 text-left hover:border-black"
          >
            <p className="text-[16px] font-semibold">{docLabel(key)}</p>
            <StatusChip status={status} />
          </button>
        ))}
      </div>
      <StickyCta>
        <Button
          disabled={!allDone}
          onClick={() => {
            setField("loanStatus", "track");
            setField("trackStep", 0);
            closeSheet();
          }}
        >
          Submit verification
        </Button>
      </StickyCta>
    </Screen>
  );
}

function selectedBankName(id: string | null) {
  return BANK_OFFERS.find((b) => b.id === id)?.name ?? "your bank";
}

function LoanTrackingPanel({ embedded = false }: { embedded?: boolean }) {
  const { state, advanceTrack, selectedBank } = usePrototype();
  const done = state.trackStep >= 6;
  const currentIndex = Math.min(state.trackStep, TRACK_MILESTONES.length - 1);
  const current = TRACK_MILESTONES[currentIndex];
  const bankName = selectedBank?.name ?? "Bank";
  const amount = selectedBank?.amount ?? state.eligibleAmount;
  const rate = selectedBank?.rate ?? "—";

  const card = done ? (
    <div className="overflow-hidden rounded-[22px] border border-black bg-white app-active-shadow animate-pop-in">
      <div className="bg-lime px-4 py-4 text-black animate-success-reveal">
        <p className="text-[20px] font-semibold leading-snug tracking-[-0.02em]">Loan activated</p>
        <p className="text-[16px] text-black/65">
          {bankName} · {amount} · {rate}
          {state.loanType === "transfer" ? " · Transfer" : ""}
        </p>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="text-[16px] font-semibold uppercase tracking-[0.08em] text-text-muted">Next EMI</p>
          <p className="text-[20px] font-semibold tracking-[-0.02em]">₹1,24,500</p>
          <p className="text-[16px] text-text-secondary">Due 5 Aug 2026 · Autopay on</p>
        </div>
        <Button>Pay EMI</Button>
        <div>
          <p className="text-[16px] leading-relaxed text-text-secondary">
            Pre-pay <span className="font-semibold text-text">₹50,000</span> to save about{" "}
            <span className="font-semibold text-text">₹2.1 L</span> in interest.
          </p>
          <button
            type="button"
            className="text-[16px] font-semibold text-text underline underline-offset-4"
          >
            Make pre-payment
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="overflow-hidden rounded-[22px] border border-black bg-white app-active-shadow animate-pop-in">
      <div className="bg-lime px-4 py-4 text-black animate-success-reveal">
        <p className="text-[20px] font-semibold leading-snug tracking-[-0.02em]">{current.inProgress}</p>
        <p className="text-[16px] text-black/65">
          {bankName} · {amount} · {rate}
          {state.loanType === "transfer" ? " · Transfer" : ""}
        </p>
        <p className="text-[16px] font-normal text-black/55">
          Step {currentIndex + 1} of {TRACK_MILESTONES.length} · {current.duration}
        </p>
      </div>

      <div className="px-4 py-4">
        <ol className="relative motion-stagger">
          {TRACK_MILESTONES.map((step, i) => {
            const isDone = state.trackStep > i;
            const isCurrent = i === state.trackStep;
            const isPending = !isDone && !isCurrent;
            const isLast = i === TRACK_MILESTONES.length - 1;
            const rowState = isDone ? "done" : isCurrent ? "current" : "pending";
            const title = trackMilestoneTitle(step, rowState);

            return (
              <li key={step.completed} className="relative flex gap-4 pb-4 last:pb-0">
                {!isLast && (
                  <span
                    className={`absolute left-4 top-8 bottom-0 w-px ${
                      state.trackStep > i ? "bg-lime" : "bg-border"
                    }`}
                    aria-hidden
                  />
                )}
                <span
                  className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold ${
                    isDone
                      ? "animate-check-pop bg-lime text-black"
                      : isCurrent
                        ? "animate-pulse-ring bg-black text-white ring-2 ring-lime ring-offset-1"
                        : "bg-bg text-text-muted"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-start justify-between gap-1">
                    <p
                      className={`text-[16px] font-semibold leading-snug ${
                        isPending ? "text-text-muted" : "text-text"
                      }`}
                    >
                      {title}
                    </p>
                    <span
                      key={rowState}
                      className={`shrink-0 rounded-full px-[8px] py-1 text-[16px] font-semibold leading-none animate-badge-in ${
                        isDone
                          ? "bg-lime-soft text-text"
                          : isCurrent
                            ? "animate-pulse-soft bg-black text-white"
                            : "bg-bg text-text-muted"
                      }`}
                    >
                      {isDone ? "Done" : isCurrent ? "In progress" : "Pending"}
                    </span>
                  </div>
                  <p
                    className={`text-[16px] leading-snug ${
                      isCurrent ? "text-text-secondary" : "text-text-muted"
                    }`}
                  >
                    {step.duration}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 border-t border-border pt-4">
          <Button onClick={advanceTrack}>Simulate next status</Button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="space-y-4">{card}</div>;
  }

  return card;
}

export function TrackScreen() {
  const { closeSheet } = usePrototype();

  return (
    <Screen title="Track your loan" onBack={() => closeSheet()}>
      <LoanTrackingPanel />
    </Screen>
  );
}

export function TimelineScreen() {
  const { state, goTo, selectedBank } = usePrototype();
  const events = [
    { label: "Loan journey created", show: state.loanStatus !== "not_started" },
    { label: "Eligibility calculated", show: ["offers", "apply", "kyc", "verify", "track", "approved", "disbursed", "active"].includes(state.loanStatus) || state.eligibilityCalculated },
    { label: selectedBank ? `Bank selected — ${selectedBank.name}` : "Bank selected", show: !!state.selectedBankId },
    { label: "Application submitted", show: ["kyc", "verify", "track", "approved", "disbursed", "active"].includes(state.loanStatus) },
    { label: "KYC completed", show: state.kyc.complete },
    { label: "Underwriting started", show: ["verify", "track", "approved", "disbursed", "active"].includes(state.loanStatus) },
    { label: "Verification completed", show: state.trackStep >= 2 },
    { label: "Loan approved", show: state.trackStep >= 3 },
    { label: "Disbursement", show: state.trackStep >= 5 },
    { label: "Active loan", show: state.trackStep >= 6 },
  ].filter((e) => e.show);

  return (
    <Screen title="Timeline" onBack={() => goTo("overview")} illustration="timeline">
      <div className="motion-stagger space-y-4">
        {events.length === 0 ? (
          <Card>
            <p className="text-[16px] text-text-secondary">No events yet.</p>
          </Card>
        ) : (
          events.map((event, i) => (
            <div
              key={event.label}
              className="flex gap-4"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div
                className={`mt-1 h-1 w-1 shrink-0 rounded-full bg-lime ${
                  i === events.length - 1 ? "animate-pulse-soft" : ""
                }`}
              />
              <p className="text-[16px] font-semibold">{event.label}</p>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
}

export function OverviewScreen() {
  const { state, startLoan, openSheet, selectedBank } = usePrototype();
  const started = state.loanStatus !== "not_started";
  const progress = progressForLoanStatus(state.loanStatus, state.kyc.complete);

  const order = ["discover", "offers", "apply", "kyc", "verify", "track", "approved", "disbursed", "active"] as const;
  const idx = (s: string) => order.indexOf(s as (typeof order)[number]);
  const at = idx(state.loanStatus);
  const trackingPhase = at >= idx("track");

  const steps: {
    id: NonNullable<(typeof state)["sheet"]>;
    title: string;
    blurb: string;
    status: "done" | "current" | "locked";
  }[] = [
    {
      id: "discover",
      title: "Check eligibility",
      blurb: "Get bank offers",
      status:
        state.eligibilityCalculated &&
        (state.loanStatus === "offers" || at > idx("offers") || !!state.selectedBankId)
          ? "done"
          : at >= idx("discover")
            ? "current"
            : "locked",
    },
    {
      id: "apply",
      title: "Add Personal details",
      blurb: "Employment & property too",
      status: at >= idx("kyc") ? "done" : state.selectedBankId ? "current" : "locked",
    },
    {
      id: "kyc",
      title: "Complete KYC",
      blurb: "Upload once, reuse later",
      status: state.kyc.complete || at >= idx("verify") ? "done" : at >= idx("kyc") ? "current" : "locked",
    },
    {
      id: "verify",
      title: "Verify loan",
      blurb: "Income & property docs",
      status: at >= idx("track") ? "done" : at >= idx("verify") || state.kyc.complete ? "current" : "locked",
    },
    {
      id: "track",
      title: "Track loan",
      blurb: "Approval to disbursement",
      status: state.loanStatus === "active" ? "done" : at >= idx("track") ? "current" : "locked",
    },
  ];

  if (state.loanStatus === "apply" && state.selectedBankId) {
    steps[1].status = "current";
    steps[2].status = "locked";
  }

  return (
    <Screen title="My Loan" illustration={
      !started
        ? "loan-start"
        : trackingPhase
          ? state.loanStatus === "active" || state.trackStep >= 6
            ? "loan-active"
            : "loan-track"
          : "loan-journey"
    }>
      {!started ? (
        <JourneyCard
          title="Start your home loan"
          subtitle="See bank offers before documents."
          cta={<Button onClick={() => startLoan("home")}>Start Home Loan</Button>}
          secondaryCta={
            <Button variant="secondary" onClick={() => startLoan("transfer")}>
              Transfer Existing Loan
            </Button>
          }
        />
      ) : trackingPhase ? (
        <LoanTrackingPanel embedded />
      ) : (
        <>
          <ProgressBar
            value={progress}
            label={selectedBank ? `${selectedBank.name} journey` : "Your loan journey"}
          />

          <div className="motion-stagger space-y-4">
            {steps.map((step, i) => {
              const locked = step.status === "locked";
              const done = step.status === "done";
              const current = step.status === "current";
              const ctaLabel: Record<string, string> = {
                discover: "See my offers",
                apply: "Continue",
                kyc: "Continue",
                verify: "Upload documents",
                track: "View progress",
              };
              return (
                <div
                  key={step.id}
                  className={`motion-list-item rounded-[18px] border bg-white px-4 py-4 transition ${
                    current
                      ? "animate-active-border border-black app-active-shadow"
                      : done
                        ? "border-border"
                        : "border-border opacity-55"
                  }`}
                >
                  {done && step.id === "discover" ? (
                    <button
                      type="button"
                      onClick={() => openSheet("discover")}
                      className="flex w-full items-start gap-4 text-left"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime text-[16px] font-semibold text-black animate-check-pop">
                        ✓
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold leading-snug">Eligibility</span>
                        <span className="block text-[20px] font-semibold tracking-[-0.02em] text-text">
                          {state.eligibleAmount}
                        </span>
                        {selectedBank ? (
                          <span className="flex items-center gap-1">
                            <span className="text-[16px] text-text-secondary">
                              Proceeding with {selectedBank.name}
                            </span>
                            <BankLogo bankId={selectedBank.id} size="sm" className="ring-2 ring-lime" />
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="text-[16px] text-text-secondary whitespace-nowrap">
                              {BANK_OFFERS.length} bank offers
                            </span>
                            <BankLogoStack banks={BANK_OFFERS} size="sm" />
                          </span>
                        )}
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[20px] font-semibold text-text-muted" aria-hidden>
                        →
                      </span>
                    </button>
                  ) : (
                    <>
                      <div className="flex items-start gap-4">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold ${
                            done
                              ? "animate-check-pop bg-lime text-black"
                              : current
                                ? "animate-pulse-ring bg-black text-white"
                                : "bg-bg text-text-muted"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[16px] font-semibold leading-snug">{step.title}</span>
                          <span className="block text-[16px] text-text-secondary">{step.blurb}</span>
                        </span>
                        {done && (
                          <button
                            type="button"
                            onClick={() => openSheet(step.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center text-[20px] font-semibold text-text-muted"
                            aria-label={`Review ${step.title}`}
                          >
                            →
                          </button>
                        )}
                      </div>
                      {current && (
                        <Button className="mt-4" onClick={() => openSheet(step.id)} disabled={locked}>
                          {ctaLabel[step.id]}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Screen>
  );
}
