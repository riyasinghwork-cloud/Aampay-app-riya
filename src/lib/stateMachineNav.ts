import type {
  AppState,
  DemoPersona,
  DocStatus,
  IdentityPhase,
  JourneySheet,
  LoanStatus,
  LoanType,
  Residency,
} from "@/lib/types";
import { kycDocKeys, kycOptionalDocKeys, TRACK_MILESTONES } from "@/lib/types";

export type SmNavApi = {
  state: AppState;
  goTo: (screen: AppState["screen"], nav?: AppState["nav"]) => void;
  reset: () => void;
  loadPersona: (persona: DemoPersona) => void;
  openSheet: (sheet: JourneySheet) => void;
  closeSheet: () => void;
  setField: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  startLoan: (type: AppState["loanType"]) => void;
  setResidency: (residency: NonNullable<AppState["residency"]>) => void;
  setDiscoverStep: (step: AppState["discoverStep"]) => void;
  setApplyStep: (step: AppState["applyStep"]) => void;
  setKycStep: (step: AppState["kycStep"]) => void;
};

export type SmNode = {
  id: string;
  path: string;
  label: string;
  depth: number;
  parentId?: string;
  specificity: number;
  isActive: (s: AppState) => boolean;
  apply: (api: SmNavApi) => void;
};

type Ctx = {
  residency: NonNullable<Residency>;
  loanType: NonNullable<LoanType>;
};

const TRACKING: LoanStatus[] = ["track", "approved", "disbursed", "active"];

function goLoan(api: SmNavApi) {
  api.goTo("overview", "loan");
}

function openJourneySheet(api: SmNavApi, sheet: NonNullable<JourneySheet>) {
  goLoan(api);
  api.openSheet(sheet);
}

function ensureTracking(api: SmNavApi, trackStep: number) {
  goLoan(api);
  api.closeSheet();
  const status: LoanStatus =
    trackStep >= 6 ? "active" : trackStep >= 5 ? "disbursed" : trackStep >= 3 ? "approved" : "track";
  api.setField("loanStatus", status);
  api.setField("trackStep", trackStep);
  if (trackStep >= 6) api.setField("demoPersona", "done");
}

function matchCtx(s: AppState, ctx: Ctx) {
  return s.residency === ctx.residency && s.loanType === ctx.loanType;
}

/** Ensure residency + loan type before applying a journey action. */
function ensureCtx(api: SmNavApi, ctx: Ctx) {
  if (api.state.residency !== ctx.residency) api.setResidency(ctx.residency);
  if (api.state.loanType !== ctx.loanType) {
    if (api.state.loanStatus === "not_started") {
      api.startLoan(ctx.loanType);
      api.setResidency(ctx.residency);
    } else {
      api.setField("loanType", ctx.loanType);
    }
  }
}

/** Seed mid-journey state for KYC / verify jumps. */
function seedMidJourney(api: SmNavApi, ctx: Ctx, status: "kyc" | "verify") {
  api.loadPersona("mid");
  api.setResidency(ctx.residency);
  api.setField("loanType", ctx.loanType);
  if (status === "verify") {
    api.setField("loanStatus", "verify");
    api.setField("kyc", {
      ...api.state.kyc,
      complete: true,
      identityVerified: true,
      addressVerified: true,
      complianceDone: true,
    });
  }
  api.closeSheet();
}

function node(
  partial: Omit<SmNode, "isActive" | "apply" | "specificity"> & {
    specificity?: number;
    isActive: SmNode["isActive"];
    apply: SmNode["apply"];
  },
): SmNode {
  return { specificity: partial.specificity ?? partial.depth, ...partial };
}

/**
 * One journey tree per loan type.
 * LoanStatus is not a separate branch — each stage IS the status, with sheet
 * sub-steps nested underneath.
 *
 *   Home loan
 *   ├── Start (not_started)
 *   ├── Check eligibility (discover | offers)
 *   ├── Add Personal details (apply)
 *   ├── Complete KYC (kyc)
 *   ├── Verify loan (verify)
 *   └── Track loan (track → active)
 */
function loanBranch(ctx: Ctx, parentId: string, depth: number): SmNode[] {
  const pathRoot = `User.${ctx.residency}.Loan.${ctx.loanType}`;
  const loanId = `${parentId}.loan.${ctx.loanType}`;
  const isNri = ctx.residency === "nri";

  return [
    node({
      id: loanId,
      path: pathRoot,
      label: ctx.loanType === "home" ? "Home loan" : "Transfer loan",
      depth,
      parentId,
      specificity: 8,
      isActive: (s) => matchCtx(s, ctx) && s.nav === "loan" && !s.sheet && s.loanStatus === "not_started",
      apply: (api) => {
        ensureCtx(api, ctx);
        goLoan(api);
        api.closeSheet();
      },
    }),

    ...stageStart(ctx, loanId, depth + 1, pathRoot),
    ...stageEligibility(ctx, loanId, depth + 1, pathRoot),
    ...stageApply(ctx, loanId, depth + 1, pathRoot),
    ...stageKyc(ctx, loanId, depth + 1, pathRoot, isNri),
    ...stageVerify(ctx, loanId, depth + 1, pathRoot),
    ...stageTrack(ctx, loanId, depth + 1, pathRoot),
  ];
}

function stageStart(ctx: Ctx, loanId: string, depth: number, pathRoot: string): SmNode[] {
  const id = `${loanId}.start`;
  return [
    node({
      id,
      path: `${pathRoot}.Journey.start`,
      label: "Start · not_started",
      depth,
      parentId: loanId,
      specificity: 14,
      isActive: (s) =>
        matchCtx(s, ctx) && s.loanStatus === "not_started" && s.nav === "loan" && !s.sheet,
      apply: (api) => {
        api.reset();
        api.setResidency(ctx.residency);
        api.setField("loanType", null);
      },
    }),
    node({
      id: `${id}.action`,
      path: `${pathRoot}.Journey.start.action`,
      label: ctx.loanType === "home" ? "Action: Start Home Loan" : "Action: Transfer Existing Loan",
      depth: depth + 1,
      parentId: id,
      specificity: 4,
      isActive: () => false,
      apply: (api) => {
        api.setResidency(ctx.residency);
        api.startLoan(ctx.loanType);
      },
    }),
  ];
}

