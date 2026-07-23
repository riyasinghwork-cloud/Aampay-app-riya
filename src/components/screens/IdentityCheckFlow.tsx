"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import type { IdentityPhase } from "@/lib/types";

export type IdItemStatus = "unverified" | "under_review" | "verified";

export type IdentityVerifyStatus = {
  pan: IdItemStatus;
  aadhaar: IdItemStatus;
};

export type { IdentityPhase };

function StatusPill({
  status,
  label,
  badgeOverride,
}: {
  status: IdItemStatus;
  label: string;
  badgeOverride?: string;
}) {
  const meta =
    status === "verified"
      ? {
          icon: "bg-lime text-black",
          iconContent: "✓" as string | null,
          badge: "Verified",
          badgeClass: "text-text",
        }
      : status === "under_review"
        ? {
            icon: "bg-[#F5E6A8] text-text",
            iconContent: "…" as string | null,
            badge: "Under review · 1–3 days",
            badgeClass: "text-text-secondary",
          }
        : {
            icon: "bg-bg text-text-muted",
            iconContent: null as string | null,
            badge: badgeOverride ?? "Unverified",
            badgeClass: "text-text-muted",
          };

  return (
    <div className="flex items-center gap-4">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold ${meta.icon} ${
          status === "verified"
            ? "animate-check-pop"
            : status === "under_review"
              ? "animate-pulse-soft"
              : ""
        }`}
        aria-hidden
      >
        {meta.iconContent === null ? (
          <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
        ) : (
          meta.iconContent
        )}
      </span>
      <span className="min-w-0 flex-1 text-[16px] font-normal">{label}</span>
      <span
        key={`${status}-${meta.badge}`}
        className={`shrink-0 text-[16px] font-semibold animate-badge-in ${meta.badgeClass}`}
      >
        {meta.badge}
      </span>
    </div>
  );
}

/** Always Aadhaar first, then PAN — keep order consistent across all phases. */
function IdentityStatusList({
  aadhaar,
  pan,
  aadhaarLabel = "Aadhaar verification",
  panLabel = "PAN verification",
  panBadgeOverride,
}: {
  aadhaar: IdItemStatus;
  pan: IdItemStatus;
  aadhaarLabel?: string;
  panLabel?: string;
  panBadgeOverride?: string;
}) {
  return (
    <div className="space-y-1">
      <StatusPill status={aadhaar} label={aadhaarLabel} />
      <StatusPill status={pan} label={panLabel} badgeOverride={panBadgeOverride} />
    </div>
  );
}

function DigiLockerMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1A73E8] text-[16px] font-semibold text-white">
      DL
    </div>
  );
}

export function IdentityCheckFlow({
  isNri,
  fullName,
  status,
  onStatusChange,
  onContinue,
  phase,
  onPhaseChange,
  panInDigilocker,
  onPanInDigilockerChange,
  aadhaarInDigilocker,
  onAadhaarInDigilockerChange,
  panInput,
  onPanInputChange,
  consentUidai,
  onConsentUidaiChange,
  consentShare,
  onConsentShareChange,
  nameMismatch,
  aadhaarOtpExpired = false,
  onAadhaarOtpExpiredChange,
  apiOutage = false,
  onApiOutageChange,
  duplicatePan = false,
  onDuplicatePanChange,
  ckycFound = false,
  onCkycAcknowledge,
  consentExpired = false,
  onRenewConsent,
}: {
  isNri: boolean;
  fullName: string;
  status: IdentityVerifyStatus;
  onStatusChange: (next: IdentityVerifyStatus) => void;
  onContinue: () => void;
  phase: IdentityPhase;
  onPhaseChange: (phase: IdentityPhase) => void;
  panInDigilocker: boolean;
  onPanInDigilockerChange: (value: boolean) => void;
  aadhaarInDigilocker: boolean;
  onAadhaarInDigilockerChange: (value: boolean) => void;
  panInput: string;
  onPanInputChange: (value: string) => void;
  consentUidai: boolean;
  onConsentUidaiChange: (value: boolean) => void;
  consentShare: boolean;
  onConsentShareChange: (value: boolean) => void;
  nameMismatch: boolean;
  aadhaarOtpExpired?: boolean;
  onAadhaarOtpExpiredChange?: (value: boolean) => void;
  apiOutage?: boolean;
  onApiOutageChange?: (value: boolean) => void;
  duplicatePan?: boolean;
  onDuplicatePanChange?: (value: boolean) => void;
  ckycFound?: boolean;
  onCkycAcknowledge?: () => void;
  consentExpired?: boolean;
  onRenewConsent?: () => void;
}) {
  const setPhase = onPhaseChange;
  const setPanInDigilocker = onPanInDigilockerChange;
  const setPanInput = onPanInputChange;
  const [aadhaarLast4, setAadhaarLast4] = useState("4281");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (phase !== "digilocker_redirect") return;
    const t = window.setTimeout(() => setPhase("digilocker_consent"), 1400);
    return () => window.clearTimeout(t);
  }, [phase, setPhase]);

  useEffect(() => {
    if (phase !== "digilocker_fetching") return;
    const t = window.setTimeout(() => setPhase("digilocker_results"), 1600);
    return () => window.clearTimeout(t);
  }, [phase, setPhase]);

  if (consentExpired) {
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-[#C9A227] bg-[#F5E6A8]/40 p-4">
          <p className="text-[16px] font-semibold">Consent expired</p>
          <p className="text-[16px] text-text-secondary">
            DigiLocker / e-KYC consent is no longer valid. Renew consent to continue identity verification.
          </p>
        </div>
        <Button
          onClick={() => {
            onRenewConsent?.();
            setPhase("digilocker_consent");
          }}
        >
          Renew consent
        </Button>
        <Button variant="ghost" onClick={() => setPhase("intro")}>
          Back to options
        </Button>
      </div>
    );
  }

  if (phase === "api_outage" || apiOutage) {
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-[#C9A227] bg-[#F5E6A8]/40 p-4">
          <p className="text-[16px] font-semibold">Identity API unavailable</p>
          <p className="text-[16px] text-text-secondary">
            PAN / Aadhaar services are temporarily down. Retry or switch to manual verification.
          </p>
        </div>
        <Button
          onClick={() => {
            onApiOutageChange?.(false);
            setPhase("digilocker_fetching");
          }}
        >
          Retry API
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            onApiOutageChange?.(false);
            setPhase("manual_pan");
          }}
        >
          Manual verification
        </Button>
      </div>
    );
  }

  if (duplicatePan) {
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-[#C9A227] bg-[#F5E6A8]/40 p-4">
          <p className="text-[16px] font-semibold">Duplicate PAN detected</p>
          <p className="text-[16px] text-text-secondary">
            This PAN is already linked to another AAMPAY profile. Contact support or use a different PAN.
          </p>
        </div>
        <Button
          onClick={() => {
            onDuplicatePanChange?.(false);
            setPhase("manual_pan");
          }}
        >
          Enter different PAN
        </Button>
        <Button variant="ghost" onClick={() => setPhase("intro")}>
          Back
        </Button>
      </div>
    );
  }

  if (phase === "ckyc_found" || (ckycFound && phase !== "intro" && phase !== "done")) {
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-black bg-lime-soft/50 p-4 app-active-shadow">
          <p className="text-[16px] font-semibold">Existing CKYC record found</p>
          <p className="text-[16px] text-text-secondary">
            Central KYC registry returned a match. You can reuse verified identity details or continue DigiLocker.
          </p>
        </div>
        <IdentityStatusList aadhaar="verified" pan="verified" />
        <Button
          onClick={() => {
            onCkycAcknowledge?.();
            onStatusChange({ pan: "verified", aadhaar: "verified" });
            setPhase("done");
          }}
        >
          Use CKYC identity
        </Button>
        <Button variant="secondary" onClick={() => setPhase("intro")}>
          Verify again
        </Button>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <p className="text-[16px] text-text-secondary">
          {isNri
            ? "Verify PAN via DigiLocker. Passport & visa uploads stay in the documents step."
            : "Verify PAN and Aadhaar to confirm your identity. DigiLocker is the fastest path — same flow banks use for eKYC."}
        </p>

        <IdentityStatusList aadhaar={status.aadhaar} pan={status.pan} />

        <button
          type="button"
          onClick={() => {
            setPanInDigilocker(false);
            onAadhaarInDigilockerChange(true);
            onConsentUidaiChange(true);
            onConsentShareChange(true);
            setPhase("digilocker_redirect");
          }}
          className="flex w-full items-start gap-4 rounded-[16px] border border-black bg-white p-4 text-left transition hover:bg-lime-soft/30"
        >
          <DigiLockerMark />
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold">Verify with DigiLocker</span>
            <span className="block text-[16px] text-text-secondary">
              Recommended · Instant eKYC · digilocker.gov.in (simulated)
            </span>
          </span>
          <span className="text-[16px] text-text-muted">→</span>
        </button>

        <button
          type="button"
          onClick={() => setPhase("manual_pan")}
          className="flex w-full items-start gap-4 rounded-[16px] border border-border bg-white p-4 text-left hover:border-black"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-bg text-[20px] font-semibold text-text-secondary">
            ✎
          </div>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold">Enter PAN & Aadhaar manually</span>
            <span className="block text-[16px] text-text-secondary">
              Submit details · bank verifies in 1–3 business days
            </span>
          </span>
          <span className="text-[16px] text-text-muted">→</span>
        </button>
      </div>
    );
  }

  if (phase === "digilocker_redirect") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <DigiLockerMark />
        <div>
          <p className="text-[16px] font-semibold">Redirecting to DigiLocker</p>
          <p className="text-[16px] text-text-secondary">digilocker.gov.in · secure session</p>
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-bg motion-progress-indeterminate">
          <span className="bg-[#1A73E8]" />
        </div>
        <p className="text-[16px] text-text-muted">Prototype simulation — no real redirect</p>
      </div>
    );
  }

  if (phase === "digilocker_consent") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <DigiLockerMark />
          <div>
            <p className="text-[16px] font-semibold">DigiLocker consent</p>
            <p className="text-[16px] text-text-secondary">AAMPAY requests access to issued documents</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex gap-4">
            <input
              type="checkbox"
              checked={consentUidai}
              onChange={(e) => onConsentUidaiChange(e.target.checked)}
              className="mt-1 accent-black"
            />
            <span className="text-[16px] leading-snug">
              Share <strong>Aadhaar e-KYC</strong> (name, DOB, address, photo) via UIDAI
            </span>
          </label>
          <label className="flex gap-4">
            <input
              type="checkbox"
              checked={consentShare}
              onChange={(e) => onConsentShareChange(e.target.checked)}
              className="mt-1 accent-black"
            />
            <span className="text-[16px] leading-snug">
              Share <strong>PAN</strong> issued by Income Tax Department with AAMPAY
            </span>
          </label>
        </div>

        <p className="text-[16px] text-text-muted">
          You can revoke access anytime from DigiLocker. AAMPAY will not store your Aadhaar number in full.
        </p>

        <Button
          disabled={!consentShare || !consentUidai}
          onClick={() => setPhase("digilocker_fetching")}
        >
          Allow & continue
        </Button>
        <Button variant="ghost" onClick={() => setPhase("intro")}>
          Cancel
        </Button>
      </div>
    );
  }

  if (phase === "digilocker_fetching") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-[20px] font-semibold text-black animate-pulse-soft">
          …
        </div>
        <div>
          <p className="text-[16px] font-semibold">Fetching from DigiLocker</p>
          <p className="text-[16px] text-text-secondary">Looking up issued documents…</p>
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-bg motion-progress-indeterminate">
          <span className="bg-[#1A73E8]" />
        </div>
        <ul className="w-full space-y-1 text-left text-[16px] text-text-secondary">
          <li className="rounded-[12px] border border-border bg-white px-4 py-1 animate-fade-in">
            UIDAI · Aadhaar e-KYC
          </li>
          <li
            className="rounded-[12px] border border-border bg-white px-4 py-1 animate-fade-in"
            style={{ animationDelay: "120ms" }}
          >
            Income Tax · PAN card
          </li>
        </ul>
      </div>
    );
  }

  if (phase === "digilocker_results") {
    const bothMissing = !aadhaarInDigilocker && !panInDigilocker;
    return (
      <div className="space-y-4">
        <p className="text-[16px] text-text-secondary">Here&apos;s what DigiLocker returned for your account.</p>
        <div className="space-y-1">
          {aadhaarInDigilocker ? (
            <div className="flex items-center gap-1 rounded-[12px] border border-lime bg-lime-soft/40 px-4 py-1 animate-success-reveal">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-[16px] font-semibold text-black animate-check-pop">
                ✓
              </span>
              <span className="flex-1 text-[16px] font-normal">Aadhaar e-KYC</span>
              <span className="text-[16px] font-semibold">Found</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-[12px] border border-border bg-white px-4 py-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
              </span>
              <span className="flex-1 text-[16px] font-normal">Aadhaar e-KYC</span>
              <span className="text-[16px] font-semibold text-text-muted">Not in DigiLocker</span>
            </div>
          )}
          {panInDigilocker ? (
            <div className="flex items-center gap-1 rounded-[12px] border border-lime bg-lime-soft/40 px-4 py-1 animate-success-reveal">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-[16px] font-semibold text-black animate-check-pop">
                ✓
              </span>
              <span className="flex-1 text-[16px] font-normal">PAN card</span>
              <span className="text-[16px] font-semibold">Found</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-[12px] border border-border bg-white px-4 py-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
              </span>
              <span className="flex-1 text-[16px] font-normal">PAN card</span>
              <span className="text-[16px] font-semibold text-text-muted">Not in DigiLocker</span>
            </div>
          )}
        </div>
        <p className="text-[16px] text-text-muted">
          {bothMissing
            ? "Neither document is linked. Continue with manual PAN & Aadhaar entry."
            : !aadhaarInDigilocker
              ? "Aadhaar isn&apos;t in DigiLocker — verify PAN if available, then enter Aadhaar manually."
              : panInDigilocker
                ? "Both documents are available. Confirm PAN, then verify Aadhaar with OTP."
                : "Aadhaar can be verified now. You&apos;ll add PAN manually after — common when PAN isn&apos;t linked to DigiLocker."}
        </p>
        {bothMissing ? (
          <Button onClick={() => setPhase("manual_pan")}>Enter details manually</Button>
        ) : !aadhaarInDigilocker && panInDigilocker ? (
          <Button onClick={() => setPhase("pan_confirm")}>Confirm PAN · then manual Aadhaar</Button>
        ) : panInDigilocker ? (
          <Button onClick={() => setPhase("pan_confirm")}>Continue with PAN & Aadhaar</Button>
        ) : (
          <Button
            onClick={() => {
              setPanInDigilocker(false);
              setPhase("aadhaar_otp");
            }}
          >
            Verify Aadhaar
          </Button>
        )}
        <Button variant="ghost" onClick={() => setPhase("intro")}>
          Cancel
        </Button>
      </div>
    );
  }

  if (phase === "pan_confirm") {
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-black bg-white p-4 app-active-shadow">
          <p className="text-[16px] font-semibold uppercase tracking-wide text-text-muted">PAN from DigiLocker</p>
          <p className="text-[20px] font-semibold tracking-wide">{panInput}</p>
          <p className="text-[16px] text-text-secondary">
            {nameMismatch ? "Rajesh Kumar (as on PAN)" : fullName || "Name as on PAN"}
          </p>
          <p className="text-[16px] text-text-muted">Issued by Income Tax Department · Status: Active</p>
        </div>
        {nameMismatch ? (
          <div className="flex items-start gap-4 text-[16px] text-red-600" role="alert">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[16px] font-semibold leading-none text-white"
              aria-hidden
            >
              !
            </span>
            <p className="min-w-0 leading-snug">
              Name on PAN doesn&apos;t match your application ({fullName || "applicant"}). Confirming may delay bank
              sanction by 1–3 days.
            </p>
          </div>
        ) : (
          <p className="text-[16px] text-text-secondary">
            Confirm this matches your application details. Name mismatch may delay bank sanction.
          </p>
        )}
        <Button
          onClick={() => {
            onStatusChange({ ...status, pan: "verified" });
            setPhase(aadhaarInDigilocker ? "aadhaar_otp" : "manual_aadhaar");
          }}
        >
          {nameMismatch ? "Confirm anyway" : "Confirm PAN"}
        </Button>
        <Button variant="ghost" onClick={() => setPhase("manual_pan")}>
          Enter a different PAN
        </Button>
      </div>
    );
  }

  if (phase === "aadhaar_otp") {
    const otpOk = otp.replace(/\D/g, "").length === 6;
    if (aadhaarOtpExpired) {
      return (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-[#C9A227] bg-[#F5E6A8]/40 p-4">
            <p className="text-[16px] font-semibold">Aadhaar OTP expired</p>
            <p className="text-[16px] text-text-secondary">Request a new OTP to continue e-KYC.</p>
          </div>
          <Button
            onClick={() => {
              onAadhaarOtpExpiredChange?.(false);
              setOtp("");
            }}
          >
            Resend OTP
          </Button>
          <Button variant="ghost" onClick={() => setPhase("digilocker_results")}>
            Back
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-black bg-white p-4 app-active-shadow">
          <p className="text-[16px] font-semibold uppercase tracking-wide text-text-muted">Aadhaar e-KYC</p>
          <p className="text-[16px] font-semibold">XXXX-XXXX-{aadhaarLast4 || "••••"}</p>
          <p className="text-[16px] text-text-secondary">{fullName || "Name as on Aadhaar"}</p>
          <p className="text-[16px] text-text-muted">OTP sent to Aadhaar-linked mobile (simulated)</p>
        </div>
        <Field label="Enter 6-digit Aadhaar OTP">
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </Field>
        <button
          type="button"
          className="text-[16px] font-semibold text-text-secondary underline"
          onClick={() => {
            onAadhaarOtpExpiredChange?.(false);
            setOtp("123456");
          }}
        >
          Resend OTP (demo fills 123456)
        </button>
        <Button
          disabled={!otpOk}
          onClick={() => {
            if (panInDigilocker && status.pan === "verified") {
              onStatusChange({ pan: "verified", aadhaar: "verified" });
              setPhase("done");
            } else {
              onStatusChange({ pan: "unverified", aadhaar: "verified" });
              setPhase("pan_missing");
            }
          }}
        >
          Verify Aadhaar
        </Button>
        <Button
          variant="ghost"
          onClick={() => setPhase(panInDigilocker ? "pan_confirm" : "digilocker_results")}
        >
          Back
        </Button>
      </div>
    );
  }

  if (phase === "pan_missing") {
    return (
      <div className="space-y-4">
        <IdentityStatusList
          aadhaar="verified"
          pan="unverified"
          aadhaarLabel={`Aadhaar · XXXX-XXXX-${aadhaarLast4}`}
          panLabel="PAN verification"
          panBadgeOverride="Not in DigiLocker"
        />
        <p className="text-[16px] text-text-secondary">
          Aadhaar is verified. PAN wasn&apos;t linked in DigiLocker — enter it manually to finish identity
          check.
        </p>
        <Button onClick={() => setPhase("manual_pan")}>Enter PAN manually</Button>
        <Button variant="ghost" onClick={() => setPhase("intro")}>
          Back to options
        </Button>
      </div>
    );
  }

  if (phase === "manual_pan") {
    const panOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panInput.trim());
    const aadhaarAlreadyDone = status.aadhaar === "verified";
    return (
      <div className="space-y-4">
        <p className="text-[16px] text-text-secondary">
          Enter your 10-character PAN. After submission, the bank typically takes{" "}
          <strong className="font-semibold text-text">1–3 business days</strong> to verify.
        </p>
        <IdentityStatusList aadhaar={status.aadhaar} pan={status.pan} />
        <Field label="PAN number">
          <Input
            value={panInput}
            onChange={(e) => setPanInput(e.target.value.toUpperCase().slice(0, 10))}
            placeholder="ABCDE1234F"
            autoCapitalize="characters"
          />
        </Field>
        <Field label="Name as on PAN">
          <Input value={fullName} readOnly />
        </Field>
        <Button
          disabled={!panOk}
          onClick={() => {
            if (aadhaarAlreadyDone) {
              onStatusChange({ pan: "under_review", aadhaar: "verified" });
              setPhase("manual_pending");
            } else {
              onStatusChange({ ...status, pan: "under_review" });
              setPhase("manual_aadhaar");
            }
          }}
        >
          Submit PAN
        </Button>
        <Button
          variant="ghost"
          onClick={() => setPhase(aadhaarAlreadyDone ? "pan_missing" : "intro")}
        >
          Back
        </Button>
      </div>
    );
  }

  if (phase === "manual_aadhaar") {
    const last4Ok = /^\d{4}$/.test(aadhaarLast4);
    const otpOk = otp.replace(/\D/g, "").length === 6;
    return (
      <div className="space-y-4">
        <p className="text-[16px] text-text-secondary">
          Confirm Aadhaar with OTP. Verification is queued with the bank and usually completes in{" "}
          <strong className="font-semibold text-text">1–3 business days</strong>.
        </p>
        <IdentityStatusList aadhaar={status.aadhaar} pan={status.pan} />
        <Field label="Aadhaar last 4 digits">
          <Input
            value={aadhaarLast4}
            onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4281"
            inputMode="numeric"
          />
        </Field>
        <Field label="Aadhaar OTP">
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
          />
        </Field>
        <button
          type="button"
          className="text-[16px] font-semibold text-text-secondary underline"
          onClick={() => setOtp("123456")}
        >
          Resend OTP (demo fills 123456)
        </button>
        <Button
          disabled={!last4Ok || !otpOk}
          onClick={() => {
            onStatusChange({ pan: "under_review", aadhaar: "under_review" });
            setPhase("manual_pending");
          }}
        >
          Submit for verification
        </Button>
        <Button variant="ghost" onClick={() => setPhase("manual_pan")}>
          Back
        </Button>
      </div>
    );
  }

  if (phase === "manual_pending") {
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-black bg-white p-4 app-active-shadow">
          <p className="text-[16px] font-semibold">Verification in progress</p>
          <p className="text-[16px] leading-relaxed text-text-secondary">
            Details were submitted successfully. Manual checks usually take{" "}
            <strong className="font-semibold text-text">1–3 business days</strong>. We&apos;ll notify you when
            verification finishes.
          </p>
        </div>
        <IdentityStatusList
          aadhaar={status.aadhaar === "verified" ? "verified" : "under_review"}
          pan={status.pan === "verified" ? "verified" : "under_review"}
          aadhaarLabel={`Aadhaar · XXXX-XXXX-${aadhaarLast4}`}
          panLabel={`PAN · ${panInput}`}
        />
        <Button variant="secondary" onClick={onContinue}>
          Continue while pending
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onStatusChange({ pan: "unverified", aadhaar: "unverified" });
            setOtp("");
            setPhase("intro");
          }}
        >
          Cancel & start over
        </Button>
      </div>
    );
  }

  // done — no success banner card; status pills only
  return (
    <div className="space-y-4">
      <IdentityStatusList
        aadhaar="verified"
        pan="verified"
        aadhaarLabel={`Aadhaar · XXXX-XXXX-${aadhaarLast4}`}
        panLabel={`PAN · ${panInput}`}
      />
      <Button onClick={onContinue}>Continue</Button>
      <Button
        variant="ghost"
        onClick={() => {
          onStatusChange({ pan: "unverified", aadhaar: "unverified" });
          setOtp("");
          setPanInDigilocker(false);
          setPhase("intro");
        }}
      >
        Re-verify
      </Button>
    </div>
  );
}
