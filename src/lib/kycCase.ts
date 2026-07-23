/**
 * KYC Case domain — mirrors Home_Loan_KYC_Complete_State_Machine.md.
 * Parallel lifecycles live on the case; loanStatus stays separate.
 */

export type KycCaseStatus =
  | "draft"
  | "in_progress"
  | "manual_review"
  | "verified"
  | "rejected"
  | "expired"
  | "withdrawn";

export type PanLifecycle =
  | "not_submitted"
  | "submitted"
  | "verifying"
  | "verified"
  | "failed";

export type AadhaarLifecycle =
  | "not_submitted"
  | "otp_sent"
  | "otp_verified"
  | "verified"
  | "failed";

export type ConsentLifecycle = "pending" | "accepted" | "recorded" | "expired";

export type FacePhase =
  | "waiting"
  | "selfie"
  | "liveness"
  | "match"
  | "passed"
  | "failed";

export type VideoPhase =
  | "not_scheduled"
  | "scheduled"
  | "connected"
  | "recording"
  | "review"
  | "approved"
  | "rejected"
  | "interrupted";

export type RiskPhase =
  | "not_started"
  | "running"
  | "low"
  | "medium"
  | "high"
  | "manual_review"
  | "cleared"
  | "rejected";

export type CkycStatus = "not_checked" | "found" | "not_found" | "failed";

export type KycErrorClass =
  | "validation"
  | "business_rule"
  | "third_party"
  | "network"
  | "security"
  | "fraud"
  | "unknown"
  | null;

export type ManualReviewOutcome = "none" | "approved" | "reupload" | "rejected" | "escalated";

export type DocMeta = {
  ocrConfidence?: number;
  blurry?: boolean;
  processing?: boolean;
  reasonCode?: string;
};

export type KycAuditEvent = {
  id: string;
  actor: string;
  event: string;
  fromState: string;
  toState: string;
  timestamp: string;
  reasonCode?: string;
  correlationId?: string;
};

export type KycCaseState = {
  caseStatus: KycCaseStatus;
  caseId: string;
  correlationId: string;
  sessionActive: boolean;
  /** Parallel lifecycles */
  panLifecycle: PanLifecycle;
  aadhaarLifecycle: AadhaarLifecycle;
  consent: ConsentLifecycle;
  face: {
    phase: FacePhase;
    score?: number;
    deepfake?: boolean;
    mismatch?: boolean;
  };
  video: {
    phase: VideoPhase;
    scheduledAt?: string;
  };
  risk: {
    phase: RiskPhase;
    amlClear: boolean;
    sanctionsClear: boolean;
    fraudScore: number;
  };
  ckyc: {
    status: CkycStatus;
    ref?: string;
  };
  manualReview: {
    outcome: ManualReviewOutcome;
    note?: string;
  };
  docMeta: Record<string, DocMeta>;
  /** Seedable Aadhaar OTP for DigiLocker / manual OTP screens */
  aadhaarOtp: string;
  aadhaarOtpExpired: boolean;
  apiOutage: boolean;
  duplicatePan: boolean;
  lastErrorClass: KycErrorClass;
  lastReasonCode: string;
  auditTrail: KycAuditEvent[];
};

export function defaultKycCase(partial?: Partial<KycCaseState>): KycCaseState {
  return {
    caseStatus: "draft",
    caseId: "KYC-DEMO-001",
    correlationId: "corr-demo-001",
    sessionActive: true,
    panLifecycle: "not_submitted",
    aadhaarLifecycle: "not_submitted",
    consent: "pending",
    face: { phase: "waiting" },
    video: { phase: "not_scheduled" },
    risk: {
      phase: "not_started",
      amlClear: false,
      sanctionsClear: false,
      fraudScore: 0,
    },
    ckyc: { status: "not_checked" },
    manualReview: { outcome: "none" },
    docMeta: {},
    aadhaarOtp: "",
    aadhaarOtpExpired: false,
    apiOutage: false,
    duplicatePan: false,
    lastErrorClass: null,
    lastReasonCode: "",
    auditTrail: [],
    ...partial,
  };
}

export function makeAuditEvent(
  actor: string,
  event: string,
  fromState: string,
  toState: string,
  extras?: { reasonCode?: string; correlationId?: string },
): KycAuditEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor,
    event,
    fromState,
    toState,
    timestamp: new Date().toISOString(),
    reasonCode: extras?.reasonCode,
    correlationId: extras?.correlationId,
  };
}

/** Approval guard from comprehensive SM §8 (simulated). */
export function kycApprovalReady(caseState: KycCaseState, docsOk: boolean): boolean {
  return (
    caseState.sessionActive &&
    (caseState.consent === "accepted" || caseState.consent === "recorded") &&
    caseState.panLifecycle === "verified" &&
    caseState.aadhaarLifecycle === "verified" &&
    docsOk &&
    caseState.face.phase === "passed" &&
    caseState.video.phase === "approved" &&
    caseState.risk.amlClear &&
    caseState.risk.sanctionsClear &&
    caseState.risk.fraudScore < 70 &&
    (caseState.risk.phase === "cleared" ||
      caseState.risk.phase === "low" ||
      caseState.manualReview.outcome === "approved")
  );
}
