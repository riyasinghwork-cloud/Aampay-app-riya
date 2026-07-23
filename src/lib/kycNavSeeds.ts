import { defaultKycCase, type AppState, type KycCaseState } from "@/lib/types";

/** Coherent parallel-lifecycle presets for StateMachineNav deep seeds. */
export function deepKycCase(
  preset:
    | "draft"
    | "identity_in_progress"
    | "docs_ocr"
    | "face_waiting"
    | "face_failed_mismatch"
    | "face_failed_deepfake"
    | "face_passed"
    | "video_scheduled"
    | "video_interrupted"
    | "video_approved"
    | "risk_low"
    | "risk_medium"
    | "risk_sanctions"
    | "manual_review"
    | "verified"
    | "rejected"
    | "expired"
    | "withdrawn"
    | "ckyc_found"
    | "otp_expired"
    | "api_outage"
    | "duplicate_pan"
    | "consent_expired",
  patch?: Partial<KycCaseState>,
): KycCaseState {
  const base = defaultKycCase();

  const presets: Record<string, Partial<KycCaseState>> = {
    draft: { caseStatus: "draft" },
    identity_in_progress: {
      caseStatus: "in_progress",
      consent: "accepted",
      panLifecycle: "verifying",
      aadhaarLifecycle: "otp_sent",
    },
    docs_ocr: {
      caseStatus: "in_progress",
      consent: "accepted",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      docMeta: { aadhaar: { processing: true }, pan: { processing: false, ocrConfidence: 0.55 } },
    },
    face_waiting: {
      caseStatus: "in_progress",
      consent: "accepted",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      face: { phase: "waiting" },
    },
    face_failed_mismatch: {
      caseStatus: "in_progress",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "accepted",
      face: { phase: "failed", score: 0.4, mismatch: true },
      lastErrorClass: "validation",
      lastReasonCode: "FACE_MISMATCH",
    },
    face_failed_deepfake: {
      caseStatus: "in_progress",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "accepted",
      face: { phase: "failed", score: 0.12, deepfake: true },
      lastErrorClass: "fraud",
      lastReasonCode: "DEEPFAKE",
    },
    face_passed: {
      caseStatus: "in_progress",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "accepted",
      face: { phase: "passed", score: 0.94 },
    },
    video_scheduled: {
      caseStatus: "in_progress",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "accepted",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "scheduled", scheduledAt: new Date().toISOString() },
    },
    video_interrupted: {
      caseStatus: "in_progress",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "accepted",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "interrupted" },
    },
    video_approved: {
      caseStatus: "in_progress",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "accepted",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "approved" },
    },
    risk_low: {
      caseStatus: "in_progress",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "recorded",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "approved" },
      risk: { phase: "low", amlClear: true, sanctionsClear: true, fraudScore: 12 },
    },
    risk_medium: {
      caseStatus: "manual_review",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "recorded",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "approved" },
      risk: { phase: "medium", amlClear: true, sanctionsClear: true, fraudScore: 48 },
    },
    risk_sanctions: {
      caseStatus: "rejected",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "recorded",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "approved" },
      risk: { phase: "rejected", amlClear: false, sanctionsClear: false, fraudScore: 95 },
      lastErrorClass: "fraud",
      lastReasonCode: "SANCTIONS_HIT",
    },
    manual_review: {
      caseStatus: "manual_review",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "recorded",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "approved" },
      risk: { phase: "manual_review", amlClear: true, sanctionsClear: true, fraudScore: 70 },
      manualReview: { outcome: "none" },
    },
    verified: {
      caseStatus: "verified",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "recorded",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "approved" },
      risk: { phase: "cleared", amlClear: true, sanctionsClear: true, fraudScore: 10 },
      ckyc: { status: "found", ref: "CKYC-998877" },
    },
    rejected: {
      caseStatus: "rejected",
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "recorded",
      face: { phase: "passed", score: 0.94 },
      video: { phase: "approved" },
      risk: { phase: "rejected", amlClear: true, sanctionsClear: true, fraudScore: 80 },
      manualReview: { outcome: "rejected", note: "REVIEWER_REJECT" },
      lastReasonCode: "REVIEWER_REJECT",
    },
    expired: {
      caseStatus: "expired",
      sessionActive: false,
      consent: "expired",
      lastReasonCode: "SESSION_TIMEOUT",
    },
    withdrawn: {
      caseStatus: "withdrawn",
      lastReasonCode: "CUSTOMER_CANCEL",
    },
    ckyc_found: {
      caseStatus: "in_progress",
      ckyc: { status: "found", ref: "CKYC-112233" },
      panLifecycle: "verified",
      aadhaarLifecycle: "verified",
      consent: "accepted",
    },
    otp_expired: {
      caseStatus: "in_progress",
      aadhaarLifecycle: "otp_sent",
      aadhaarOtpExpired: true,
      lastErrorClass: "validation",
      lastReasonCode: "OTP_EXPIRED",
    },
    api_outage: {
      caseStatus: "in_progress",
      apiOutage: true,
      lastErrorClass: "third_party",
      lastReasonCode: "API_OUTAGE",
    },
    duplicate_pan: {
      caseStatus: "in_progress",
      duplicatePan: true,
      panLifecycle: "failed",
      lastErrorClass: "business_rule",
      lastReasonCode: "DUPLICATE_PAN",
    },
    consent_expired: {
      caseStatus: "in_progress",
      consent: "expired",
      sessionActive: true,
      lastErrorClass: "business_rule",
      lastReasonCode: "CONSENT_EXPIRED",
    },
  };

  return { ...base, ...presets[preset], ...patch };
}

export function mergeKycCase(current: AppState["kyc"]["case"] | undefined, next: Partial<KycCaseState>): KycCaseState {
  return { ...(current ?? defaultKycCase()), ...next };
}
