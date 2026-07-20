"use client";

import { useState, type ReactNode } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Card, Screen } from "@/components/ui/Screen";
import { StatusChip } from "@/components/ui/UploadBox";
import {
  docLabel,
  kycDocKeys,
  kycOptionalDocKeys,
  type DocStatus,
} from "@/lib/types";
import { usePrototype } from "@/lib/state";

function ProfileSection({
  title,
  editing,
  onEdit,
  onDone,
  children,
  editContent,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  children: ReactNode;
  editContent?: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-[16px] font-semibold">{title}</p>
        <button
          type="button"
          onClick={editing ? onDone : onEdit}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-black/5 hover:text-text"
          aria-label={editing ? "Done editing" : "Edit"}
        >
          {editing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M14.5 5.5l4 4M4 20l.9-4.2L15.8 5 19.5 8.7 8.5 19.7 4 20z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      {editing && editContent ? editContent : children}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-1 first:border-t-0 first:pt-0">
      <span className="text-[16px] text-text-muted">{label}</span>
      <span className="max-w-[60%] text-right text-[16px] font-normal text-text">{value || "—"}</span>
    </div>
  );
}

function DocRow({
  label,
  status,
  onCycle,
}: {
  label: string;
  status: DocStatus;
  onCycle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCycle}
      className="flex w-full items-center justify-between gap-4 border-t border-border py-1 text-left first:border-t-0 first:pt-0"
    >
      <span className="text-[16px] font-normal">{label}</span>
      <StatusChip status={status} />
    </button>
  );
}

