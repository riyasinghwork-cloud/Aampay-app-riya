"use client";

import { useEffect, useState } from "react";
import { AccordionStep } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { UploadBox, acceptedFormatsForDoc } from "@/components/ui/UploadBox";
import { Screen } from "@/components/ui/Screen";
import { IdentityCheckFlow, type IdItemStatus } from "@/components/screens/IdentityCheckFlow";
import { SelfieCapturePage } from "@/components/screens/SelfieCapturePage";
import { defaultKycCase, docLabel, type DocStatus, type VideoPhase } from "@/lib/types";
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

function videoLabel(phase: VideoPhase): string {
  const map: Record<VideoPhase, string> = {
    not_scheduled: "Not scheduled",
    scheduled: "Scheduled",
    connected: "Connected",
    recording: "Recording",
    review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
    interrupted: "Interrupted",
  };
  return map[phase];
}

function JoinCallTimer({ startedAt }: { startedAt?: string }) {
  const [remaining, setRemaining] = useState(15 * 60);

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const update = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setRemaining(Math.max(0, 15 * 60 - elapsed));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return (
    <span className="font-semibold tabular-nums">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

export function KycScreen() {
  const {
    state,
    goTo,
    setField,
    setKycDoc,
    setKycStep,
    patchKyc: patchKycState,
    patchKycCase,
    withdrawKycCase,
    resumeKycCase,
  } = usePrototype();
  const kyc = state.kyc;
  const kycCase = kyc.case ?? defaultKycCase();
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
  const facePassed = kycCase.face.phase === "passed";
  const videoApproved = kycCase.video.phase === "approved";
  const caseTerminal = ["verified", "rejected", "expired", "withdrawn"].includes(kycCase.caseStatus);

  const applyIdentityStatus = (next: { pan: IdItemStatus; aadhaar: IdItemStatus }) => {
    patchKycState((prev) => ({
      docs: {
        ...prev.docs,
        pan: idStatusToDoc(next.pan),
        aadhaar: idStatusToDoc(next.aadhaar),
      },
      case: {
        ...(prev.case ?? defaultKycCase()),
        panLifecycle:
          next.pan === "verified" ? "verified" : next.pan === "under_review" ? "verifying" : "not_submitted",
        aadhaarLifecycle:
          next.aadhaar === "verified"
            ? "verified"
            : next.aadhaar === "under_review"
              ? "otp_verified"
              : "not_submitted",
        caseStatus: "in_progress",
      },
    }));
  };

  if (kyc.selfieCaptureOpen) {
    return (
      <SelfieCapturePage
        forceOutcome={
          kycCase.face.deepfake ? "deepfake" : kycCase.face.mismatch ? "mismatch" : null
        }
        onBack={() => patchKycState({ selfieCaptureOpen: false })}
        onFacePhase={(phase) => patchKycCase({ face: { ...kycCase.face, phase } })}
        onComplete={(result) => {
          if (result.passed) {
            setKycDoc("selfie", "uploaded");
            patchKycCase({
              face: { phase: "passed", score: result.score, deepfake: false, mismatch: false },
            });
          } else {
            patchKycCase({
              face: {
                phase: "failed",
                score: result.score,
                deepfake: !!result.deepfake,
                mismatch: !!result.mismatch,
              },
              lastErrorClass: result.deepfake ? "fraud" : "validation",
              lastReasonCode: result.deepfake ? "DEEPFAKE" : "FACE_MISMATCH",
            });
          }
          patchKycState({ selfieCaptureOpen: false });
        }}
      />
    );
  }

  return (
    <Screen title="Verify Identity" onBack={() => goTo("overview")}>
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
            onContinue={() => {
              patchKycCase({ consent: "accepted", caseStatus: "in_progress" }, {
                actor: "customer",
                event: "identity.continue",
              });
              setKycStep(2);
            }}
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
            aadhaarOtpExpired={kycCase.aadhaarOtpExpired}
            onAadhaarOtpExpiredChange={(aadhaarOtpExpired) => patchKycCase({ aadhaarOtpExpired })}
            apiOutage={kycCase.apiOutage}
            onApiOutageChange={(apiOutage) => patchKycCase({ apiOutage })}
            duplicatePan={kycCase.duplicatePan}
            onDuplicatePanChange={(duplicatePan) => patchKycCase({ duplicatePan })}
            ckycFound={kycCase.ckyc.status === "found"}
            onCkycAcknowledge={() =>
              patchKycCase({
                ckyc: { status: "found", ref: kycCase.ckyc.ref ?? "CKYC-DEMO" },
                panLifecycle: "verified",
                aadhaarLifecycle: "verified",
              })
            }
            consentExpired={kycCase.consent === "expired"}
            onRenewConsent={() =>
              patchKycCase({
                consent: "accepted",
                lastReasonCode: "",
                lastErrorClass: null,
              })
            }
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
                meta={kycCase.docMeta[key]}
                onClick={() => {
                  if (key === "selfie" && (kyc.docs.selfie ?? "not_started") === "not_started") {
                    patchKycCase({ face: { ...kycCase.face, phase: "selfie" } });
                    patchKycState({ selfieCaptureOpen: true });
                    return;
                  }
                  const meta = kycCase.docMeta[key];
                  if (meta?.processing) {
                    patchKycCase({
                      docMeta: {
                        ...kycCase.docMeta,
                        [key]: { processing: false, ocrConfidence: 0.92, blurry: false },
                      },
                    });
                    setKycDoc(key, "accepted");
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
                    meta={kycCase.docMeta[key]}
                    onClick={() => setKycDoc(key)}
                  />
                ))}
              </div>
            )}

            <Button
              disabled={!requiredUploaded}
              onClick={() => {
                patchKyc(setField, kyc, { identityVerified: true });
                patchKycCase({ caseStatus: "in_progress" });
                setKycStep(5);
              }}
            >
              Continue
            </Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={5}
          title="Face & liveness"
          summary={
            facePassed
              ? "Passed"
              : kycCase.face.phase === "failed"
                ? "Failed — retake"
                : kycCase.face.phase === "waiting"
                  ? "Waiting"
                  : kycCase.face.phase
          }
          open={open === 5}
          onToggle={() => kyc.identityVerified && setKycStep(5)}
          done={facePassed}
          locked={!kyc.identityVerified}
        >
          <div className="space-y-4">
            <p className="text-[16px] text-text-secondary">
              Capture a live selfie, then we run liveness and face-match against your identity photo.
            </p>
            {facePassed ? (
              <>
                <p className="text-[16px] font-semibold text-text">Face verification passed</p>
                <Button onClick={() => setKycStep(6)}>Continue to Video KYC</Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  patchKycCase({ face: { phase: "selfie" } });
                  patchKycState({ selfieCaptureOpen: true });
                }}
              >
                {kycCase.face.phase === "failed" ? "Retake selfie" : "Start face capture"}
              </Button>
            )}
          </div>
        </AccordionStep>

        <AccordionStep
          step={6}
          title="Video KYC"
          summary={videoLabel(kycCase.video.phase)}
          open={open === 6}
          onToggle={() => facePassed && setKycStep(6)}
          done={videoApproved}
          locked={!facePassed}
        >
          <div className="space-y-4">
            {kycCase.video.phase === "scheduled" ? (
              <div className="space-y-1 rounded-[16px] border border-border bg-white p-4">
                <p className="text-[16px] font-semibold">Your Video KYC call has been scheduled</p>
                <p className="text-[16px] text-text-secondary">
                  An agent will be assigned shortly. It can take up to 24 hours to complete the call.
                </p>
              </div>
            ) : kycCase.video.phase === "connected" ? (
              <div className="space-y-1 rounded-[16px] border border-black bg-lime-soft/40 p-4">
                <p className="text-[16px] font-semibold">Your Video KYC call is ready</p>
                <p className="text-[16px] text-text-secondary">
                  Join within <JoinCallTimer startedAt={kycCase.video.scheduledAt} /> before this call expires.
                </p>
              </div>
            ) : (
              <p className="text-[16px] text-text-secondary">
                Schedule a short agent video call to complete your identity verification.
              </p>
            )}
            {kycCase.video.phase === "interrupted" && (
              <p className="rounded-[12px] bg-[#F5E6A8]/50 p-3 text-[16px]">
                Call interrupted — reconnect to resume recording.
              </p>
            )}
            {kycCase.video.phase === "rejected" && (
              <p className="rounded-[12px] bg-[#F8D7D7]/60 p-3 text-[16px]">
                Video KYC rejected — reschedule or escalate to manual review.
              </p>
            )}
            {videoApproved ? (
              <Button onClick={() => setKycStep(7)}>Continue</Button>
            ) : kycCase.video.phase === "scheduled" ? (
              <Button disabled>Join call</Button>
            ) : kycCase.video.phase === "connected" ? (
              <Button
                onClick={() =>
                  patchKycCase({
                    video: { ...kycCase.video, phase: "recording" },
                  })
                }
              >
                Join call
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const ladder: VideoPhase[] = [
                    "not_scheduled",
                    "scheduled",
                    "connected",
                    "recording",
                    "review",
                    "approved",
                  ];
                  const idx = ladder.indexOf(kycCase.video.phase);
                  const next = ladder[Math.min(idx + 1, ladder.length - 1)] ?? "scheduled";
                  patchKycCase({
                    video: {
                      phase: next,
                      scheduledAt: next === "scheduled" ? new Date().toISOString() : kycCase.video.scheduledAt,
                    },
                  });
                }}
              >
                Advance Video KYC
              </Button>
            )}
          </div>
        </AccordionStep>

        <AccordionStep
          step={7}
          title="Address"
          summary={kyc.addressVerified ? "Confirmed" : tab === "nri" ? "Overseas + India" : "India address"}
          open={open === 7}
          onToggle={() => videoApproved && setKycStep(7)}
          done={kyc.addressVerified}
          locked={!videoApproved}
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
                setKycStep(8);
              }}
            >
              Confirm addresses
            </Button>
          </div>
        </AccordionStep>

        <AccordionStep
          step={8}
          title="Risk & outcome"
          summary={
            kycCase.caseStatus === "verified" || kyc.complete
              ? "VERIFIED"
              : kycCase.caseStatus === "rejected"
                ? "REJECTED"
                : kycCase.caseStatus === "expired"
                  ? "EXPIRED"
                  : kycCase.caseStatus === "withdrawn"
                    ? "WITHDRAWN"
                    : kycCase.caseStatus === "manual_review"
                      ? "Manual review"
                      : "Compliance · risk · submit"
          }
          open={open === 8}
          onToggle={() => kyc.addressVerified && setKycStep(8)}
          done={kycCase.caseStatus === "verified" || kyc.complete}
          locked={!kyc.addressVerified}
        >
          {caseTerminal ? (
            <div className="space-y-4 animate-success-reveal">
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[16px] font-semibold ${
                    kycCase.caseStatus === "verified" ? "bg-lime text-black animate-check-pop" : "bg-[#C9A227]"
                  }`}
                >
                  {kycCase.caseStatus === "verified" ? "✓" : "!"}
                </span>
                <p className="text-[16px] font-semibold uppercase">{kycCase.caseStatus}</p>
              </div>
              <p className="text-[16px] text-text-secondary">
                {kycCase.caseStatus === "verified"
                  ? "KYC Case verified. Identity is reusable. Underwriting unlocked."
                  : kycCase.caseStatus === "rejected"
                    ? "KYC Case rejected. Underwriting stays locked."
                    : kycCase.caseStatus === "expired"
                      ? "Session / consent timed out. Resume to continue."
                      : "You withdrew this KYC Case. Start again when ready."}
              </p>
              <ul className="space-y-1 text-[16px] text-text-secondary">
                <li>PAN · {kycCase.panLifecycle}</li>
                <li>Aadhaar · {kycCase.aadhaarLifecycle}</li>
                <li>Face · {kycCase.face.phase}</li>
                <li>Video · {kycCase.video.phase}</li>
                <li>
                  Risk · {kycCase.risk.phase} (fraud {kycCase.risk.fraudScore})
                </li>
              </ul>
              {kycCase.caseStatus === "verified" && (
                <Button
                  onClick={() => {
                    setField("loanStatus", "verify");
                    setField("sheet", null);
                    goTo("overview");
                  }}
                >
                  Continue to loan verification
                </Button>
              )}
              {(kycCase.caseStatus === "expired" || kycCase.caseStatus === "withdrawn") && (
                <Button onClick={resumeKycCase}>Resume KYC</Button>
              )}
              {kycCase.caseStatus === "rejected" && (
                <Button variant="secondary" onClick={() => goTo("overview")}>
                  Back to overview
                </Button>
              )}
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

              <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="text-[14px] underline" onClick={withdrawKycCase}>
                  Withdraw KYC
                </button>
              </div>

              <Button
                onClick={() => {
                  const readyCase = {
                    ...kycCase,
                    caseStatus: "verified" as const,
                    consent: "recorded" as const,
                    sessionActive: true,
                    panLifecycle: "verified" as const,
                    aadhaarLifecycle: "verified" as const,
                    face: { phase: "passed" as const, score: kycCase.face.score ?? 0.94 },
                    video: { phase: "approved" as const },
                    risk: {
                      phase: "cleared" as const,
                      amlClear: true,
                      sanctionsClear: true,
                      fraudScore: kycCase.risk.fraudScore || 12,
                    },
                  };
                  patchKycState({
                    complete: true,
                    identityVerified: true,
                    addressVerified: true,
                    complianceDone: true,
                    case: readyCase,
                  });
                  setField("loanStatus", "kyc");
                  setKycStep(8);
                }}
              >
                Submit KYC Case
              </Button>
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
