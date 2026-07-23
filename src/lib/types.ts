import type { KycCaseState } from "./kycCase";
import { defaultKycCase } from "./kycCase";

export type Residency = "resident" | "nri" | null;
export type Occupation = "salaried" | "self_employed" | null;
export type LoanType = "home" | "transfer" | null;
export type DocStatus =
  | "not_started"
  | "uploaded"
  | "under_review"
  | "accepted"
  | "rejected"
  | "expired";

/** DigiLocker / manual identity sub-flow phases (KYC step 1). */
export type IdentityPhase =
  | "intro"
  | "digilocker_redirect"
  | "digilocker_consent"
  | "digilocker_fetching"
  | "digilocker_results"
  | "pan_confirm"
  | "aadhaar_otp"
  | "pan_missing"
  | "manual_pan"
  | "manual_aadhaar"
  | "manual_pending"
  | "ckyc_found"
  | "api_outage"
  | "done";

export type {
  KycCaseStatus,
  PanLifecycle,
  AadhaarLifecycle,
  ConsentLifecycle,
  FacePhase,
  VideoPhase,
  RiskPhase,
  CkycStatus,
  KycErrorClass,
  ManualReviewOutcome,
  DocMeta,
  KycAuditEvent,
  KycCaseState,
} from "./kycCase";

export {
  defaultKycCase,
  makeAuditEvent,
  kycApprovalReady,
} from "./kycCase";

export type LoanStatus =
  | "not_started"
  | "discover"
  | "offers"
  | "apply"
  | "kyc"
  | "verify"
  | "track"
  | "approved"
  | "disbursed"
  | "active";

export type ScreenId =
  | "landing"
  | "discover"
  | "eligibility"
  | "offers"
  | "offer_detail"
  | "apply_personal"
  | "apply_employment"
  | "apply_property"
  | "apply_review"
  | "kyc_check"
  | "kyc_mobile"
  | "kyc_email"
  | "kyc_identity_type"
  | "kyc_docs"
  | "kyc_address"
  | "kyc_compliance"
  | "kyc_complete"
  | "verify_checklist"
  | "track"
  | "timeline"
  | "overview"
  | "profile"
  | "help";

export type NavSection = "loan" | "profile" | "help";
export type DemoPersona = "new" | "mid" | "done";
export type JourneySheet = "discover" | "apply" | "kyc" | "verify" | "track" | null;

export type BankOffer = {
  id: string;
  name: string;
  rate: string;
  tenure: string;
  fees: string;
  amount: string;
  highlight: string;
};