function stageEligibility(ctx: Ctx, loanId: string, depth: number, pathRoot: string): SmNode[] {
  const id = `${loanId}.eligibility`;
  return [
    node({
      id,
      path: `${pathRoot}.Journey.eligibility`,
      label: "Check eligibility · discover / offers",
      depth,
      parentId: loanId,
      specificity: 16,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.nav === "loan" &&
        (s.sheet === "discover" ||
          (!s.sheet && (s.loanStatus === "discover" || s.loanStatus === "offers") && !s.selectedBankId)),
      apply: (api) => {
        ensureCtx(api, ctx);
        api.setField("loanStatus", api.state.eligibilityCalculated ? "offers" : "discover");
        openJourneySheet(api, "discover");
      },
    }),
    node({
      id: `${id}.step1`,
      path: `${pathRoot}.Discover.step1_details`,
      label: "1 · Your details",
      depth: depth + 1,
      parentId: id,
      specificity: 24,
      isActive: (s) => matchCtx(s, ctx) && s.sheet === "discover" && s.discoverStep === 1,
      apply: (api) => {
        ensureCtx(api, ctx);
        openJourneySheet(api, "discover");
        api.setDiscoverStep(1);
      },
    }),
    node({
      id: `${id}.step2`,
      path: `${pathRoot}.Discover.step2_eligibility`,
      label: "2 · Your eligibility · discover",
      depth: depth + 1,
      parentId: id,
      specificity: 24,
      isActive: (s) => matchCtx(s, ctx) && s.sheet === "discover" && s.discoverStep === 2,
      apply: (api) => {
        ensureCtx(api, ctx);
        openJourneySheet(api, "discover");
        api.setField("eligibilityCalculated", true);
        api.setField("loanStatus", "discover");
        api.setDiscoverStep(2);
      },
    }),
    node({
      id: `${id}.step3`,
      path: `${pathRoot}.Discover.step3_offers`,
      label: "3 · Compare bank offers · offers",
      depth: depth + 1,
      parentId: id,
      specificity: 24,
      isActive: (s) => matchCtx(s, ctx) && s.sheet === "discover" && s.discoverStep === 3,
      apply: (api) => {
        ensureCtx(api, ctx);
        openJourneySheet(api, "discover");
        api.setField("eligibilityCalculated", true);
        api.setField("loanStatus", "offers");
        api.setDiscoverStep(3);
      },
    }),
    ...(["hdfc", "sbi", "icici"] as const).map((bankId) =>
      node({
        id: `${id}.bank.${bankId}`,
        path: `${pathRoot}.Discover.bank.${bankId}`,
        label: `Bank · ${bankId.toUpperCase()}`,
        depth: depth + 2,
        parentId: `${id}.step3`,
        specificity: 26,
        isActive: (s) =>
          matchCtx(s, ctx) && s.sheet === "discover" && s.discoverStep === 3 && s.selectedBankId === bankId,
        apply: (api) => {
          ensureCtx(api, ctx);
          openJourneySheet(api, "discover");
          api.setField("eligibilityCalculated", true);
          api.setField("loanStatus", "offers");
          api.setDiscoverStep(3);
          api.setField("selectedBankId", bankId);
        },
      }),
    ),
  ];
}

function stageApply(ctx: Ctx, loanId: string, depth: number, pathRoot: string): SmNode[] {
  const id = `${loanId}.apply`;
  const labels = ["1 · Personal details", "2 · Employment", "3 · Property", "4 · Review & submit"] as const;
  return [
    node({
      id,
      path: `${pathRoot}.Journey.apply`,
      label: "Add Personal details · apply",
      depth,
      parentId: loanId,
      specificity: 16,
      isActive: (s) =>
        matchCtx(s, ctx) && s.nav === "loan" && (s.sheet === "apply" || (!s.sheet && s.loanStatus === "apply")),
      apply: (api) => {
        ensureCtx(api, ctx);
        if (!api.state.selectedBankId) api.setField("selectedBankId", "hdfc");
        api.setField("loanStatus", "apply");
        openJourneySheet(api, "apply");
      },
    }),
    ...([1, 2, 3, 4] as const).map((step) =>
      node({
        id: `${id}.step${step}`,
        path: `${pathRoot}.Apply.step${step}`,
        label: labels[step - 1],
        depth: depth + 1,
        parentId: id,
        specificity: 24,
        isActive: (s) => matchCtx(s, ctx) && s.sheet === "apply" && s.applyStep === step,
        apply: (api) => {
          ensureCtx(api, ctx);
          if (!api.state.selectedBankId) api.setField("selectedBankId", "hdfc");
          api.setField("loanStatus", "apply");
          openJourneySheet(api, "apply");
          api.setApplyStep(step);
        },
      }),
    ),
  ];
}

function emptyKycDocs(residency: NonNullable<Residency>): Record<string, DocStatus> {
  const docs: Record<string, DocStatus> = {};
  for (const key of [...kycDocKeys(residency), ...kycOptionalDocKeys(residency)]) {
    docs[key] = "not_started";
  }
  return docs;
}

function seedRequiredDocs(
  residency: NonNullable<Residency>,
  mode:
    | "empty"
    | "partial"
    | "uploaded"
    | "digilocker_linked"
    | "under_review"
    | "optional"
    | "aadhaar_only"
    | "pan_verified_only"
    | "form60"
    | "pan_under_review_aadhaar_ok"
    | "doc_rejected"
    | "doc_expired",
): Record<string, DocStatus> {
  const docs = emptyKycDocs(residency);
  const required = kycDocKeys(residency);
  if (mode === "empty") return docs;
  if (mode === "form60") {
    docs.pan = "uploaded";
    if (docs.passport !== undefined) docs.passport = "uploaded";
    return docs;
  }
  if (mode === "aadhaar_only") {
    docs.aadhaar = "uploaded";
    docs.pan = "not_started";
    return docs;
  }
  if (mode === "pan_verified_only") {
    docs.pan = "uploaded";
    docs.aadhaar = "not_started";
    return docs;
  }
  if (mode === "pan_under_review_aadhaar_ok") {
    docs.aadhaar = "uploaded";
    docs.pan = "under_review";
    return docs;
  }
  if (mode === "doc_rejected") {
    for (const key of required) docs[key] = "uploaded";
    const target = required.includes("pan") ? "pan" : required[0];
    if (target) docs[target] = "rejected";
    return docs;
  }
  if (mode === "doc_expired") {
    for (const key of required) docs[key] = "uploaded";
    const target = required.includes("visa")
      ? "visa"
      : required.includes("aadhaar")
        ? "aadhaar"
        : required[0];
    if (target) docs[target] = "expired";
    return docs;
  }
  if (mode === "partial") {
    if (required[0]) docs[required[0]] = "uploaded";
    return docs;
  }
  if (mode === "uploaded" || mode === "optional") {
    for (const key of required) docs[key] = "uploaded";
    if (mode === "optional") {
      for (const key of kycOptionalDocKeys(residency)) docs[key] = "uploaded";
    }
    return docs;
  }
  if (mode === "digilocker_linked") {
    for (const key of required) docs[key] = "uploaded";
    docs.pan = "uploaded";
    docs.aadhaar = "uploaded";
    return docs;
  }
  // under_review
  for (const key of required) docs[key] = "not_started";
  docs.pan = "under_review";
  docs.aadhaar = "under_review";
  return docs;
}

