"use client";

import { AccordionStep } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { UploadBox, acceptedFormatsForDoc } from "@/components/ui/UploadBox";
import { Screen } from "@/components/ui/Screen";
import { IdentityCheckFlow, type IdItemStatus } from "@/components/screens/IdentityCheckFlow";
import { SelfieCapturePage } from "@/components/screens/SelfieCapturePage";
import { docLabel, type DocStatus } from "@/lib/types";
import { docSatisfiesKycRequirement, ensureKycDocs, ensureKycOptionalDocs, usePrototype } from "@/lib/state";

function patchKyc(
  setField: ReturnType<typeof usePrototype>["setField"],
  kyc: ReturnType<typeof usePrototype>["state"]["kyc"],
  patch: Partial<ReturnType<typeof usePrototype>["state"]["kyc"]>,
) {
  setField("kyc", { ...kyc, ...patch });
}

function docToIdStatus(status: DocStatus | undefined): IdItemStatus {
  if (status === "uploaded" || status === "accepted") return "verified";
  if (status === "under_review") return "under_review";
  return "unverified";
}

function idStatusToDoc(status: IdItemStatus): DocStatus {
  if (status === "verified") return "uploaded";
  if (status === "under_review") return "under_review";
  return "not_started";
}

export function KycScreen() {
  const { state, goTo, setField, setKycDoc, markKycComplete, setKycStep, patchKyc: patchKycState } =
    usePrototype();
  const kyc = state.kyc;
  const tab: "resident" | "nri" = state.residency === "resident" ? "resident" : "nri";
  const requiredDocs = ensureKycDocs({ ...state, residency: tab });
  const optionalDocs = ensureKycOptionalDocs({ ...state, residency: tab });
  const requiredUploaded = requiredDocs.every((key) => docSatisfiesKycRequirement(kyc.docs[key]));
  const open = state.kycStep;
  const panStatus = docToIdStatus(kyc.docs.pan);
  const aadhaarStatus = docToIdStatus(kyc.docs.aadhaar);
  const identityDone = panStatus === "verified" && aadhaarStatus === "verified";
  const identityPending = panStatus === "under_review" || aadhaarStatus === "under_review";
  const addressReady =
    !!kyc.indiaAddress.trim() && (tab !== "nri" || !!kyc.overseasAddress.trim());

  const applyIdentityStatus = (next: { pan: IdItemStatus; aadhaar: IdItemStatus }) => {
    patchKycState((prev) => ({
      docs: {
        ...prev.docs,
        pan: idStatusToDoc(next.pan),
        aadhaar: idStatusToDoc(next.aadhaar),
      },
    }));
  };

  if (kyc.selfieCaptureOpen) {
    return (
      <SelfieCapturePage
        onBack={() => patchKycState({ selfieCaptureOpen: false })}
        onComplete={() => {
          setKycDoc("selfie", "uploaded");
          patchKycState({ selfieCaptureOpen: false });
        }}
      />
    );
  }

  return (
    <Screen title="Complete KYC" onBack={() => goTo("overview")}>
      <div className="motion-stagger space-y-4">
        <AccordionStep
          step={1}
          title="Identity check"
          summary={
            identityDone
              ? "PAN & Aadhaar verified"
              : panStatus !== "verified" && aadhaarStatus === "verified"
                ? "Aadhaar verified · PAN verification in progress"
                : identityPending
                  ? "Under review · 1–3 days"
                  : tab === "nri"
                    ? "PAN via DigiLocker"
                    : "PAN & Aadhaar"
          }
          open={open === 1}
          onToggle={() => setKycStep(1)}
          done={identityDone || kyc.complete}
          inProgress={aadhaarStatus === "verified" && panStatus !== "verified"}
        >
          <IdentityCheckFlow
            isNri={tab === "nri"}
            fullName={`${state.personal.firstName} ${state.personal.lastName}`.trim()}
            status={{ pan: panStatus, aadhaar: aadhaarStatus }}
            onStatusChange={applyIdentityStatus}
            onContinue={() => setKycStep(2)}
            phase={kyc.identityPhase}
            onPhaseChange={(identityPhase) => patchKycState({ identityPhase })}
            panInDigilocker={kyc.panInDigilocker}
            onPanInDigilockerChange={(panInDigilocker) => patchKycState({ panInDigilocker })}
            aadhaarInDigilocker={kyc.aadhaarInDigilocker}
            onAadhaarInDigilockerChange={(aadhaarInDigilocker) => patchKycState({ aadhaarInDigilocker })}
            panInput={kyc.identityPanDraft}
            onPanInputChange={(identityPanDraft) => patchKycState({ identityPanDraft })}
            consentUidai={kyc.digilockerConsentUidai}
            onConsentUidaiChange={(digilockerConsentUidai) => patchKycState({ digilockerConsentUidai })}
            consentShare={kyc.digilockerConsentPan}
            onConsentShareChange={(digilockerConsentPan) => patchKycState({ digilockerConsentPan })}
            nameMismatch={kyc.identityNameMismatch}
          />
        </AccordionStep>

        <AccordionStep
          step={2}
          title="Mobile"
          summary={kyc.mobileVerified ? "Verified" : state.personal.phone}
          open={open === 2}
          onToggle={() => setKycStep(2)}
          done={kyc.mobileVerified}
        >
          <div className="space-y-4">
            <Field label="Phone">
              <Input value={state.personal.phone} readOnly />
            </Field>
            {kyc.mobileVerified ? (
              <>
                <p className="text-[16px] text-text-secondary">Mobile already verified — OTP skipped.</p>
                <Button onClick={() => setKycStep(3)}>Continue</Button>
              </>
            ) : (
              <>
                <Field label="OTP (any 6 digits)">
                  <Input
                    value={state.otp}
                    onChange={(e) => setField("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                  />
                </Field>
                <Button
                  disabled={state.otp.replace(/\D/g, "").length !== 6}
                  onClick={() => {
                    patchKyc(setField, kyc, { mobileVerified: true });
                    setKycStep(3);
                  }}
                >
                  Verify
                </Button>
              </>
            )}
          </div>
        </AccordionStep>

        <AccordionStep
          step={3}
          title="Email"
          summary={kyc.emailVerified ? "Already verified" : "Verification pending"}
          open={open === 3}
          onToggle={() => kyc.mobileVerified && setKycStep(3)}
          done={kyc.emailVerified}
          locked={!kyc.mobileVerified}
        >
          <div className="space-y-4">
            <p className="text-[16px] text-text-secondary">{state.personal.email}</p>
            {kyc.emailVerified ? (
              <Button onClick={() => setKycStep(4)}>Continue</Button>
            ) : (
              <>
                <Field label="Email OTP (any 6 digits)">
                  <Input
                    value={kyc.emailOtp}
                    onChange={(e) =>
                      patchKycState({ emailOtp: e.target.value.replace(/\D/g, "").slice(0, 6) })
                    }
                    placeholder="654321"
                    inputMode="numeric"
                  />
                </Field>
                <button
                  type="button"
                  className="text-[16px] font-semibold text-text-secondary underline"
                  onClick={() => patchKycState({ emailOtp: "654321" })}
                >
                  Resend OTP (demo fills 654321)
                </button>
                <Button
                  disabled={kyc.emailOtp.replace(/\D/g, "").length !== 6}
                  onClick={() => {
                    patchKycState({ emailVerified: true, emailOtp: "" });
                    setKycStep(4);
                  }}
                >
                  Verify email
                </Button>
              </>
            )}
          </div>
        </AccordionStep>

        <AccordionStep
          step={4}
          title={tab === "resident" ? "Resident documents" : "NRI documents"}
          summary={requiredUploaded ? "Uploaded" : `${requiredDocs.length} required`}
          open={open === 4}
          onToggle={() => kyc.mobileVerified && setKycStep(4)}
          done={requiredUploaded}
          locked={!kyc.mobileVerified}
        >
          <div className="space-y-4">
            {tab === "nri" && (
              <label className="flex items-center gap-4 text-[16px]">
                <input
                  type="checkbox"
                  checked={kyc.useForm60}
                  onChange={(e) => patchKyc(setField, kyc, { useForm60: e.target.checked })}
                  className="accent-black"
                />
                Use Form 60 instead of PAN (OCI / no PAN)
              </label>
            )}

            {requiredDocs.map((key) => (
              <UploadBox
                key={key}
                label={
                  key === "pan" && kyc.useForm60
                    ? "Form 60"
                    : key === "pan" && panStatus === "verified"
                      ? `${docLabel(key)} · DigiLocker`
                      : key === "aadhaar" && aadhaarStatus === "verified"
                        ? `${docLabel(key)} · DigiLocker`
                        : key === "pan" && panStatus === "under_review"
                          ? `${docLabel(key)} · Under review`
                          : key === "aadhaar" && aadhaarStatus === "under_review"
                            ? `${docLabel(key)} · Under review`
                            : docLabel(key)
                }
                status={kyc.docs[key] ?? "not_started"}
                formats={acceptedFormatsForDoc(key)}
                onClick={() => {
                  if (key === "selfie" && (kyc.docs.selfie ?? "not_started") === "not_started") {
                    patchKycState({ selfieCaptureOpen: true });
                    return;
                  }
                  setKycDoc(key);
                }}
              />
            ))}

            {optionalDocs.length > 0 && (
              <div className="space-y-4 pt-1">
                <p className="text-[16px] font-semibold uppercase tracking-wide text-text-muted">Optional</p>
                {optionalDocs.map((key) => (
                  <UploadBox
                    key={key}
                    label={docLabel(key)}
                    status={kyc.docs[key] ?? "not_started"}
                    formats={acceptedFormatsForDoc(key)}
                    onClick={() => setKycDoc(key)}
                  />
                ))}
              </div>
            )}

            <Button
              disabled={!requiredUploaded}
              onClick={() => {
                patchKyc(setField, kyc, { identityVerified: true });
                setKycStep(5);
              }}
            >
              Continue
            </Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={5}
          title="Address"
          summary={kyc.addressVerified ? "Confirmed" : tab === "nri" ? "Overseas + India" : "India address"}
          open={open === 5}
          onToggle={() => kyc.identityVerified && setKycStep(5)}
          done={kyc.addressVerified}
          locked={!kyc.identityVerified}
        >
          <div className="space-y-4">
            {tab === "nri" && (
              <Field label="Overseas address">
                <Input
                  value={kyc.overseasAddress}
                  onChange={(e) => patchKyc(setField, kyc, { overseasAddress: e.target.value })}
                />
              </Field>
            )}
            <Field label="Indian correspondence address">
              <Input
                value={kyc.indiaAddress}
                onChange={(e) => patchKyc(setField, kyc, { indiaAddress: e.target.value })}
              />
            </Field>
            <Button
              disabled={!addressReady}
              onClick={() => {
                patchKyc(setField, kyc, { addressVerified: true });
                setKycStep(6);
              }}
            >
              Confirm addresses
            </Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={6}
          title="Compliance"
          summary={
            kyc.complete
              ? "KYC complete"
              : kyc.complianceDone
                ? "Done"
                : tab === "nri"
                  ? "FATCA / CRS / PEP"
                  : "Tax / PEP / bureau"
          }
          open={open === 6}
          onToggle={() => kyc.addressVerified && setKycStep(6)}
          done={kyc.complianceDone || kyc.complete}
          locked={!kyc.addressVerified}
        >
          {kyc.complete ? (
            <div className="space-y-4 animate-success-reveal">
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-[16px] font-semibold text-black animate-check-pop">
                  ✓
                </span>
                <p className="text-[16px] font-semibold">KYC complete</p>
              </div>
              <p className="text-[16px] text-text-secondary">
                Identity profile is verified and reusable. Continue to loan verification.
              </p>
              <ul className="space-y-1 text-[16px] text-text-secondary">
                <li>Identity · verified</li>
                <li>Mobile · verified</li>
                <li>Email · verified</li>
                <li>Documents · uploaded</li>
                <li>Address · confirmed</li>
                <li>Compliance · submitted</li>
              </ul>
              <Button
                onClick={() => {
                  setField("loanStatus", "verify");
                  setField("sheet", null);
                  goTo("overview");
                }}
              >
                Continue to loan verification
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-4">
                {tab === "nri" ? (
                  <>
                    <label className="flex gap-4">
                      <input type="checkbox" defaultChecked className="mt-1 accent-black" />
                      <span className="text-[16px] leading-snug">
                        I confirm FATCA/CRS tax residency details are accurate
                      </span>
                    </label>
                    <Field label="Country of tax residency">
                      <Input
                        value={kyc.taxCountry}
                        onChange={(e) => patchKyc(setField, kyc, { taxCountry: e.target.value })}
                      />
                    </Field>
                    <Field label="Foreign TIN (optional)">
                      <Input
                        value={kyc.foreignTin}
                        onChange={(e) => patchKyc(setField, kyc, { foreignTin: e.target.value })}
                        placeholder="Tax ID in country of residence"
                      />
                    </Field>
                  </>
                ) : (
                  <label className="flex gap-4">
                    <input type="checkbox" defaultChecked className="mt-1 accent-black" />
                    <span className="text-[16px] leading-snug">I am a tax resident of India</span>
                  </label>
                )}
                <label className="flex gap-4">
                  <input type="checkbox" defaultChecked className="mt-1 accent-black" />
                  <span className="text-[16px] leading-snug">I am not a Politically Exposed Person (PEP)</span>
                </label>
                <label className="flex gap-4">
                  <input type="checkbox" defaultChecked className="mt-1 accent-black" />
                  <span className="text-[16px] leading-snug">I consent to credit bureau checks</span>
                </label>
              </div>
              <Button onClick={markKycComplete}>Submit declarations</Button>
            </>
          )}
        </AccordionStep>
      </div>
    </Screen>
  );
}

export const KycCheckScreen = KycScreen;
export const KycMobileScreen = KycScreen;
export const KycEmailScreen = KycScreen;
export const KycIdentityTypeScreen = KycScreen;
export const KycDocsScreen = KycScreen;
export const KycAddressScreen = KycScreen;
export const KycComplianceScreen = KycScreen;
export const KycCompleteScreen = KycScreen;