export type AppState = {
  screen: ScreenId;
  nav: NavSection;
  loanType: LoanType;
  residency: Residency;
  country: string;
  propertyValue: string;
  annualIncome: string;
  occupation: Occupation;
  eligibleAmount: string;
  eligibilityCalculated: boolean;
  selectedBankId: string | null;
  shortlist: string[];
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  employment: {
    employer: string;
    designation: string;
    experience: string;
  };
  property: {
    city: string;
    type: string;
    stage: string;
  };
  kyc: {
    mobileVerified: boolean;
    emailVerified: boolean;
    identityVerified: boolean;
    addressVerified: boolean;
    complianceDone: boolean;
    complete: boolean;
    docs: Record<string, DocStatus>;
    indiaAddress: string;
    overseasAddress: string;
    taxCountry: string;
    foreignTin: string;
    useForm60: boolean;
    /** DigiLocker / manual identity sub-flow (StateMachineNav-simulatable). */
    identityPhase: IdentityPhase;
    panInDigilocker: boolean;
    aadhaarInDigilocker: boolean;
    digilockerConsentUidai: boolean;
    digilockerConsentPan: boolean;
    /** Draft PAN for manual / DigiLocker confirm screens. */
    identityPanDraft: string;
    /** Show name-mismatch warning on DigiLocker PAN confirm. */
    identityNameMismatch: boolean;
    /** Open live selfie capture instead of UploadBox for selfie. */
    selfieCaptureOpen: boolean;
    emailOtp: string;
    /** Comprehensive KYC Case parallel lifecycles (Home_Loan_KYC_Complete_State_Machine). */
    case: KycCaseState;
  };
  verifyDocs: Record<string, DocStatus>;
  loanStatus: LoanStatus;
  trackStep: number;
  otp: string;
  searchingOffers: boolean;
  demoPersona: DemoPersona;
  sheet: JourneySheet;
  discoverStep: 1 | 2 | 3;
  applyStep: 1 | 2 | 3 | 4;
  /** 1 Identity · 2 Mobile · 3 Email · 4 Docs · 5 Face · 6 Video · 7 Address · 8 Compliance/Risk/Outcome */
  kycStep: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export const BANK_OFFERS: BankOffer[] = [
  {
    id: "hdfc",
    name: "HDFC Bank",
    rate: "8.35%",
    tenure: "Up to 30 yrs",
    fees: "₹10,000 + GST",
    amount: "₹1.85 Cr",
    highlight: "Fastest digital sanction",
  },
  {
    id: "sbi",
    name: "SBI",
    rate: "8.40%",
    tenure: "Up to 30 yrs",
    fees: "₹8,500 + GST",
    amount: "₹1.80 Cr",
    highlight: "Lowest processing fee",
  },
  {
    id: "icici",
    name: "ICICI Bank",
    rate: "8.45%",
    tenure: "Up to 25 yrs",
    fees: "₹12,000 + GST",
    amount: "₹1.78 Cr",
    highlight: "NRI-friendly documentation",
  },
];

export const TRACK_MILESTONES = [
  {
    inProgress: "Application submission",
    completed: "Application submitted",
    duration: "Usually same day",
    statusKey: "track" as const,
  },
  {
    inProgress: "Bank review",
    completed: "Bank review completed",
    duration: "Typically 1–2 business days",
    statusKey: "track" as const,
  },
  {
    inProgress: "Verification",
    completed: "Verification completed",
    duration: "Typically 2–4 business days",
    statusKey: "track" as const,
  },
  {
    inProgress: "Loan approval",
    completed: "Loan approved",
    duration: "Decision in 1–3 business days",
    statusKey: "approved" as const,
  },
  {
    inProgress: "Legal processing",
    completed: "Legal processing completed",
    duration: "Typically 3–7 business days",
    statusKey: "approved" as const,
  },
  {
    inProgress: "Disbursement",
    completed: "Disbursement completed",
    duration: "Usually 1–2 business days after legal",
    statusKey: "disbursed" as const,
  },
  {
    inProgress: "Loan activation in progress",
    completed: "Loan activated",
    duration: "EMI schedule begins",
    statusKey: "active" as const,
  },
] as const;

export function trackMilestoneTitle(
  milestone: (typeof TRACK_MILESTONES)[number],
  state: "done" | "current" | "pending",
): string {
  return state === "done" ? milestone.completed : milestone.inProgress;
}

/** @deprecated Prefer TRACK_MILESTONES — completed labels for simple lists */
export const TRACK_STEPS = TRACK_MILESTONES.map((m) => m.completed);

export const initialState: AppState = {
  screen: "overview",
  nav: "loan",
  loanType: null,
  residency: null,
  country: "United Arab Emirates",
  propertyValue: "2,50,00,000",
  annualIncome: "48,00,000",
  occupation: null,
  eligibleAmount: "₹1.85 Cr",
  eligibilityCalculated: false,
  selectedBankId: null,
  shortlist: [],
  personal: {
    firstName: "Riya",
    lastName: "Mehta",
    email: "riya@email.com",
    phone: "+971 50 123 4567",
  },
  employment: {
    employer: "Acme Global",
    designation: "Product Manager",
    experience: "6 years",
  },
  property: {
    city: "Bengaluru",
    type: "Apartment",
    stage: "Under construction",
  },
  kyc: {
    mobileVerified: false,
    emailVerified: true,
    identityVerified: false,
    addressVerified: false,
    complianceDone: false,
    complete: false,
    docs: {},
    indiaAddress: "12, MG Road, Bengaluru 560001",
    overseasAddress: "Marina Walk, Dubai Marina, UAE",
    taxCountry: "United Arab Emirates",
    foreignTin: "",
    useForm60: false,
    identityPhase: "intro",
    panInDigilocker: false,
    aadhaarInDigilocker: true,
    digilockerConsentUidai: true,
    digilockerConsentPan: true,
    identityPanDraft: "ABCDE1234F",
    identityNameMismatch: false,
    selfieCaptureOpen: false,
    emailOtp: "",
    case: defaultKycCase(),
  },
  verifyDocs: {
    salary_slips: "not_started",
    bank_statements: "not_started",
    property_docs: "not_started",
    credit_consent: "not_started",
  },
  loanStatus: "not_started",
  trackStep: 0,
  otp: "",
  searchingOffers: false,
  demoPersona: "new",
  sheet: null,
  discoverStep: 1,
  applyStep: 1,
  kycStep: 1,
};

export const PERSONA_PRESETS: Record<DemoPersona, AppState> = {
  new: {
    ...initialState,
    screen: "overview",
    nav: "loan",
    demoPersona: "new",
  },
  mid: {
    ...initialState,
    screen: "overview",
    nav: "loan",
    demoPersona: "mid",
    loanType: "home",
    residency: "nri",
    occupation: "salaried",
    eligibilityCalculated: true,
    selectedBankId: "hdfc",
    shortlist: ["hdfc", "sbi"],
    loanStatus: "kyc",
    sheet: null,
    discoverStep: 3,
    applyStep: 4,
    kycStep: 4,
    kyc: {
      mobileVerified: true,
      emailVerified: true,
      identityVerified: false,
      addressVerified: false,
      complianceDone: false,
      complete: false,
      docs: {
        passport: "uploaded",
        visa: "not_started",
        pan: "not_started",
        selfie: "not_started",
        address_proof: "not_started",
        income_proof: "not_started",
      },
      indiaAddress: "12, MG Road, Bengaluru 560001",
      overseasAddress: "Marina Walk, Dubai Marina, UAE",
      taxCountry: "United Arab Emirates",
      foreignTin: "",
      useForm60: false,
      identityPhase: "intro",
      panInDigilocker: false,
      aadhaarInDigilocker: true,
      digilockerConsentUidai: true,
      digilockerConsentPan: true,
      identityPanDraft: "ABCDE1234F",
      identityNameMismatch: false,
      selfieCaptureOpen: false,
      emailOtp: "",
      case: defaultKycCase({
        caseStatus: "in_progress",
        consent: "accepted",
      }),
    },
  },
  done: {
    ...initialState,
    screen: "overview",
    nav: "loan",
    demoPersona: "done",
    loanType: "home",
    residency: "nri",
    occupation: "salaried",
    eligibilityCalculated: true,
    selectedBankId: "hdfc",
    shortlist: ["hdfc"],
    loanStatus: "active",
    trackStep: 6,
    discoverStep: 3,
    applyStep: 4,
    kycStep: 8,
    kyc: {
      mobileVerified: true,
      emailVerified: true,
      identityVerified: true,
      addressVerified: true,
      complianceDone: true,
      complete: true,
      docs: {
        passport: "accepted",
        visa: "accepted",
        pan: "accepted",
        selfie: "accepted",
        address_proof: "accepted",
        income_proof: "accepted",
      },
      indiaAddress: "12, MG Road, Bengaluru 560001",
      overseasAddress: "Marina Walk, Dubai Marina, UAE",
      taxCountry: "United Arab Emirates",
      foreignTin: "AE-TIN-001",
      useForm60: false,
      identityPhase: "done",
      panInDigilocker: true,
      aadhaarInDigilocker: true,
      digilockerConsentUidai: true,
      digilockerConsentPan: true,
      identityPanDraft: "ABCDE1234F",
      identityNameMismatch: false,
      selfieCaptureOpen: false,
      emailOtp: "",
      case: defaultKycCase({
        caseStatus: "verified",
        panLifecycle: "verified",
        aadhaarLifecycle: "verified",
        consent: "recorded",
        face: { phase: "passed", score: 0.94 },
        video: { phase: "approved" },
        risk: {
          phase: "cleared",
          amlClear: true,
          sanctionsClear: true,
          fraudScore: 12,
        },
        ckyc: { status: "found", ref: "CKYC-998877" },
        manualReview: { outcome: "none" },
      }),
    },
    verifyDocs: {
      salary_slips: "accepted",
      bank_statements: "accepted",
      property_docs: "accepted",
      credit_consent: "accepted",
    },
  },
};

/** Journey stays on overview; sheet opens the active step form. */
export function sheetForLoanStatus(status: LoanStatus): JourneySheet {
  switch (status) {
    case "discover":
    case "offers":
      return "discover";
    case "apply":
      return "apply";
    case "kyc":
      return "kyc";
    case "verify":
      return "verify";
    case "track":
    case "approved":
    case "disbursed":
    case "active":
      return "track";
    default:
      return null;
  }
}

export function progressForLoanStatus(status: LoanStatus, kycComplete: boolean): number {
  const map: Record<LoanStatus, number> = {
    not_started: 0,
    discover: 15,
    offers: 30,
    apply: 45,
    kyc: kycComplete ? 70 : 55,
    verify: 80,
    track: 90,
    approved: 95,
    disbursed: 98,
    active: 100,
  };
  return map[status] ?? 0;
}

export function screenForLoanStatus(status: LoanStatus): ScreenId {
  return "overview";
}

export function kycDocKeys(residency: Residency): string[] {
  if (residency === "nri") {
    return ["passport", "visa", "pan", "selfie", "address_proof", "income_proof"];
  }
  return ["aadhaar", "pan", "selfie", "address_proof", "income_proof"];
}

/** Optional NRI uploads — never block Continue. */
export function kycOptionalDocKeys(residency: Residency): string[] {
  if (residency === "nri") return ["oci", "labour_card"];
  return [];
}

export function docLabel(key: string): string {
  const map: Record<string, string> = {
    pan: "PAN card",
    aadhaar: "Aadhaar card",
    selfie: "Live selfie / liveness",
    passport: "Passport",
    visa: "Visa / Residence permit",
    oci: "OCI card (if applicable)",
    labour_card: "Gulf labour / work permit card",
    form60: "Form 60",
    address_proof: "Address proof",
    income_proof: "Income proof",
    salary_slips: "Salary slips (last 3 months)",
    bank_statements: "Bank statements (6 months)",
    property_docs: "Property documents",
    credit_consent: "Credit bureau consent",
  };
  return map[key] ?? key;
}

/** Cosmetic eligibility figure for the prototype (not a real underwriting calc). */
export function mockEligibleAmount(propertyValue: string): string {
  const digits = propertyValue.replace(/\D/g, "");
  const value = Number(digits) || 25_000_000;
  const eligible = Math.round(value * 0.74);
  if (eligible >= 10_000_000) {
    const cr = eligible / 10_000_000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  return `₹${Math.round(eligible / 100_000)} L`;
}

/** Band around the estimate for the eligibility card (prototype). */
export function mockEligibleRange(propertyValue: string): string {
  const digits = propertyValue.replace(/\D/g, "");
  const value = Number(digits) || 25_000_000;
  const mid = Math.round(value * 0.74);
  const low = Math.round(mid * 0.86);
  const high = Math.round(mid * 1.14);
  const fmt = (n: number) => {
    if (n >= 10_000_000) {
      const cr = n / 10_000_000;
      return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
    }
    return `₹${Math.round(n / 100_000)} L`;
  };
  return `Range: ${fmt(low)} – ${fmt(high)} · 6× income multiplier`;
}