type KycEdgeSeed = {
  step: AppState["kycStep"];
  identityPhase?: IdentityPhase;
  panInDigilocker?: boolean;
  aadhaarInDigilocker?: boolean;
  digilockerConsentUidai?: boolean;
  digilockerConsentPan?: boolean;
  identityPanDraft?: string;
  identityNameMismatch?: boolean;
  selfieCaptureOpen?: boolean;
  emailOtp?: string;
  foreignTin?: string;
  docsMode?:
    | "empty"
    | "partial"
    | "uploaded"
    | "digilocker_linked"
    | "under_review"
    | "optional"
    | "aadhaar_only"
    | "pan_verified_only"
    | "form60"
    | "pan_under_review_aadhaar_ok"
    | "doc_rejected"
    | "doc_expired";
  docsPatch?: Record<string, DocStatus>;
  useForm60?: boolean;
  mobileVerified?: boolean;
  emailVerified?: boolean;
  identityVerified?: boolean;
  addressVerified?: boolean;
  complianceDone?: boolean;
  complete?: boolean;
  otp?: string;
  indiaAddress?: string;
  overseasAddress?: string;
  loanStatus?: LoanStatus;
};

function openKycEdge(api: SmNavApi, ctx: Ctx, seed: KycEdgeSeed) {
  ensureCtx(api, ctx);
  const residency = ctx.residency;
  const step = seed.step;
  let docs =
    seed.docsMode != null
      ? seedRequiredDocs(residency, seed.docsMode)
      : { ...emptyKycDocs(residency), ...api.state.kyc.docs };
  if (seed.docsPatch) docs = { ...docs, ...seed.docsPatch };

  let mobileVerified = seed.mobileVerified;
  if (mobileVerified === undefined) {
    mobileVerified = step >= 3;
  }
  if (step === 2 && seed.mobileVerified === undefined) {
    mobileVerified = false;
  }

  const kyc: AppState["kyc"] = {
    ...api.state.kyc,
    docs,
    mobileVerified,
    emailVerified: seed.emailVerified ?? (step >= 3 ? seed.emailVerified !== false : true),
    identityVerified: seed.identityVerified ?? step >= 5,
    addressVerified: seed.addressVerified ?? step >= 6,
    complianceDone: seed.complianceDone ?? false,
    complete: seed.complete ?? false,
    useForm60: seed.useForm60 ?? false,
    identityPhase: seed.identityPhase ?? (step === 1 ? "intro" : api.state.kyc.identityPhase),
    panInDigilocker: seed.panInDigilocker ?? false,
    aadhaarInDigilocker: seed.aadhaarInDigilocker ?? true,
    digilockerConsentUidai: seed.digilockerConsentUidai ?? true,
    digilockerConsentPan: seed.digilockerConsentPan ?? true,
    identityPanDraft: seed.identityPanDraft ?? "ABCDE1234F",
    identityNameMismatch: seed.identityNameMismatch ?? false,
    selfieCaptureOpen: seed.selfieCaptureOpen ?? false,
    emailOtp: seed.emailOtp ?? "",
    foreignTin:
      seed.foreignTin !== undefined
        ? seed.foreignTin
        : residency === "nri"
          ? api.state.kyc.foreignTin
          : "",
    indiaAddress:
      seed.indiaAddress !== undefined ? seed.indiaAddress : api.state.kyc.indiaAddress || "12, MG Road, Bengaluru 560001",
    overseasAddress:
      seed.overseasAddress !== undefined
        ? seed.overseasAddress
        : residency === "nri"
          ? api.state.kyc.overseasAddress || "Marina Walk, Dubai Marina, UAE"
          : "",
  };

  if (seed.emailVerified !== undefined) kyc.emailVerified = seed.emailVerified;

  if (!api.state.selectedBankId) api.setField("selectedBankId", "hdfc");
  api.setField("loanStatus", seed.loanStatus ?? "kyc");
  if (seed.otp !== undefined) {
    api.setField("otp", seed.otp);
  } else if (step === 2 && !mobileVerified) {
    api.setField("otp", "");
  }
  api.setField("kyc", kyc);
  openJourneySheet(api, "kyc");
  api.setKycStep(step);
}

