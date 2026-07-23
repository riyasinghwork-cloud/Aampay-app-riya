"use client";

import { AccordionStep } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Screen } from "@/components/ui/Screen";
import { usePrototype } from "@/lib/state";

export function ApplyScreen() {
  const {
    state,
    patchPersonal,
    patchEmployment,
    patchProperty,
    goTo,
    setField,
    closeSheet,
    selectedBank,
    setApplyStep,
  } = usePrototype();

  const open = state.applyStep;
  const personalDone = open > 1;
  const employmentDone = open > 2;
  const propertyDone = open > 3;

  const bank = selectedBank?.name ?? "your bank";
  const name = `${state.personal.firstName} ${state.personal.lastName}`.trim();

  const submit = () => {
    setField("loanStatus", "kyc");
    setField("kycStep", 1);
    closeSheet();
  };

  return (
    <Screen
      title="Complete Application"
      subtitle={`Applying with ${bank}`}
      onBack={() => goTo("discover")}
    >
      <div className="motion-stagger space-y-4">
        <AccordionStep
          step={1}
          title="Personal details"
          summary={personalDone ? name || "Saved" : "Name, email, phone"}
          open={open === 1}
          onToggle={() => setApplyStep(1)}
          done={personalDone}
        >
          <div className="space-y-4">
            <Field label="First name">
              <Input value={state.personal.firstName} onChange={(e) => patchPersonal({ firstName: e.target.value })} />
            </Field>
            <Field label="Last name">
              <Input value={state.personal.lastName} onChange={(e) => patchPersonal({ lastName: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={state.personal.email} onChange={(e) => patchPersonal({ email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={state.personal.phone} onChange={(e) => patchPersonal({ phone: e.target.value })} />
            </Field>
            <Button onClick={() => setApplyStep(2)}>Continue</Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={2}
          title="Employment"
          summary={employmentDone ? state.employment.employer || "Saved" : "Employer & role"}
          open={open === 2}
          onToggle={() => personalDone && setApplyStep(2)}
          done={employmentDone}
          locked={!personalDone}
        >
          <div className="space-y-4">
            <Field label="Employer / Business">
              <Input
                value={state.employment.employer}
                onChange={(e) => patchEmployment({ employer: e.target.value })}
              />
            </Field>
            <Field label="Designation">
              <Input
                value={state.employment.designation}
                onChange={(e) => patchEmployment({ designation: e.target.value })}
              />
            </Field>
            <Field label="Experience">
              <Input
                value={state.employment.experience}
                onChange={(e) => patchEmployment({ experience: e.target.value })}
              />
            </Field>
            <Button onClick={() => setApplyStep(3)}>Continue</Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={3}
          title="Property"
          summary={
            propertyDone
              ? `${state.property.type}, ${state.property.city}`
              : "City, type, stage"
          }
          open={open === 3}
          onToggle={() => employmentDone && setApplyStep(3)}
          done={propertyDone}
          locked={!employmentDone}
        >
          <div className="space-y-4">
            <Field label="City">
              <Input value={state.property.city} onChange={(e) => patchProperty({ city: e.target.value })} />
            </Field>
            <Field label="Property type">
              <Input value={state.property.type} onChange={(e) => patchProperty({ type: e.target.value })} />
            </Field>
            <Field label="Construction stage">
              <Input value={state.property.stage} onChange={(e) => patchProperty({ stage: e.target.value })} />
            </Field>
            <Button onClick={() => setApplyStep(4)}>Review application</Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={4}
          title="Review & submit"
          summary={propertyDone ? `${bank} · ${state.eligibleAmount}` : undefined}
          open={open === 4}
          onToggle={() => propertyDone && setApplyStep(4)}
          done={false}
          locked={!propertyDone}
        >
          <div className="space-y-4 text-[16px]">
            {[
              ["Bank", bank],
              ["Name", name || "—"],
              ["Email", state.personal.email || "—"],
              ["Employer", state.employment.employer || "—"],
              ["Property", `${state.property.type}, ${state.property.city}`],
              ["Amount", state.eligibleAmount],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-text-secondary">{label}</span>
                <span className="text-right font-semibold">{value}</span>
              </div>
            ))}
          </div>
          <Button className="mt-4" onClick={submit}>
            Submit application
          </Button>
        </AccordionStep>
      </div>
    </Screen>
  );
}

export const ApplyPersonalScreen = ApplyScreen;
export const ApplyEmploymentScreen = ApplyScreen;
export const ApplyPropertyScreen = ApplyScreen;
export const ApplyReviewScreen = ApplyScreen;