export function ProfileScreen() {
  const {
    state,
    setField,
    patchPersonal,
    patchEmployment,
    patchProperty,
    patchKyc,
    setKycDoc,
    setVerifyDoc,
    selectedBank,
  } = usePrototype();

  const [editing, setEditing] = useState<string | null>(null);
  const startEdit = (id: string) => setEditing(id);
  const stopEdit = () => setEditing(null);

  const identityKeys = [
    ...kycDocKeys(state.residency),
    ...kycOptionalDocKeys(state.residency),
  ];
  const hasIdentityDocs = Object.keys(state.kyc.docs).length > 0 || state.kyc.complete;
  const hasVerifyDocs = Object.values(state.verifyDocs).some((s) => s !== "not_started");

  return (
    <Screen title="My Profile" illustration="profile">
      <div className="mb-4 animate-pop-in rounded-[18px] border border-border bg-white p-4 motion-list-item">
        <p className="text-[20px] font-semibold">
          {state.personal.firstName} {state.personal.lastName}
        </p>
        <p className="text-[16px] text-text-secondary">
          {state.residency === "nri"
            ? "NRI"
            : state.residency === "resident"
              ? "Resident Indian"
              : "Residency not set"}
          {" · "}
          {state.kyc.complete ? (
            <span className="inline-flex items-center gap-1 font-semibold text-text animate-badge-in">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-lime text-[16px] leading-none text-black animate-check-pop">
                ✓
              </span>
              KYC verified
            </span>
          ) : (
            "KYC not completed"
          )}
        </p>
      </div>

      <div className="motion-stagger space-y-4">
        <ProfileSection
          title="Contact"
          editing={editing === "personal"}
          onEdit={() => startEdit("personal")}
          onDone={stopEdit}
          editContent={
            <div className="space-y-4">
              <Field label="First name">
                <Input
                  value={state.personal.firstName}
                  onChange={(e) => patchPersonal({ firstName: e.target.value })}
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={state.personal.lastName}
                  onChange={(e) => patchPersonal({ lastName: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  value={state.personal.email}
                  onChange={(e) => patchPersonal({ email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={state.personal.phone}
                  onChange={(e) => patchPersonal({ phone: e.target.value })}
                />
              </Field>
            </div>
          }
        >
          <DetailRow label="Email" value={state.personal.email} />
          <DetailRow label="Phone" value={state.personal.phone} />
        </ProfileSection>

        <ProfileSection
          title="Employment"
          editing={editing === "employment"}
          onEdit={() => startEdit("employment")}
          onDone={stopEdit}
          editContent={
            <div className="space-y-4">
              <Field label="Employer">
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
              <Field label="Occupation">
                <Select
                  value={state.occupation ?? ""}
                  onChange={(e) =>
                    setField(
                      "occupation",
                      (e.target.value || null) as typeof state.occupation,
                    )
                  }
                >
                  <option value="">Select</option>
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self-employed</option>
                </Select>
              </Field>
              <Field label="Annual income">
                <Input
                  value={state.annualIncome}
                  onChange={(e) => setField("annualIncome", e.target.value)}
                />
              </Field>
            </div>
          }
        >
          <DetailRow label="Employer" value={state.employment.employer} />
          <DetailRow label="Designation" value={state.employment.designation} />
          <DetailRow label="Experience" value={state.employment.experience} />
          <DetailRow
            label="Occupation"
            value={
              state.occupation === "salaried"
                ? "Salaried"
                : state.occupation === "self_employed"
                  ? "Self-employed"
                  : "—"
            }
          />
          <DetailRow label="Annual income" value={state.annualIncome ? `₹${state.annualIncome}` : "—"} />
        </ProfileSection>

        <ProfileSection
          title="Property"
          editing={editing === "property"}
          onEdit={() => startEdit("property")}
          onDone={stopEdit}
          editContent={
            <div className="space-y-4">
              <Field label="City">
                <Input
                  value={state.property.city}
                  onChange={(e) => patchProperty({ city: e.target.value })}
                />
              </Field>
              <Field label="Type">
                <Input
                  value={state.property.type}
                  onChange={(e) => patchProperty({ type: e.target.value })}
                />
              </Field>
              <Field label="Stage">
                <Input
                  value={state.property.stage}
                  onChange={(e) => patchProperty({ stage: e.target.value })}
                />
              </Field>
              <Field label="Property value">
                <Input
                  value={state.propertyValue}
                  onChange={(e) => setField("propertyValue", e.target.value)}
                />
              </Field>
            </div>
          }
        >
          <DetailRow label="City" value={state.property.city} />
          <DetailRow label="Type" value={state.property.type} />
          <DetailRow label="Stage" value={state.property.stage} />
          <DetailRow
            label="Value"
            value={state.propertyValue ? `₹${state.propertyValue}` : "—"}
          />
        </ProfileSection>

        <ProfileSection
          title="Eligibility & bank"
          editing={editing === "eligibility"}
          onEdit={() => startEdit("eligibility")}
          onDone={stopEdit}
          editContent={
            <div className="space-y-4">
              <Field label="Residency">
                <Select
                  value={state.residency ?? ""}
                  onChange={(e) =>
                    setField(
                      "residency",
                      (e.target.value || null) as typeof state.residency,
                    )
                  }
                >
                  <option value="">Select</option>
                  <option value="resident">Resident Indian</option>
                  <option value="nri">NRI</option>
                </Select>
              </Field>
              <Field label="Country">
                <Input
                  value={state.country}
                  onChange={(e) => setField("country", e.target.value)}
                />
              </Field>
              <Field label="Eligible amount">
                <Input
                  value={state.eligibleAmount}
                  onChange={(e) => setField("eligibleAmount", e.target.value)}
                />
              </Field>
            </div>
          }
        >
          <DetailRow
            label="Residency"
            value={
              state.residency === "nri"
                ? "NRI"
                : state.residency === "resident"
                  ? "Resident Indian"
                  : "—"
            }
          />
          <DetailRow label="Country" value={state.country} />
          <DetailRow label="Eligible amount" value={state.eligibleAmount || "—"} />
          <DetailRow label="Selected bank" value={selectedBank?.name ?? "—"} />
          <DetailRow label="Offer rate" value={selectedBank?.rate ?? "—"} />
        </ProfileSection>

        <ProfileSection
          title="Addresses & tax"
          editing={editing === "address"}
          onEdit={() => startEdit("address")}
          onDone={stopEdit}
          editContent={
            <div className="space-y-4">
              <Field label="India address">
                <Input
                  value={state.kyc.indiaAddress}
                  onChange={(e) => patchKyc({ indiaAddress: e.target.value })}
                />
              </Field>
              {state.residency === "nri" && (
                <>
                  <Field label="Overseas address">
                    <Input
                      value={state.kyc.overseasAddress}
                      onChange={(e) => patchKyc({ overseasAddress: e.target.value })}
                    />
                  </Field>
                  <Field label="Tax country">
                    <Input
                      value={state.kyc.taxCountry}
                      onChange={(e) => patchKyc({ taxCountry: e.target.value })}
                    />
                  </Field>
                  <Field label="Foreign TIN">
                    <Input
                      value={state.kyc.foreignTin}
                      onChange={(e) => patchKyc({ foreignTin: e.target.value })}
                    />
                  </Field>
                </>
              )}
            </div>
          }
        >
          <DetailRow label="India address" value={state.kyc.indiaAddress} />
          {state.residency === "nri" && (
            <>
              <DetailRow label="Overseas address" value={state.kyc.overseasAddress} />
              <DetailRow label="Tax country" value={state.kyc.taxCountry} />
              <DetailRow label="Foreign TIN" value={state.kyc.foreignTin} />
            </>
          )}
          <DetailRow
            label="Mobile"
            value={state.kyc.mobileVerified ? "Verified" : "Not verified"}
          />
          <DetailRow
            label="Email"
            value={state.kyc.emailVerified ? "Verified" : "Not verified"}
          />
        </ProfileSection>

        {(hasIdentityDocs || identityKeys.length > 0) && (
          <Card>
            <p className="mb-1 text-[16px] font-semibold">Identity documents</p>
            {(identityKeys.length
              ? identityKeys
              : Object.keys(state.kyc.docs)
            ).map((key) => (
              <DocRow
                key={key}
                label={docLabel(key)}
                status={state.kyc.docs[key] ?? "not_started"}
                onCycle={() => setKycDoc(key)}
              />
            ))}
          </Card>
        )}

        {(hasVerifyDocs ||
          ["track", "approved", "disbursed", "active", "verify"].includes(state.loanStatus)) && (
          <Card>
            <p className="mb-1 text-[16px] font-semibold">Income & property documents</p>
            {Object.entries(state.verifyDocs).map(([key, status]) => (
              <DocRow
                key={key}
                label={docLabel(key)}
                status={status}
                onCycle={() => setVerifyDoc(key)}
              />
            ))}
          </Card>
        )}

        <Card>
          <p className="text-[16px] font-semibold">Notifications & preferences</p>
        </Card>
      </div>
    </Screen>
  );
}

export function HelpScreen() {
  const { state, goTo } = usePrototype();
  const isNri = state.residency === "nri";
  const isResident = state.residency === "resident";

  const faqs = isNri
    ? [
        "NRI eligibility — salary remittance & FEMA",
        "Passport, visa & OCI document checklist",
        "Overseas address & foreign TIN (FATCA)",
        "Transfer an existing NRI home loan",
      ]
    : isResident
      ? [
          "Resident eligibility — income & LTV",
          "PAN, Aadhaar & selfie checklist",
          "Property documents for Indian cities",
          "Transfer an existing home loan",
        ]
      : [
          "FAQs — eligibility, docs, transfers",
          "Choose residency to see tailored help",
        ];

  return (
    <Screen title="Help & Support" illustration="help">
      <div className="mb-4 animate-fade-in rounded-[18px] border border-border bg-white px-4 py-4">
        <p className="text-[16px] text-text-secondary">
          {isNri
            ? "Support for NRI home loan applicants"
            : isResident
              ? "Support for Resident Indian applicants"
              : "General support — set residency for tailored FAQs"}
        </p>
      </div>
      <div className="motion-stagger space-y-4">
        {faqs.map((title) => (
          <Card key={title}>
            <p className="text-[16px] font-semibold">{title}</p>
          </Card>
        ))}
        <Card>
          <p className="text-[16px] font-semibold">
            {isNri ? "Contact NRI relationship manager" : "Contact relationship manager"}
          </p>
        </Card>
        <Card>
          <p className="text-[16px] font-semibold">Raise support ticket</p>
        </Card>
        <Card
          onClick={() => {
            if (!state.kyc.complete && ["kyc", "apply"].includes(state.loanStatus)) goTo("kyc_check");
            else if (state.loanStatus === "verify") goTo("verify_checklist");
            else goTo("overview");
          }}
        >
          <p className="text-[16px] font-semibold">Bank requested additional documents</p>
        </Card>
      </div>
    </Screen>
  );
}