function stageKyc(
  ctx: Ctx,
  loanId: string,
  depth: number,
  pathRoot: string,
  isNri: boolean,
): SmNode[] {
  const id = `${loanId}.kyc`;
  const labels: Record<number, string> = {
    1: "1 · Identity check",
    2: "2 · Mobile",
    3: "3 · Email",
    4: isNri ? "4 · NRI documents" : "4 · Resident documents",
    5: "5 · Address",
    6: "6 · Compliance",
  };

  const step1 = `${id}.step1`;
  const step2 = `${id}.step2`;
  const step3 = `${id}.step3`;
  const step4 = `${id}.step4`;
  const step5 = `${id}.step5`;
  const step6 = `${id}.step6`;

  const identityLeaf = (
    key: string,
    label: string,
    pathSuffix: string,
    seed: KycEdgeSeed,
    isActiveExtra: (s: AppState) => boolean,
  ): SmNode =>
    node({
      id: `${step1}.${key}`,
      path: `${pathRoot}.KYC.step1.${pathSuffix}`,
      label,
      depth: depth + 2,
      parentId: step1,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 1 && isActiveExtra(s),
      apply: (api) => openKycEdge(api, ctx, { ...seed, step: 1 }),
    });

  const nodes: SmNode[] = [
    node({
      id,
      path: `${pathRoot}.Journey.kyc`,
      label: "Complete KYC · kyc",
      depth,
      parentId: loanId,
      specificity: 16,
      isActive: (s) =>
        matchCtx(s, ctx) && s.nav === "loan" && (s.sheet === "kyc" || (!s.sheet && s.loanStatus === "kyc")),
      apply: (api) => {
        ensureCtx(api, ctx);
        if (api.state.loanStatus === "not_started" || api.state.loanStatus === "discover") {
          seedMidJourney(api, ctx, "kyc");
        } else {
          api.setField("loanStatus", "kyc");
        }
        openJourneySheet(api, "kyc");
      },
    }),
    ...([1, 2, 3, 4, 5, 6] as const).map((step) =>
      node({
        id: `${id}.step${step}`,
        path: `${pathRoot}.KYC.step${step}`,
        label: labels[step],
        depth: depth + 1,
        parentId: id,
        specificity: 24,
        isActive: (s) => matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === step,
        apply: (api) => {
          openKycEdge(api, ctx, {
            step,
            identityPhase: step === 1 ? "intro" : undefined,
            docsMode: step >= 4 ? "empty" : undefined,
            mobileVerified: step >= 3 ? true : step === 2 ? false : undefined,
          });
        },
      }),
    ),

    // —— Step 1 identity edges ——
    identityLeaf("intro", "Intro · DigiLocker vs Manual", "intro", { step: 1, identityPhase: "intro", docsMode: "empty" }, (s) => s.kyc.identityPhase === "intro"),
    identityLeaf(
      "digilocker_redirect",
      "DigiLocker · redirecting",
      "digilocker.redirect",
      { step: 1, identityPhase: "digilocker_redirect", docsMode: "empty" },
      (s) => s.kyc.identityPhase === "digilocker_redirect",
    ),
    identityLeaf(
      "digilocker_consent",
      "DigiLocker · consent (ready)",
      "digilocker.consent",
      {
        step: 1,
        identityPhase: "digilocker_consent",
        digilockerConsentUidai: true,
        digilockerConsentPan: true,
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "digilocker_consent" &&
        s.kyc.digilockerConsentUidai &&
        s.kyc.digilockerConsentPan,
    ),
    identityLeaf(
      "digilocker_consent_incomplete",
      "DigiLocker · consent incomplete",
      "digilocker.consent_incomplete",
      {
        step: 1,
        identityPhase: "digilocker_consent",
        digilockerConsentUidai: false,
        digilockerConsentPan: false,
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "digilocker_consent" &&
        (!s.kyc.digilockerConsentUidai || !s.kyc.digilockerConsentPan),
    ),
    identityLeaf(
      "digilocker_fetching",
      "DigiLocker · fetching",
      "digilocker.fetching",
      { step: 1, identityPhase: "digilocker_fetching", docsMode: "empty" },
      (s) => s.kyc.identityPhase === "digilocker_fetching",
    ),
    identityLeaf(
      "digilocker_pan_missing",
      "DigiLocker · PAN missing",
      "digilocker.pan_missing",
      {
        step: 1,
        identityPhase: "digilocker_results",
        panInDigilocker: false,
        aadhaarInDigilocker: true,
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "digilocker_results" &&
        s.kyc.aadhaarInDigilocker &&
        !s.kyc.panInDigilocker,
    ),
    identityLeaf(
      "digilocker_aadhaar_missing",
      "DigiLocker · Aadhaar missing",
      "digilocker.aadhaar_missing",
      {
        step: 1,
        identityPhase: "digilocker_results",
        panInDigilocker: true,
        aadhaarInDigilocker: false,
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "digilocker_results" &&
        !s.kyc.aadhaarInDigilocker &&
        s.kyc.panInDigilocker,
    ),
    identityLeaf(
      "digilocker_both_missing",
      "DigiLocker · both missing",
      "digilocker.both_missing",
      {
        step: 1,
        identityPhase: "digilocker_results",
        panInDigilocker: false,
        aadhaarInDigilocker: false,
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "digilocker_results" &&
        !s.kyc.aadhaarInDigilocker &&
        !s.kyc.panInDigilocker,
    ),
    identityLeaf(
      "digilocker_results_both_found",
      "DigiLocker · both found (results)",
      "digilocker.results_both_found",
      {
        step: 1,
        identityPhase: "digilocker_results",
        panInDigilocker: true,
        aadhaarInDigilocker: true,
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "digilocker_results" &&
        s.kyc.aadhaarInDigilocker &&
        s.kyc.panInDigilocker,
    ),
    identityLeaf(
      "digilocker_pan_found",
      "DigiLocker · confirm PAN",
      "digilocker.pan_found",
      {
        step: 1,
        identityPhase: "pan_confirm",
        panInDigilocker: true,
        aadhaarInDigilocker: true,
        identityPanDraft: "ABCDE1234F",
        identityNameMismatch: false,
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "pan_confirm" &&
        s.kyc.panInDigilocker &&
        !s.kyc.identityNameMismatch,
    ),
    identityLeaf(
      "digilocker_name_mismatch",
      "DigiLocker · name mismatch",
      "digilocker.name_mismatch",
      {
        step: 1,
        identityPhase: "pan_confirm",
        panInDigilocker: true,
        aadhaarInDigilocker: true,
        identityPanDraft: "ABCDE1234F",
        identityNameMismatch: true,
        docsMode: "empty",
      },
      (s) => s.kyc.identityPhase === "pan_confirm" && s.kyc.identityNameMismatch,
    ),
    identityLeaf(
      "digilocker_aadhaar_otp",
      "DigiLocker · Aadhaar OTP (PAN verified)",
      "digilocker.aadhaar_otp",
      {
        step: 1,
        identityPhase: "aadhaar_otp",
        panInDigilocker: true,
        aadhaarInDigilocker: true,
        docsMode: "pan_verified_only",
      },
      (s) => s.kyc.identityPhase === "aadhaar_otp" && s.kyc.panInDigilocker,
    ),
    identityLeaf(
      "digilocker_aadhaar_otp_pan_missing",
      "DigiLocker · Aadhaar OTP (PAN missing)",
      "digilocker.aadhaar_otp_pan_missing",
      {
        step: 1,
        identityPhase: "aadhaar_otp",
        panInDigilocker: false,
        aadhaarInDigilocker: true,
        docsMode: "empty",
      },
      (s) => s.kyc.identityPhase === "aadhaar_otp" && !s.kyc.panInDigilocker,
    ),
    identityLeaf(
      "digilocker_done",
      "DigiLocker · both verified",
      "digilocker.done",
      {
        step: 1,
        identityPhase: "done",
        panInDigilocker: true,
        aadhaarInDigilocker: true,
        docsMode: "digilocker_linked",
      },
      (s) => s.kyc.identityPhase === "done" && s.kyc.panInDigilocker,
    ),
    identityLeaf(
      "pan_missing",
      "Aadhaar verified · PAN missing",
      "pan_missing",
      {
        step: 1,
        identityPhase: "pan_missing",
        panInDigilocker: false,
        aadhaarInDigilocker: true,
        docsMode: "aadhaar_only",
      },
      (s) => s.kyc.identityPhase === "pan_missing",
    ),
    identityLeaf(
      "manual_pan",
      "Manual · PAN entry",
      "manual.pan",
      {
        step: 1,
        identityPhase: "manual_pan",
        identityPanDraft: "ABCDE1234F",
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "manual_pan" &&
        /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(s.kyc.identityPanDraft.trim()),
    ),
    identityLeaf(
      "manual_pan_invalid",
      "Manual · invalid PAN",
      "manual.pan_invalid",
      {
        step: 1,
        identityPhase: "manual_pan",
        identityPanDraft: "INVALID",
        docsMode: "empty",
      },
      (s) =>
        s.kyc.identityPhase === "manual_pan" &&
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(s.kyc.identityPanDraft.trim()),
    ),
    identityLeaf(
      "manual_aadhaar",
      "Manual · Aadhaar + OTP",
      "manual.aadhaar",
      {
        step: 1,
        identityPhase: "manual_aadhaar",
        identityPanDraft: "ABCDE1234F",
        docsMode: "under_review",
      },
      (s) => s.kyc.identityPhase === "manual_aadhaar",
    ),
    identityLeaf(
      "manual_under_review",
      "Manual · both under review",
      "manual.under_review",
      {
        step: 1,
        identityPhase: "manual_pending",
        identityPanDraft: "ABCDE1234F",
        docsMode: "under_review",
      },
      (s) =>
        s.kyc.identityPhase === "manual_pending" &&
        s.kycStep === 1 &&
        s.kyc.docs.aadhaar === "under_review",
    ),
    identityLeaf(
      "manual_pan_pending_aadhaar_ok",
      "Manual · PAN pending · Aadhaar OK",
      "manual.pan_pending_aadhaar_ok",
      {
        step: 1,
        identityPhase: "manual_pending",
        identityPanDraft: "ABCDE1234F",
        docsMode: "pan_under_review_aadhaar_ok",
      },
      (s) =>
        s.kyc.identityPhase === "manual_pending" &&
        s.kycStep === 1 &&
        s.kyc.docs.pan === "under_review" &&
        (s.kyc.docs.aadhaar === "uploaded" || s.kyc.docs.aadhaar === "accepted"),
    ),
    identityLeaf(
      "manual_done",
      "Manual · both verified",
      "manual.done",
      {
        step: 1,
        identityPhase: "done",
        panInDigilocker: false,
        docsMode: "digilocker_linked",
      },
      (s) => s.kyc.identityPhase === "done" && !s.kyc.panInDigilocker,
    ),

    // —— KYC-0 skip ——
    node({
      id: `${id}.already_verified`,
      path: `${pathRoot}.KYC.already_verified_skip`,
      label: "KYC-0 · already verified (skip)",
      depth: depth + 1,
      parentId: id,
      specificity: 28,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kyc.identityPhase === "done" &&
        s.kyc.mobileVerified &&
        s.kyc.emailVerified &&
        s.kycStep === 4 &&
        !s.kyc.complete,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          identityPhase: "done",
          panInDigilocker: true,
          docsMode: "digilocker_linked",
          mobileVerified: true,
          emailVerified: true,
        }),
    }),

    // —— Step 2 mobile (incl. continue-while-pending) ——
    node({
      id: `${step2}.continue_while_pending`,
      path: `${pathRoot}.KYC.step2.continue_while_pending`,
      label: "Continue while pending",
      depth: depth + 2,
      parentId: step2,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 2 &&
        s.kyc.identityPhase === "manual_pending" &&
        !s.kyc.mobileVerified &&
        (s.kyc.docs.pan === "under_review" || s.kyc.docs.aadhaar === "under_review"),
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 2,
          identityPhase: "manual_pending",
          identityPanDraft: "ABCDE1234F",
          docsMode: "under_review",
          mobileVerified: false,
          otp: "",
        }),
    }),
    node({
      id: `${step2}.otp_empty`,
      path: `${pathRoot}.KYC.step2.otp_empty`,
      label: "OTP empty · Verify disabled",
      depth: depth + 2,
      parentId: step2,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 2 &&
        !s.kyc.mobileVerified &&
        s.otp.replace(/\D/g, "").length === 0,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 2,
          mobileVerified: false,
          otp: "",
          identityPhase: "intro",
          docsMode: "empty",
        }),
    }),
    node({
      id: `${step2}.otp_partial`,
      path: `${pathRoot}.KYC.step2.otp_partial`,
      label: "OTP partial · Verify disabled",
      depth: depth + 2,
      parentId: step2,
      specificity: 32,
      isActive: (s) => {
        const len = s.otp.replace(/\D/g, "").length;
        return (
          matchCtx(s, ctx) &&
          s.sheet === "kyc" &&
          s.kycStep === 2 &&
          !s.kyc.mobileVerified &&
          len > 0 &&
          len < 6
        );
      },
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 2,
          mobileVerified: false,
          otp: "12",
          identityPhase: "intro",
          docsMode: "empty",
        }),
    }),
    node({
      id: `${step2}.otp_ready`,
      path: `${pathRoot}.KYC.step2.otp_ready`,
      label: "OTP filled · ready to verify",
      depth: depth + 2,
      parentId: step2,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 2 &&
        !s.kyc.mobileVerified &&
        s.otp.replace(/\D/g, "").length === 6,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 2,
          mobileVerified: false,
          otp: "123456",
          identityPhase: "intro",
          docsMode: "empty",
        }),
    }),
    node({
      id: `${step2}.verified`,
      path: `${pathRoot}.KYC.step2.verified`,
      label: "Mobile verified",
      depth: depth + 2,
      parentId: step2,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 2 && s.kyc.mobileVerified,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 2,
          mobileVerified: true,
          otp: "123456",
          identityPhase: "done",
          docsMode: "digilocker_linked",
        }),
    }),
    node({
      id: `${step3}.already_verified_skip`,
      path: `${pathRoot}.KYC.step3.mobile_already_verified_skip`,
      label: "Mobile already verified · skip OTP",
      depth: depth + 2,
      parentId: step3,
      specificity: 33,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 3 && s.kyc.mobileVerified && s.kyc.emailVerified,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 3,
          mobileVerified: true,
          emailVerified: true,
          identityPhase: "done",
          docsMode: "digilocker_linked",
        }),
    }),

    // —— Step 3 email ——
    node({
      id: `${step3}.verified`,
      path: `${pathRoot}.KYC.step3.verified`,
      label: "Email already verified",
      depth: depth + 2,
      parentId: step3,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 3 && s.kyc.emailVerified,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 3,
          mobileVerified: true,
          emailVerified: true,
          identityPhase: "done",
          docsMode: "digilocker_linked",
        }),
    }),
    node({
      id: `${step3}.pending`,
      path: `${pathRoot}.KYC.step3.pending`,
      label: "Email pending · verify OTP",
      depth: depth + 2,
      parentId: step3,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 3 && !s.kyc.emailVerified,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 3,
          mobileVerified: true,
          emailVerified: false,
          emailOtp: "",
          identityPhase: "done",
          docsMode: "digilocker_linked",
        }),
    }),
    node({
      id: `${step3}.otp_ready`,
      path: `${pathRoot}.KYC.step3.otp_ready`,
      label: "Email OTP ready",
      depth: depth + 2,
      parentId: step3,
      specificity: 33,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 3 &&
        !s.kyc.emailVerified &&
        s.kyc.emailOtp.replace(/\D/g, "").length === 6,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 3,
          mobileVerified: true,
          emailVerified: false,
          emailOtp: "654321",
          identityPhase: "done",
          docsMode: "digilocker_linked",
        }),
    }),

    // —— Step 4 documents ——
    node({
      id: `${step4}.docs_empty`,
      path: `${pathRoot}.KYC.step4.docs_empty`,
      label: "Docs · none uploaded",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) => {
        if (!(matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 4 && !s.kyc.useForm60 && !s.kyc.selfieCaptureOpen))
          return false;
        const required = kycDocKeys(ctx.residency);
        return required.every((k) => (s.kyc.docs[k] ?? "not_started") === "not_started");
      },
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "empty",
          useForm60: false,
          identityPhase: "done",
        }),
    }),
    node({
      id: `${step4}.docs_partial`,
      path: `${pathRoot}.KYC.step4.docs_partial`,
      label: "Docs · partial uploads",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) => {
        if (!(matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 4 && !s.kyc.selfieCaptureOpen)) return false;
        const required = kycDocKeys(ctx.residency);
        const uploaded = required.filter(
          (k) =>
            s.kyc.docs[k] === "uploaded" ||
            s.kyc.docs[k] === "accepted" ||
            s.kyc.docs[k] === "under_review",
        );
        return uploaded.length > 0 && uploaded.length < required.length;
      },
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "partial",
          identityPhase: "done",
        }),
    }),
    node({
      id: `${step4}.docs_uploaded`,
      path: `${pathRoot}.KYC.step4.docs_uploaded`,
      label: "Docs · all required uploaded",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) => {
        if (!(matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 4 && !s.kyc.useForm60 && !s.kyc.selfieCaptureOpen))
          return false;
        const required = kycDocKeys(ctx.residency);
        return (
          required.every(
            (k) =>
              s.kyc.docs[k] === "uploaded" ||
              s.kyc.docs[k] === "accepted" ||
              s.kyc.docs[k] === "under_review",
          ) &&
          s.kyc.docs.pan !== "under_review" &&
          s.kyc.docs.aadhaar !== "under_review" &&
          !required.some((k) => s.kyc.docs[k] === "rejected" || s.kyc.docs[k] === "expired")
        );
      },
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "uploaded",
          identityPhase: "done",
        }),
    }),
    node({
      id: `${step4}.digilocker_linked`,
      path: `${pathRoot}.KYC.step4.digilocker_linked`,
      label: "Docs · DigiLocker-linked labels",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 4 &&
        (s.kyc.docs.pan === "uploaded" || s.kyc.docs.pan === "accepted") &&
        (s.kyc.docs.aadhaar === "uploaded" || s.kyc.docs.aadhaar === "accepted"),
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "digilocker_linked",
          panInDigilocker: true,
          identityPhase: "done",
        }),
    }),
    node({
      id: `${step4}.under_review_labels`,
      path: `${pathRoot}.KYC.step4.under_review_labels`,
      label: "Docs · under-review labels",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 4 &&
        (s.kyc.docs.pan === "under_review" || s.kyc.docs.aadhaar === "under_review"),
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "under_review",
          identityPhase: "manual_pending",
        }),
    }),
    node({
      id: `${step4}.doc_rejected`,
      path: `${pathRoot}.KYC.step4.doc_rejected`,
      label: "Docs · rejected · re-upload",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 4 &&
        Object.values(s.kyc.docs).some((d) => d === "rejected"),
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "doc_rejected",
          identityPhase: "done",
        }),
    }),
    node({
      id: `${step4}.doc_expired`,
      path: `${pathRoot}.KYC.step4.doc_expired`,
      label: "Docs · expired · re-upload",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 4 &&
        Object.values(s.kyc.docs).some((d) => d === "expired"),
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "doc_expired",
          identityPhase: "done",
        }),
    }),
    node({
      id: `${step4}.selfie_capture`,
      path: `${pathRoot}.KYC.step4.selfie_capture`,
      label: "Selfie · live capture",
      depth: depth + 2,
      parentId: step4,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 4 && s.kyc.selfieCaptureOpen,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: true,
          docsMode: "partial",
          selfieCaptureOpen: true,
          identityPhase: "done",
        }),
    }),
    node({
      id: `${step4}.locked`,
      path: `${pathRoot}.KYC.step4.locked`,
      label: "Docs · locked (mobile pending)",
      depth: depth + 2,
      parentId: step4,
      specificity: 30,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 4 && !s.kyc.mobileVerified,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 4,
          mobileVerified: false,
          docsMode: "empty",
          identityPhase: "intro",
        }),
    }),
  ];

  if (isNri) {
    nodes.push(
      node({
        id: `${step4}.form60`,
        path: `${pathRoot}.KYC.step4.form60`,
        label: "Form 60 instead of PAN",
        depth: depth + 2,
        parentId: step4,
        specificity: 32,
        isActive: (s) =>
          matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 4 && s.kyc.useForm60 && !s.kyc.identityVerified,
        apply: (api) =>
          openKycEdge(api, ctx, {
            step: 4,
            mobileVerified: true,
            docsMode: "form60",
            useForm60: true,
            identityPhase: "intro",
          }),
      }),
      node({
        id: `${step4}.form60_complete`,
        path: `${pathRoot}.KYC.step4.form60_complete`,
        label: "Form 60 · all required uploaded",
        depth: depth + 2,
        parentId: step4,
        specificity: 33,
        isActive: (s) => {
          if (!(matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 4 && s.kyc.useForm60)) return false;
          return kycDocKeys("nri").every(
            (k) => s.kyc.docs[k] === "uploaded" || s.kyc.docs[k] === "accepted",
          );
        },
        apply: (api) =>
          openKycEdge(api, ctx, {
            step: 4,
            mobileVerified: true,
            docsMode: "uploaded",
            useForm60: true,
            identityPhase: "done",
          }),
      }),
      node({
        id: `${step4}.optional_docs`,
        path: `${pathRoot}.KYC.step4.optional_docs`,
        label: "Optional NRI docs uploaded",
        depth: depth + 2,
        parentId: step4,
        specificity: 32,
        isActive: (s) =>
          matchCtx(s, ctx) &&
          s.sheet === "kyc" &&
          s.kycStep === 4 &&
          kycOptionalDocKeys("nri").every((k) => (s.kyc.docs[k] ?? "not_started") !== "not_started"),
        apply: (api) =>
          openKycEdge(api, ctx, {
            step: 4,
            mobileVerified: true,
            docsMode: "optional",
            identityPhase: "done",
          }),
      }),
    );
  }

  // Per-doc leaves for required keys
  for (const docKey of kycDocKeys(ctx.residency)) {
    nodes.push(
      node({
        id: `${step4}.doc.${docKey}`,
        path: `${pathRoot}.KYC.step4.doc.${docKey}`,
        label: `Doc · ${docKey}`,
        depth: depth + 2,
        parentId: step4,
        specificity: 34,
        isActive: (s) =>
          matchCtx(s, ctx) &&
          s.sheet === "kyc" &&
          s.kycStep === 4 &&
          s.kyc.docs[docKey] === "uploaded" &&
          kycDocKeys(ctx.residency).filter((k) => s.kyc.docs[k] === "uploaded").length === 1,
        apply: (api) =>
          openKycEdge(api, ctx, {
            step: 4,
            mobileVerified: true,
            docsMode: "empty",
            docsPatch: { [docKey]: "uploaded" },
            identityPhase: "done",
          }),
      }),
    );
  }

  // —— Step 5 address ——
  nodes.push(
    node({
      id: `${step5}.${isNri ? "nri" : "resident"}`,
      path: `${pathRoot}.KYC.step5.${isNri ? "nri" : "resident"}`,
      label: isNri ? "Address · overseas + India" : "Address · India only",
      depth: depth + 2,
      parentId: step5,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 5 &&
        !!s.kyc.indiaAddress.trim() &&
        (!isNri || !!s.kyc.overseasAddress.trim()),
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 5,
          mobileVerified: true,
          identityVerified: true,
          docsMode: "uploaded",
          identityPhase: "done",
          indiaAddress: "12, MG Road, Bengaluru 560001",
          overseasAddress: isNri ? "Marina Walk, Dubai Marina, UAE" : "",
        }),
    }),
    node({
      id: `${step5}.empty`,
      path: `${pathRoot}.KYC.step5.empty`,
      label: "Address · empty fields",
      depth: depth + 2,
      parentId: step5,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.sheet === "kyc" &&
        s.kycStep === 5 &&
        !s.kyc.indiaAddress.trim() &&
        (!isNri || !s.kyc.overseasAddress.trim()),
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 5,
          mobileVerified: true,
          identityVerified: true,
          docsMode: "uploaded",
          identityPhase: "done",
          indiaAddress: "",
          overseasAddress: "",
        }),
    }),
  );

  if (isNri) {
    nodes.push(
      node({
        id: `${step5}.india_empty`,
        path: `${pathRoot}.KYC.step5.india_empty`,
        label: "Address · India empty",
        depth: depth + 2,
        parentId: step5,
        specificity: 33,
        isActive: (s) =>
          matchCtx(s, ctx) &&
          s.sheet === "kyc" &&
          s.kycStep === 5 &&
          !s.kyc.indiaAddress.trim() &&
          !!s.kyc.overseasAddress.trim(),
        apply: (api) =>
          openKycEdge(api, ctx, {
            step: 5,
            mobileVerified: true,
            identityVerified: true,
            docsMode: "uploaded",
            identityPhase: "done",
            indiaAddress: "",
            overseasAddress: "Marina Walk, Dubai Marina, UAE",
          }),
      }),
      node({
        id: `${step5}.overseas_empty`,
        path: `${pathRoot}.KYC.step5.overseas_empty`,
        label: "Address · overseas empty",
        depth: depth + 2,
        parentId: step5,
        specificity: 33,
        isActive: (s) =>
          matchCtx(s, ctx) &&
          s.sheet === "kyc" &&
          s.kycStep === 5 &&
          !!s.kyc.indiaAddress.trim() &&
          !s.kyc.overseasAddress.trim(),
        apply: (api) =>
          openKycEdge(api, ctx, {
            step: 5,
            mobileVerified: true,
            identityVerified: true,
            docsMode: "uploaded",
            identityPhase: "done",
            indiaAddress: "12, MG Road, Bengaluru 560001",
            overseasAddress: "",
          }),
      }),
    );
  }

  // —— Step 6 compliance ——
  nodes.push(
    node({
      id: `${step6}.declarations`,
      path: `${pathRoot}.KYC.step6.${isNri ? "nri_fatca" : "resident"}`,
      label: isNri ? "Compliance · FATCA / CRS" : "Compliance · India tax / PEP",
      depth: depth + 2,
      parentId: step6,
      specificity: 32,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 6 && !s.kyc.complete,
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 6,
          mobileVerified: true,
          identityVerified: true,
          addressVerified: true,
          docsMode: "uploaded",
          identityPhase: "done",
          complete: false,
          complianceDone: false,
          foreignTin: isNri ? "" : undefined,
        }),
    }),
    node({
      id: `${step6}.complete`,
      path: `${pathRoot}.KYC.step6.complete`,
      label: "KYC submitted · complete",
      depth: depth + 2,
      parentId: step6,
      specificity: 32,
      isActive: (s) => matchCtx(s, ctx) && s.kyc.complete && (s.sheet === "kyc" || s.loanStatus === "verify"),
      apply: (api) => {
        openKycEdge(api, ctx, {
          step: 6,
          mobileVerified: true,
          identityVerified: true,
          addressVerified: true,
          docsMode: "uploaded",
          identityPhase: "done",
          complete: true,
          complianceDone: true,
          loanStatus: "verify",
        });
      },
    }),
    node({
      id: `${step6}.summary`,
      path: `${pathRoot}.KYC.step6.summary`,
      label: "KYC-7 · completion summary",
      depth: depth + 2,
      parentId: step6,
      specificity: 33,
      isActive: (s) =>
        matchCtx(s, ctx) && s.sheet === "kyc" && s.kycStep === 6 && s.kyc.complete && s.loanStatus === "kyc",
      apply: (api) =>
        openKycEdge(api, ctx, {
          step: 6,
          mobileVerified: true,
          identityVerified: true,
          addressVerified: true,
          docsMode: "uploaded",
          identityPhase: "done",
          complete: true,
          complianceDone: true,
          loanStatus: "kyc",
          foreignTin: isNri ? "AE-TIN-001" : undefined,
        }),
    }),
  );

  if (isNri) {
    nodes.push(
      node({
        id: `${step6}.tin_filled`,
        path: `${pathRoot}.KYC.step6.tin_filled`,
        label: "Compliance · foreign TIN filled",
        depth: depth + 2,
        parentId: step6,
        specificity: 34,
        isActive: (s) =>
          matchCtx(s, ctx) &&
          s.sheet === "kyc" &&
          s.kycStep === 6 &&
          !s.kyc.complete &&
          !!s.kyc.foreignTin.trim(),
        apply: (api) =>
          openKycEdge(api, ctx, {
            step: 6,
            mobileVerified: true,
            identityVerified: true,
            addressVerified: true,
            docsMode: "uploaded",
            identityPhase: "done",
            foreignTin: "AE-TIN-001",
          }),
      }),
    );
  }

  return nodes;
}

