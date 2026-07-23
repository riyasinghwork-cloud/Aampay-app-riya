"use client";

import { useState } from "react";
import { AccordionStep } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ChoicePill, Field, Input, Select } from "@/components/ui/Field";
import { Screen } from "@/components/ui/Screen";
import { BankLogo } from "@/components/ui/BankLogo";
import { BANK_OFFERS } from "@/lib/types";
import { usePrototype } from "@/lib/state";

function offersUnlocked(loanStatus: string, searching: boolean) {
  return (
    searching ||
    ["offers", "apply", "kyc", "verify", "track", "approved", "disbursed", "active"].includes(loanStatus)
  );
}

export function DiscoverScreen() {
  const {
    state,
    setField,
    setResidency,
    goTo,
    submitDiscover,
    runOfferSearch,
    toggleShortlist,
    selectBank,
    selectedBank,
    setDiscoverStep,
  } = usePrototype();

  const isTransfer = state.loanType === "transfer";
  const calculated = state.eligibilityCalculated;
  const offersOpen = offersUnlocked(state.loanStatus, state.searchingOffers);
  const openStep = state.discoverStep;

  const [calculating, setCalculating] = useState(false);

  const detailsSummary = [
    state.residency === "resident" ? "Resident" : state.residency === "nri" ? "NRI" : null,
    state.occupation === "salaried" ? "Salaried" : state.occupation === "self_employed" ? "Self-employed" : null,
    state.country || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const handleCalculate = () => {
    setCalculating(true);
    submitDiscover();
    window.setTimeout(() => {
      setCalculating(false);
      // Keep the sheet open and expand Compare bank offers with refreshed results.
      runOfferSearch();
    }, 800);
  };

  const offersSummary = selectedBank?.name ?? (state.shortlist.length ? `${state.shortlist.length} saved` : "HDFC · SBI · ICICI");

  return (
    <Screen
      title={isTransfer ? "Transfer offers" : "Find Loan Offers"}
      onBack={() => goTo("overview")}
    >
      <p className="mb-4 text-[16px] font-semibold uppercase tracking-wide text-text-muted">
        {isTransfer ? "Transfer existing loan" : "New home loan"}
      </p>

      <div className="motion-stagger space-y-4">
        <AccordionStep
          step={1}
          title="Your details"
          summary={detailsSummary || "Resident/NRI, income & property"}
          open={openStep === 1}
          onToggle={() => setDiscoverStep(1)}
          done={calculated}
        >
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-[16px] font-normal text-text-secondary">I am a</p>
              <div className="flex gap-4">
                <ChoicePill selected={state.residency === "resident"} onClick={() => setResidency("resident")}>
                  Resident Indian
                </ChoicePill>
                <ChoicePill selected={state.residency === "nri"} onClick={() => setResidency("nri")}>
                  NRI
                </ChoicePill>
              </div>
            </div>

            <Field label="Country of residence">
              <Select
                value={state.country}
                disabled={state.residency === "resident"}
                onChange={(e) => setField("country", e.target.value)}
              >
                <option>United Arab Emirates</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Singapore</option>
                <option>India</option>
              </Select>
            </Field>

            <Field label={isTransfer ? "Property value / outstanding (₹)" : "Property value (₹)"}>
              <Input
                value={state.propertyValue}
                onChange={(e) => setField("propertyValue", e.target.value)}
                inputMode="numeric"
                placeholder="2,50,00,000"
              />
            </Field>

            <Field label="Annual income (₹)">
              <Input
                value={state.annualIncome}
                onChange={(e) => setField("annualIncome", e.target.value)}
                inputMode="numeric"
                placeholder="48,00,000"
              />
            </Field>

            <div>
              <p className="mb-1 text-[16px] font-normal text-text-secondary">Occupation</p>
              <div className="flex gap-4">
                <ChoicePill
                  selected={state.occupation === "salaried"}
                  onClick={() => setField("occupation", "salaried")}
                >
                  Salaried
                </ChoicePill>
                <ChoicePill
                  selected={state.occupation === "self_employed"}
                  onClick={() => setField("occupation", "self_employed")}
                >
                  Self-employed
                </ChoicePill>
              </div>
            </div>

            <Button onClick={handleCalculate} disabled={calculating}>
              {calculating ? "Finding offers…" : calculated ? "Update details" : "View Bank Offers"}
            </Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={2}
          title="Compare bank offers"
          summary={offersOpen && !state.searchingOffers ? offersSummary : undefined}
          open={openStep === 3}
          onToggle={() => {
            if (offersOpen) setDiscoverStep(3);
          }}
          done={!!selectedBank}
          locked={!offersOpen}
        >
          {state.searchingOffers ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-shimmer rounded-[16px]" />
              ))}
            </div>
          ) : (
            <div className="motion-stagger space-y-4">
              {BANK_OFFERS.map((bank) => {
                const shortlisted = state.shortlist.includes(bank.id);
                return (
                  <div
                    key={bank.id}
                    className={`motion-list-item rounded-[18px] border bg-white p-4 ${
                      state.selectedBankId === bank.id
                        ? "animate-active-border border-black app-active-shadow"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <BankLogo bankId={bank.id} size="md" className="mt-1" />
                        <div className="min-w-0">
                          <p className="text-[16px] font-semibold">{bank.name}</p>
                          <p className="text-[16px] text-text-secondary">{bank.highlight}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleShortlist(bank.id)}
                        className={`shrink-0 rounded-full px-4 py-1 text-[16px] font-semibold ${
                          shortlisted
                            ? "animate-badge-in bg-lime text-black"
                            : "bg-bg text-text-secondary"
                        }`}
                      >
                        {shortlisted ? "Saved" : "Save"}
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-1 text-[16px]">
                      <div>
                        <p className="text-text-muted">Rate</p>
                        <p className="font-semibold">{bank.rate}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Amount</p>
                        <p className="font-semibold">{bank.amount}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Tenure</p>
                        <p className="font-semibold">{bank.tenure}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      <p className="text-[16px] text-text-secondary">
                        Fee {bank.fees} · Digital sanction
                      </p>
                      <Button onClick={() => selectBank(bank.id)}>Apply with {bank.name}</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AccordionStep>
      </div>
    </Screen>
  );
}

/** Deep links for older screen ids — Discover owns the full flow. */
export function EligibilityScreen() {
  return <DiscoverScreen />;
}

export function OffersScreen() {
  return <DiscoverScreen />;
}

export function OfferDetailScreen() {
  return <DiscoverScreen />;
}
