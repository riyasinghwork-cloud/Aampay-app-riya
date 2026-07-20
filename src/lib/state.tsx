"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BANK_OFFERS,
  PERSONA_PRESETS,
  initialState,
  kycDocKeys,
  kycOptionalDocKeys,
  mockEligibleAmount,
  type AppState,
  type DemoPersona,
  type DocStatus,
  type JourneySheet,
  type NavSection,
  type ScreenId,
} from "./types";

type PrototypeContextValue = {
  state: AppState;
  goTo: (screen: ScreenId, nav?: NavSection) => void;
  reset: () => void;
  loadPersona: (persona: DemoPersona) => void;
  openSheet: (sheet: JourneySheet) => void;
  closeSheet: () => void;
  resumeJourney: () => void;
  setField: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  patchPersonal: (patch: Partial<AppState["personal"]>) => void;
  patchEmployment: (patch: Partial<AppState["employment"]>) => void;
  patchProperty: (patch: Partial<AppState["property"]>) => void;
  patchKyc: (
    patch: Partial<AppState["kyc"]> | ((kyc: AppState["kyc"]) => Partial<AppState["kyc"]>),
  ) => void;
  toggleShortlist: (bankId: string) => void;
  selectBank: (bankId: string) => void;
  selectedBank: (typeof BANK_OFFERS)[number] | null;
  setKycDoc: (key: string, status?: DocStatus) => void;
  setVerifyDoc: (key: string) => void;
  markKycComplete: () => void;
  advanceTrack: () => void;
  startLoan: (type: AppState["loanType"]) => void;
  setResidency: (residency: NonNullable<AppState["residency"]>) => void;
  submitDiscover: () => void;
  runOfferSearch: () => void;
  setDiscoverStep: (step: AppState["discoverStep"]) => void;
  setApplyStep: (step: AppState["applyStep"]) => void;
  setKycStep: (step: AppState["kycStep"]) => void;
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

function cycleDoc(status: DocStatus): DocStatus {
  if (status === "not_started") return "uploaded";
  if (status === "uploaded") return "under_review";
  if (status === "under_review") return "accepted";
  if (status === "accepted") return "rejected";
  if (status === "rejected") return "expired";
  return "not_started";
}

/** KYC required-doc gate: rejected / expired must be re-uploaded. */
export function docSatisfiesKycRequirement(status: DocStatus | undefined): boolean {
  return status === "uploaded" || status === "accepted" || status === "under_review";
}

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const goTo = useCallback((screen: ScreenId, nav?: NavSection) => {
    setState((s) => ({
      ...s,
      screen,
      nav: nav ?? (screen === "profile" ? "profile" : screen === "help" ? "help" : "loan"),
    }));
  }, []);

  const reset = useCallback(() => setState(PERSONA_PRESETS.new), []);

  const loadPersona = useCallback((persona: DemoPersona) => {
    setState(PERSONA_PRESETS[persona]);
  }, []);

  const openSheet = useCallback((sheet: JourneySheet) => {
    setState((s) => ({ ...s, sheet, screen: "overview", nav: "loan" }));
  }, []);

  const closeSheet = useCallback(() => {
    setState((s) => ({ ...s, sheet: null, screen: "overview" }));
  }, []);

  const resumeJourney = useCallback(() => {
    setState((s) => ({
      ...s,
      screen: "overview",
      sheet: null,
      nav: "loan",
    }));
  }, []);

  const setField = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const patchPersonal = useCallback((patch: Partial<AppState["personal"]>) => {
    setState((s) => ({ ...s, personal: { ...s.personal, ...patch } }));
  }, []);

  const patchEmployment = useCallback((patch: Partial<AppState["employment"]>) => {
    setState((s) => ({ ...s, employment: { ...s.employment, ...patch } }));
  }, []);

  const patchProperty = useCallback((patch: Partial<AppState["property"]>) => {
    setState((s) => ({ ...s, property: { ...s.property, ...patch } }));
  }, []);

  const patchKyc = useCallback(
    (patch: Partial<AppState["kyc"]> | ((kyc: AppState["kyc"]) => Partial<AppState["kyc"]>)) => {
      setState((s) => {
        const next = typeof patch === "function" ? patch(s.kyc) : patch;
        return { ...s, kyc: { ...s.kyc, ...next } };
      });
    },
    [],
  );

  const toggleShortlist = useCallback((bankId: string) => {
    setState((s) => ({
      ...s,
      shortlist: s.shortlist.includes(bankId)
        ? s.shortlist.filter((id) => id !== bankId)
        : [...s.shortlist, bankId],
    }));
  }, []);

  const selectBank = useCallback((bankId: string) => {
    setState((s) => ({
      ...s,
      selectedBankId: bankId,
      loanStatus: "apply",
      screen: "overview",
      sheet: null,
      demoPersona: s.demoPersona === "new" ? "mid" : s.demoPersona,
    }));
  }, []);

  const setKycDoc = useCallback((key: string, status?: DocStatus) => {
    setState((s) => {
      const current = s.kyc.docs[key] ?? "not_started";
      const next =
        status ??
        (current === "not_started" || current === "rejected" || current === "expired"
          ? "uploaded"
          : "not_started");
      return {
        ...s,
        kyc: {
          ...s.kyc,
          docs: { ...s.kyc.docs, [key]: next },
          selfieCaptureOpen: key === "selfie" && next === "uploaded" ? false : s.kyc.selfieCaptureOpen,
        },
      };
    });
  }, []);

  const setVerifyDoc = useCallback((key: string) => {
    setState((s) => ({
      ...s,
      verifyDocs: {
        ...s.verifyDocs,
        [key]: cycleDoc(s.verifyDocs[key] ?? "not_started"),
      },
    }));
  }, []);

  const markKycComplete = useCallback(() => {
    setState((s) => ({
      ...s,
      kyc: {
        ...s.kyc,
        complete: true,
        identityVerified: true,
        addressVerified: true,
        complianceDone: true,
      },
      loanStatus: "kyc",
      screen: "overview",
      sheet: "kyc",
      kycStep: 6,
    }));
  }, []);

  const advanceTrack = useCallback(() => {
    setState((s) => {
      const next = Math.min(s.trackStep + 1, 6);
      let loanStatus = s.loanStatus;
      if (next >= 3) loanStatus = "approved";
      if (next >= 5) loanStatus = "disbursed";
      if (next >= 6) loanStatus = "active";
      return { ...s, trackStep: next, loanStatus, demoPersona: next >= 6 ? "done" : s.demoPersona };
    });
  }, []);

  const startLoan = useCallback((type: AppState["loanType"]) => {
    setState((s) => ({
      ...s,
      loanType: type,
      loanStatus: "discover",
      screen: "overview",
      sheet: null,
      nav: "loan",
      demoPersona: "mid",
      discoverStep: 1,
      applyStep: 1,
      kycStep: 1,
    }));
  }, []);

  const setDiscoverStep = useCallback((step: AppState["discoverStep"]) => {
    setState((s) => ({ ...s, discoverStep: step }));
  }, []);

  const setApplyStep = useCallback((step: AppState["applyStep"]) => {
    setState((s) => ({ ...s, applyStep: step }));
  }, []);

  const setKycStep = useCallback((step: AppState["kycStep"]) => {
    setState((s) => ({ ...s, kycStep: step }));
  }, []);

  const setResidency = useCallback((residency: NonNullable<AppState["residency"]>) => {
    setState((s) => {
      const allowed = new Set([...kycDocKeys(residency), ...kycOptionalDocKeys(residency)]);
      const docs: Record<string, DocStatus> = {};
      for (const [key, status] of Object.entries(s.kyc.docs)) {
        if (allowed.has(key)) docs[key] = status;
      }
      // Seed empty required keys so Profile identity docs match residency
      for (const key of allowed) {
        if (!(key in docs)) docs[key] = "not_started";
      }
      const isNri = residency === "nri";
      return {
        ...s,
        residency,
        country: isNri
          ? s.country === "India" || !s.country
            ? "United Arab Emirates"
            : s.country
          : "India",
        kyc: {
          ...s.kyc,
          docs,
          identityVerified: false,
          overseasAddress: isNri
            ? s.kyc.overseasAddress || "Marina Walk, Dubai Marina, UAE"
            : "",
          taxCountry: isNri
            ? s.kyc.taxCountry === "India" || !s.kyc.taxCountry
              ? "United Arab Emirates"
              : s.kyc.taxCountry
            : "India",
          foreignTin: isNri ? s.kyc.foreignTin : "",
          useForm60: isNri ? s.kyc.useForm60 : false,
        },
      };
    });
  }, []);

  const submitDiscover = useCallback(() => {
    setState((s) => {
      const residency = s.residency ?? "nri";
      const occupation = s.occupation ?? "salaried";
      const country = residency === "resident" ? "India" : s.country || "United Arab Emirates";
      return {
        ...s,
        residency,
        occupation,
        country,
        eligibleAmount: mockEligibleAmount(s.propertyValue),
        eligibilityCalculated: true,
        loanStatus: "discover",
        screen: "overview",
        sheet: "discover",
        nav: "loan",
        discoverStep: 2,
      };
    });
  }, []);

  const runOfferSearch = useCallback(() => {
    setState((s) => ({
      ...s,
      searchingOffers: true,
      screen: "overview",
      sheet: "discover",
      loanStatus: "offers",
      nav: "loan",
      discoverStep: 3,
    }));
    window.setTimeout(() => {
      setState((s) => ({ ...s, searchingOffers: false }));
    }, 900);
  }, []);

  const selectedBank = useMemo(
    () => BANK_OFFERS.find((b) => b.id === state.selectedBankId) ?? null,
    [state.selectedBankId],
  );

  const value = useMemo(
    () => ({
      state,
      goTo,
      reset,
      loadPersona,
      openSheet,
      closeSheet,
      resumeJourney,
      setField,
      patchPersonal,
      patchEmployment,
      patchProperty,
      patchKyc,
      toggleShortlist,
      selectBank,
      selectedBank,
      setKycDoc,
      setVerifyDoc,
      markKycComplete,
      advanceTrack,
      startLoan,
      setResidency,
      submitDiscover,
      runOfferSearch,
      setDiscoverStep,
      setApplyStep,
      setKycStep,
    }),
    [
      state,
      goTo,
      reset,
      loadPersona,
      openSheet,
      closeSheet,
      resumeJourney,
      setField,
      patchPersonal,
      patchEmployment,
      patchProperty,
      patchKyc,
      toggleShortlist,
      selectBank,
      selectedBank,
      setKycDoc,
      setVerifyDoc,
      markKycComplete,
      advanceTrack,
      startLoan,
      setResidency,
      submitDiscover,
      runOfferSearch,
      setDiscoverStep,
      setApplyStep,
      setKycStep,
    ],
  );

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const ctx = useContext(PrototypeContext);
  if (!ctx) throw new Error("usePrototype must be used within PrototypeProvider");
  return ctx;
}

export function ensureKycDocs(state: AppState): string[] {
  return kycDocKeys(state.residency);
}

export function ensureKycOptionalDocs(state: AppState): string[] {
  return kycOptionalDocKeys(state.residency);
}