function stageVerify(ctx: Ctx, loanId: string, depth: number, pathRoot: string): SmNode[] {
  const id = `${loanId}.verify`;
  return [
    node({
      id,
      path: `${pathRoot}.Journey.verify`,
      label: "Verify loan · verify",
      depth,
      parentId: loanId,
      specificity: 16,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.nav === "loan" &&
        (s.sheet === "verify" || (!s.sheet && s.loanStatus === "verify")),
      apply: (api) => {
        ensureCtx(api, ctx);
        if (["not_started", "discover", "offers", "apply", "kyc"].includes(api.state.loanStatus)) {
          seedMidJourney(api, ctx, "verify");
        } else {
          api.setField("loanStatus", "verify");
        }
        openJourneySheet(api, "verify");
      },
    }),
    ...(["salary_slips", "bank_statements", "property_docs", "credit_consent"] as const).map((key) =>
      node({
        id: `${id}.doc.${key}`,
        path: `${pathRoot}.Verify.doc.${key}`,
        label: key,
        depth: depth + 1,
        parentId: id,
        specificity: 20,
        isActive: () => false,
        apply: (api) => {
          ensureCtx(api, ctx);
          api.setField("loanStatus", "verify");
          openJourneySheet(api, "verify");
        },
      }),
    ),
  ];
}

