"use client";

import { Button } from "@/components/ui/Button";
import { JourneyCard, Screen } from "@/components/ui/Screen";
import { usePrototype } from "@/lib/state";

/** Legacy route — My Loan home is Overview with persona tabs. */
export function LandingScreen() {
  const { startLoan, resumeJourney, selectedBank, state, openSheet } = usePrototype();
  const hasProgress = state.loanStatus !== "not_started";

  if (hasProgress) {
    return (
      <Screen
        title="My Loans"
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
    <Screen title="My Loans" illustration="loan-start">
      <JourneyCard
        title="Find the best home loan"
        subtitle="Compare personalized offers from India's leading in 1 minute."
        cta={
          <Button
            onClick={() => {
              startLoan("home");
              openSheet("discover");
            }}
          >
            Find Loan Offers
          </Button>
        }
        secondaryCta={
          <Button
            variant="secondary"
            onClick={() => {
              startLoan("transfer");
              openSheet("discover");
            }}
          >
            Transfer Existing Loan
          </Button>
        }
      />
    </Screen>
  );
}
