"use client";

import { Button } from "@/components/ui/Button";
import { JourneyCard, Screen } from "@/components/ui/Screen";
import { usePrototype } from "@/lib/state";

/** Legacy route — My Loan home is Overview with persona tabs. */
export function LandingScreen() {
  const { startLoan, resumeJourney, selectedBank, state } = usePrototype();
  const hasProgress = state.loanStatus !== "not_started";

  if (hasProgress) {
    return (
      <Screen
        title="My Loan"
        illustration={state.loanStatus === "active" ? "loan-active" : "loan-journey"}
      >
        <JourneyCard
          title={
            state.loanStatus === "active"
              ? "Your loan is active"
              : selectedBank
                ? `${selectedBank.name} in progress`
                : "Your home loan journey"
          }
          cta={<Button onClick={resumeJourney}>Resume my loan</Button>}
        />
      </Screen>
    );
  }

  return (
    <Screen title="My Loan" illustration="loan-start">
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
    </Screen>
  );
}