function stageTrack(ctx: Ctx, loanId: string, depth: number, pathRoot: string): SmNode[] {
  const id = `${loanId}.track`;
  const milestones: { step: number; label: string }[] = TRACK_MILESTONES.map((m, step) => ({
    step,
    label: `${step} · ${m.inProgress} / ${m.completed}`,
  }));

  return [
    node({
      id,
      path: `${pathRoot}.Journey.track`,
      label: "Track loan · track → active",
      depth,
      parentId: loanId,
      specificity: 16,
      isActive: (s) =>
        matchCtx(s, ctx) &&
        s.nav === "loan" &&
        !s.sheet &&
        TRACKING.includes(s.loanStatus) &&
        s.trackStep < 6,
      apply: (api) => {
        ensureCtx(api, ctx);
        ensureTracking(api, Math.min(api.state.trackStep || 0, 5));
      },
    }),
    ...milestones.map(({ step, label }) =>
      node({
        id: `${id}.milestone.${step}`,
        path: `${pathRoot}.Track.milestone.${step}`,
        label,
        depth: depth + 1,
        parentId: id,
        specificity: step >= 6 ? 30 : 28,
        isActive: (s) =>
          matchCtx(s, ctx) &&
          s.nav === "loan" &&
          !s.sheet &&
          TRACKING.includes(s.loanStatus) &&
          s.trackStep === step,
        apply: (api) => {
          ensureCtx(api, ctx);
          if (step >= 3 && api.state.loanStatus !== "active" && api.state.trackStep < 3) {
            api.loadPersona("done");
            api.setResidency(ctx.residency);
            api.setField("loanType", ctx.loanType);
          }
          ensureTracking(api, step);
        },
      }),
    ),
  ];
}

function residencyBranch(residency: NonNullable<Residency>): SmNode[] {
  const id = `user.${residency}`;
  const label = residency === "resident" ? "Resident Indian" : "NRI";
  const profileId = `${id}.profile`;
  const helpId = `${id}.help`;

  return [
    node({
      id,
      path: `User.${residency}`,
      label,
      depth: 1,
      parentId: "user",
      specificity: 7,
      isActive: (s) => s.residency === residency && s.nav === "loan" && !s.loanType,
      apply: (api) => {
        api.setResidency(residency);
        goLoan(api);
        api.closeSheet();
      },
    }),
    ...loanBranch({ residency, loanType: "home" }, id, 2),
    ...loanBranch({ residency, loanType: "transfer" }, id, 2),
    node({
      id: profileId,
      path: `User.${residency}.Profile`,
      label: "Profile",
      depth: 2,
      parentId: id,
      specificity: 40,
      isActive: (s) => s.nav === "profile" && s.residency === residency,
      apply: (api) => {
        api.setResidency(residency);
        api.closeSheet();
        api.goTo("profile", "profile");
      },
    }),
    node({
      id: helpId,
      path: `User.${residency}.Help`,
      label: "Help",
      depth: 2,
      parentId: id,
      specificity: 40,
      isActive: (s) => s.nav === "help" && s.residency === residency,
      apply: (api) => {
        api.setResidency(residency);
        api.closeSheet();
        api.goTo("help", "help");
      },
    }),
  ];
}

/** Ordered DFS list for the left state-machine nav. */
export const SM_NODES: SmNode[] = [
  node({
    id: "user",
    path: "User",
    label: "User",
    depth: 0,
    specificity: 0,
    isActive: () => false,
    apply: (api) => goLoan(api),
  }),
  ...residencyBranch("resident"),
  ...residencyBranch("nri"),
];

export function resolveActiveSmNodeId(state: AppState): string | null {
  let best: SmNode | null = null;
  for (const n of SM_NODES) {
    if (!n.isActive(state)) continue;
    if (!best || n.specificity > best.specificity) best = n;
  }
  return best?.id ?? null;
}

export function ancestorIds(nodeId: string): string[] {
  const byId = new Map(SM_NODES.map((n) => [n.id, n]));
  const ids: string[] = [];
  let cur = byId.get(nodeId);
  while (cur?.parentId) {
    ids.push(cur.parentId);
    cur = byId.get(cur.parentId);
  }
  return ids;
}
