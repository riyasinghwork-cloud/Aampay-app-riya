# AAMPAY state machine

> **Scope:** Interactive home-loan prototype (`src/`). Local React state only — no real APIs, OTP, or file storage.  
> **Audience:** Backend / platform engineers mapping UI → domain model.  
> **Source of truth:** [`src/lib/types.ts`](src/lib/types.ts), [`src/lib/state.tsx`](src/lib/state.tsx), [`src/components/AppShell.tsx`](src/components/AppShell.tsx), screens under [`src/components/screens/`](src/components/screens/).

### How to read `Path`

Dotted hierarchy from outer container → leaf. Example:

`User.NRI.Loan.home.Journey.KYC.docs.selfie`

Sibling branches (Resident vs NRI, home vs transfer) share the same loan status machine; only KYC docs/address/compliance fields diverge.

### Legends

| Token | Meaning |
|---|---|
| `LoanStatus` | `not_started` → `discover` → `offers` → `apply` → `kyc` → `verify` → `track` → `approved` → `disbursed` → `active` |
| `JourneySheet` | `null` \| `discover` \| `apply` \| `kyc` \| `verify` \| `track` (bottom sheet on My Loan) |
| `DocStatus` (KYC) | `not_started` ↔ `uploaded`; also seedable `under_review` / `accepted` / `rejected` / `expired` (reject/expire require re-upload) |
| `DocStatus` (verify) | `not_started` → `uploaded` → `under_review` → `accepted` → (cycle) |
| Progress % | `not_started` 0 · `discover` 15 · `offers` 30 · `apply` 45 · `kyc` 55 (70 if `kyc.complete`) · `verify` 80 · `track` 90 · `approved` 95 · `disbursed` 98 · `active` 100 |

### UI architecture (one sentence)

**My Loan (`overview`)** is the home; journey forms open in a **bottom sheet** (`state.sheet`); when `loanStatus` ∈ {`track`,`approved`,`disbursed`,`active`}, overview **replaces** step cards with the loan-tracking panel. Profile holds all collected identity / docs for edit.

---

## Master state table

| Path | State / status | Data held | Actions | Transitions | Edge cases / guards |
|---|---|---|---|---|---|
| `App` | Booted | Full `AppState` (see field index) | — | Renders `PrototypeProvider` → `AppShell` → routed screen | Prototype only; Reset demo replaces entire state with persona `new` |
| `App.nav` | `loan` \| `profile` \| `help` | `nav` | Tap bottom nav → `goTo(screen, nav)` | `loan`→`overview`; `profile`→`profile`; `help`→`help` | Bottom nav **hidden** while `sheet != null` |
| `App.screen` | Mostly `overview` \| `profile` \| `help` \| `timeline` | `screen` | `goTo` | Router: profile/help/timeline distinct; **all other ScreenIds collapse to Overview** | Legacy ScreenIds (`landing`, `kyc_*`, `apply_*`, etc.) remain typed but are not separately mounted |
| `App.sheet` | `null` or journey sheet | `sheet` | `openSheet(id)` / `closeSheet()` / journey mutators | Opens Discover / Apply / KYC / Verify / Track inside `BottomSheet` | `openSheet` forces `screen=overview`, `nav=loan` |
| `App.demoPersona` | `new` \| `mid` \| `done` | `demoPersona` | Overview tabs → `loadPersona`; auto on journey | Replaces entire `AppState` with `PERSONA_PRESETS[persona]` | Mid = NRI mid-KYC; Done = active loan + full KYC/verify |
| `App.reset` | — | — | Header **Reset demo** → `reset()` | → persona `new` | Wipes mid/done progress |
| `User` | Identity root | `personal`, `residency`, `country`, `occupation` | Profile edits; Discover/KYC set residency | Shared across products (prototype claim) | Prefill: Riya Mehta, `riya@email.com`, `+971 50 123 4567` |
| `User.residency` | `null` \| `resident` \| `nri` | `residency` | Discover pills / StateMachineNav → `setResidency`; Profile Select → `setField` | Resident forces `country=India`; NRI if country was India → UAE | `setResidency` **prunes** `kyc.docs` to allowed keys; resets `identityVerified`; clears `useForm60` for resident |
| `User.occupation` | `null` \| `salaried` \| `self_employed` | `occupation` | Discover / Profile | `submitDiscover` defaults missing to `salaried` | — |
| `User.country` | string | `country` | Discover Select (disabled if resident); Profile | Default UAE | Resident path: Select disabled in Discover |
| `User.Loan` | Container for one home-loan application | `loanType`, `loanStatus`, bank, eligibility, apply, kyc, verify, track | Start / continue from My Loan | One loan in prototype | Transfer vs home share status machine; copy differs |
| `User.Loan.type` | `null` \| `home` \| `transfer` | `loanType` | **Start Home Loan** / **Transfer Existing Loan** → `startLoan(type)` | → `loanStatus=discover`, `demoPersona=mid`, sheet null | Null only before start / on reset |
| `User.Loan.status` | See legend | `loanStatus` | Journey mutators | See happy-path diagram | Overview **tracking phase** when status ≥ `track` |
| `User.Loan.progress` | 0–100 | derived | — | `progressForLoanStatus(loanStatus, kyc.complete)` | Black progress bar on overview (pre-track only) |
| `User.Loan.bank.selected` | `null` \| `hdfc` \| `sbi` \| `icici` | `selectedBankId` | Expand card may set id; **Apply with {bank}** → `selectBank` | `selectBank` → `loanStatus=apply`, sheet null | Expand without Apply does **not** advance to apply |
| `User.Loan.bank.shortlist` | set of bank ids | `shortlist` | Save / Saved toggle | `toggleShortlist` | Cosmetic |
| `User.Loan.bank.offers` | Catalog | `BANK_OFFERS` constant | — | Static rates/fees/amounts/highlights | Not fetched from API |
| `User.Loan.Journey` | Five overview steps (pre-track) | Step status: locked \| current \| done | Open sheet CTAs | See rows below | Step `track` card exists until tracking phase; then whole list hidden |
| `User.Loan.Journey.eligibility` | Overview step `discover` | Title: Check eligibility | CTA **See my offers** / reopen sheet | Sheet `discover` | **done** if `eligibilityCalculated` and (status=`offers` OR past offers OR bank selected); else current if status≥discover |
| `User.Loan.Journey.eligibility.doneCard` | Special done UI | `eligibleAmount`, offer count, bank logos | Tap → reopen Discover | — | Amount left; “N bank offers” + logos right-aligned under → |
| `User.Loan.Journey.apply` | Overview step `apply` | Title: Add Personal details | CTA **Continue** | Sheet `apply` | **done** if status≥kyc; **current** if `selectedBankId`; if status=`apply` with bank, KYC forced locked |
| `User.Loan.Journey.kyc` | Overview step `kyc` | Title: Complete KYC | CTA **Continue** | Sheet `kyc` | **done** if `kyc.complete` OR status≥verify |
| `User.Loan.Journey.verify` | Overview step `verify` | Title: Verify loan | CTA **Upload documents** | Sheet `verify` | **current** if status≥verify OR `kyc.complete` |
| `User.Loan.Journey.track` | Overview step `track` | Title: Track loan | CTA **View progress** | Sheet `track` (rarely used once inline tracking shows) | Hidden as list when tracking phase; **done** only at `active` |
| `User.Loan.Journey.empty` | `loanStatus=not_started` | — | Start Home Loan / Transfer | → `startLoan` | JourneyCard: title + subtitle + two CTAs (no “Choose a path” filler) |
| `User.Resident.Loan.*` | Same journey as NRI | `residency=resident` | — | KYC docs: pan, aadhaar, selfie | Address: India only; Compliance: India tax resident + PEP + bureau |
| `User.NRI.Loan.*` | Same journey as Resident | `residency=nri` | — | KYC docs: passport, visa, pan, selfie (+ optional oci, labour_card) | Address: overseas + India; Compliance: FATCA/CRS + tax country + TIN + PEP + bureau |
| `User.Loan.Discover` | Sheet `discover` | Accordion steps 1–3 | Close sheet → overview | Hosted in AppShell | Title: Check eligibility / Transfer offers |
| `User.Loan.Discover.step1_details` | Open by default until calculated | `residency`, `country`, `propertyValue`, `annualIncome`, `occupation` | **Calculate eligibility** | → `submitDiscover`: sets residency/occupation defaults, `eligibleAmount=mockEligibleAmount`, `eligibilityCalculated=true`, `loanStatus=discover`, sheet stays discover; UI opens step 2 | Transfer label: “Property value / outstanding” |
| `User.Loan.Discover.step2_eligibility` | Locked until calculated \| calculating | `eligibleAmount`, range string | **See bank offers** / View again | → `runOfferSearch`: `loanStatus=offers`, `searchingOffers=true` → false @900ms; opens step 3 | Card: amount + `mockEligibleRange` + horizontal bank logo stack |
| `User.Loan.Discover.step3_offers` | Locked until offers unlocked | Offers list, `shortlist`, `selectedBankId` | Save; expand; **Apply with {name}** | `selectBank(id)` → apply | Unlocked if searching OR status ∈ offers…active |
| `User.Loan.Discover.bank.hdfc` | Offer card | rate 8.35%, amount ₹1.85 Cr, fee ₹10,000+GST, “Fastest digital sanction” | Apply | → apply | Logo left of name |
| `User.Loan.Discover.bank.sbi` | Offer card | rate 8.40%, amount ₹1.80 Cr, fee ₹8,500+GST, “Lowest processing fee” | Apply | → apply | — |
| `User.Loan.Discover.bank.icici` | Offer card | rate 8.45%, amount ₹1.78 Cr, fee ₹12,000+GST, “NRI-friendly documentation” | Apply | → apply | — |
| `User.Loan.Apply` | Sheet `apply`; `loanStatus=apply` | Local UI `done` flags (not persisted in AppState) | Close → overview | Accordion 1–4 | Screen subtitle: Applying with {bank} |
| `User.Loan.Apply.step1_personal` | Accordion | `personal.{firstName,lastName,email,phone}` | Continue → marks local personal done, open 2 | — | Summary when done: full name |
| `User.Loan.Apply.step2_employment` | Locked until personal done | `employment.{employer,designation,experience}` | Continue → employment done, open 3 | — | — |
| `User.Loan.Apply.step3_property` | Locked until employment done | `property.{city,type,stage}` | Review application → property done, open 4 | — | — |
| `User.Loan.Apply.step4_review` | Locked until property done | Read-only Bank, Name, Email, Employer, Property, Amount | **Submit application** | → `loanStatus=kyc`, `closeSheet()` | Does not auto-open KYC sheet |
| `User.Loan.KYC` | Sheet `kyc`; `loanStatus=kyc` | Nested `kyc` object | Accordion 1–6 + StateMachineNav edge leaves | Residency via SM nav / Discover — **no in-sheet tabs** | Full edge inventory in rows below |
| `User.Loan.KYC.already_verified_skip` | KYC-0 | Identity+mobile+email done | Opens docs step with DigiLocker-linked docs | SM: `…KYC.already_verified_skip` |
| `User.Loan.KYC.step1` | Identity | `identityPhase`, DigiLocker flags/consents, `identityPanDraft`, `identityNameMismatch` | DigiLocker or Manual | AppState-backed for SM jumps |
| `…step1.intro` | Choice | DigiLocker vs Manual | — | |
| `…step1.digilocker.redirect` | Redirect | Auto → consent | — | |
| `…step1.digilocker.consent` / `consent_incomplete` | Consents on/off | Allow gated | — | |
| `…step1.digilocker.fetching` | Fetch | Auto → results | — | |
| `…step1.digilocker.pan_missing` / `aadhaar_missing` / `both_missing` / `results_both_found` | DigiLocker results variants | Branch by found docs | — | |
| `…step1.digilocker.pan_found` / `name_mismatch` | Confirm PAN | → OTP or manual Aadhaar | Name mismatch warns delay | |
| `…step1.digilocker.aadhaar_otp` / `aadhaar_otp_pan_missing` | Aadhaar OTP | → done or pan_missing | — | |
| `…step1.digilocker.done` / `manual.done` | Both verified | Continue → Mobile | — | |
| `…step1.pan_missing` | Aadhaar OK · PAN missing | Manual PAN | — | |
| `…step1.manual.pan` / `pan_invalid` / `aadhaar` | Manual entry | Format gate; under_review | — | |
| `…step1.manual.under_review` / `pan_pending_aadhaar_ok` | Pending variants | Simulate / Continue while pending | — | |
| `…step2.continue_while_pending` | Mobile + pending identity | OTP | — | |
| `…step2.otp_empty` / `otp_partial` / `otp_ready` / `verified` | OTP states | Verify needs 6 digits | — | |
| `…step3.verified` / `pending` / `otp_ready` | Email verified or OTP UI | Pending → verify email | — | |
| `…step3.mobile_already_verified_skip` | Skip mobile OTP | Email step | — | |
| `…step4.docs_empty` / `partial` / `uploaded` / `digilocker_linked` / `under_review_labels` | Doc batch states | Continue when required satisfy | rejected/expired block | |
| `…step4.doc_rejected` / `doc_expired` | Re-upload | Tap → uploaded | PRD | |
| `…step4.selfie_capture` | Live selfie | `SelfieCapturePage` wired | — | |
| `…step4.locked` | Mobile pending | Accordion locked | — | |
| `…step4.doc.{key}` | Single required doc | Per residency keys | — | |
| `…step4.form60` / `form60_complete` / `optional_docs` | NRI only | Form 60 / OCI / labour | — | |
| `…step5.resident` / `nri` / `empty` / `india_empty` / `overseas_empty` | Address | Confirm disabled until filled | — | |
| `…step6.resident` / `nri_fatca` / `tin_filled` | Compliance | Submit → KYC-7 summary | — | |
| `…step6.summary` | KYC-7 | Continue → verify | Stays on sheet until continue | |
| `…step6.complete` | After continue | `loanStatus=verify` | — | |
| `User.Loan.Verify` | Sheet `verify`; `loanStatus=verify` | `verifyDocs` map | Tap row cycles status; **Submit verification** | → `loanStatus=track`, `trackStep=0`, closeSheet | Submit enabled if every doc ∈ {uploaded, under_review, accepted} |
| `User.Loan.Verify.doc.salary_slips` | DocStatus | Key `salary_slips` | `setVerifyDoc` | 4-state cycle | Label: Salary slips (last 3 months) |
| `User.Loan.Verify.doc.bank_statements` | DocStatus | Key `bank_statements` | Same | Same | Bank statements (6 months) |
| `User.Loan.Verify.doc.property_docs` | DocStatus | Key `property_docs` | Same | Same | Property documents |
| `User.Loan.Verify.doc.credit_consent` | DocStatus | Key `credit_consent` | Same | Same | Credit bureau consent |
| `User.Loan.Track` | Inline on overview when status ≥ track; optional sheet `track` | `trackStep` 0–6, bank meta | **Simulate next status** → `advanceTrack` | See TRACK_STEPS rows | Replaces journey step list on overview |
| `User.Loan.Track.milestone.0` | Application submitted | `trackStep=0` | advanceTrack | → 1 | — |
| `User.Loan.Track.milestone.1` | Bank review in progress | 1 | advanceTrack | → 2 | — |
| `User.Loan.Track.milestone.2` | Verification complete | 2 | advanceTrack | → 3 | Timeline event gate |
| `User.Loan.Track.milestone.3` | Loan approved | 3 | advanceTrack | → 4; **`loanStatus=approved`** | — |
| `User.Loan.Track.milestone.4` | Legal processing | 4 | advanceTrack | → 5 | — |
| `User.Loan.Track.milestone.5` | Disbursement | 5 | advanceTrack | → 6; **`loanStatus=disbursed`** | — |
| `User.Loan.Track.milestone.6` | Active loan | 6 | — | **`loanStatus=active`**, `demoPersona=done` | Caps at 6 |
| `User.Loan.Track.activeUI` | `trackStep≥6` | Bank name, amount, rate; EMI ₹1,24,500 due 5 Aug 2026; prepay tip ₹50k → ~₹2.1 L interest | Pay EMI; Make pre-payment (UI stubs) | — | Transfer adds “· Transfer” in header line; no Profile CTA on card |
| `User.Loan.Track.inProgressUI` | `trackStep<6` | Current milestone title; “Step n of 7 · Next: …” | Simulate next status | — | — |
| `User.Loan.Timeline` | Screen `timeline` | Derived event list | Back → overview | Read-only | Events gated by status / trackStep / kyc.complete |
| `Profile` | `nav=profile` | All loan-collected fields | Edit icons per section; Done (check) | Patches AppState live | No summary+rows duplication; name in header only |
| `Profile.contact` | Section | personal name/email/phone | Edit | `patchPersonal` | — |
| `Profile.employment` | Section | employer, designation, experience, occupation, annualIncome | Edit | `patchEmployment` / `setField` | — |
| `Profile.property` | Section | city, type, stage, propertyValue | Edit | `patchProperty` / `setField` | — |
| `Profile.eligibilityBank` | Section | residency, country, eligibleAmount; RO bank name/rate | Edit | `setField` | Changing residency via Profile **does not** prune docs (unlike `setResidency`) |
| `Profile.addressesTax` | Section | indiaAddress; NRI overseas/tax/TIN; mobile/email verified flags | Edit | `patchKyc` | — |
| `Profile.docs.identity` | List | KYC doc keys for residency | Tap cycles `setKycDoc` | Shown if docs exist or KYC complete | — |
| `Profile.docs.verify` | List | verifyDocs | Tap cycles `setVerifyDoc` | Shown if any verify started OR status ∈ verify\|track\|approved\|disbursed\|active | — |
| `Profile.settings` | Stub | — | — | — | “Notifications & preferences” single line |
| `Help` | `nav=help` | — | FAQ / RM / ticket stubs | Notification deep-link | If KYC incomplete and status kyc\|apply → `goTo("kyc_check")` (renders Overview); if verify → `verify_checklist` (Overview); else overview — **does not open sheets** |
| `DocMachine.kyc` | Toggle | per key in `kyc.docs` | `setKycDoc(key)` or `setKycDoc(key, status)` | not_started ↔ uploaded | Explicit status used when selfie confirm wired |
| `DocMachine.verify` | Cycle | per key in `verifyDocs` | `setVerifyDoc(key)` | 4-state loop | Accepted not required to submit (uploaded/under_review OK) |
| `Persona.new` | Loadable snapshot | `PERSONA_PRESETS.new` ≈ initialState | Overview tab New | Full replace | `loanStatus=not_started` |
| `Persona.mid` | Loadable snapshot | home + nri + salaried; eligibility done; bank hdfc; shortlist hdfc,sbi; `loanStatus=kyc`; mobile+email verified; passport uploaded; visa/pan/selfie not started | Overview tab In progress | Full replace | Mid-KYC NRI |
| `Persona.done` | Loadable snapshot | `loanStatus=active`, `trackStep=6`; KYC complete; all KYC+verify docs uploaded/accepted; foreignTin set | Overview tab Completed | Full replace | Shows active tracking UI |

---

## Global AppState field index

| Field | Type | Primary mutators |
|---|---|---|
| `screen` | `ScreenId` | `goTo`, sheet open/close, journey mutators |
| `nav` | `NavSection` | `goTo`, sheet open, startLoan, discover helpers |
| `loanType` | `LoanType` | `startLoan`, personas |
| `residency` | `Residency` | `setResidency`, `submitDiscover`, Profile `setField` |
| `country` | `string` | `setField`, `setResidency`, `submitDiscover` |
| `propertyValue` | `string` | `setField` |
| `annualIncome` | `string` | `setField` |
| `occupation` | `Occupation` | `setField`, `submitDiscover` |
| `eligibleAmount` | `string` | `submitDiscover` (`mockEligibleAmount`), Profile |
| `eligibilityCalculated` | `boolean` | `submitDiscover` → true |
| `selectedBankId` | `string \| null` | Discover expand `setField`; `selectBank` |
| `shortlist` | `string[]` | `toggleShortlist` |
| `personal.*` | strings | `patchPersonal` |
| `employment.*` | strings | `patchEmployment` |
| `property.*` | strings | `patchProperty` |
| `kyc.mobileVerified` | `boolean` | KYC Verify |
| `kyc.emailVerified` | `boolean` | Initial **true**; not toggled in happy path |
| `kyc.identityVerified` | `boolean` | Docs Continue; cleared by `setResidency`; `markKycComplete` |
| `kyc.addressVerified` | `boolean` | Address Confirm; `markKycComplete` |
| `kyc.complianceDone` | `boolean` | `markKycComplete` only |
| `kyc.complete` | `boolean` | `markKycComplete` |
| `kyc.docs` | `Record<string, DocStatus>` | `setKycDoc`; pruned by `setResidency` |
| `kyc.indiaAddress` / `overseasAddress` | `string` | Address / Profile |
| `kyc.taxCountry` / `foreignTin` | `string` | Compliance / Profile |
| `kyc.useForm60` | `boolean` | NRI docs checkbox |
| `kyc.identityPhase` | `IdentityPhase` | DigiLocker / manual subflow; StateMachineNav seeds |
| `kyc.panInDigilocker` / `aadhaarInDigilocker` | `boolean` | DigiLocker document presence |
| `kyc.digilockerConsentUidai` / `digilockerConsentPan` | `boolean` | Consent checkboxes |
| `kyc.identityPanDraft` | `string` | Manual / DigiLocker PAN field |
| `kyc.identityNameMismatch` | `boolean` | PAN confirm name mismatch warning |
| `kyc.selfieCaptureOpen` | `boolean` | Live selfie capture UI |
| `kyc.emailOtp` | `string` | Email pending verification |
| `verifyDocs.*` | `DocStatus` | `setVerifyDoc` |
| `loanStatus` | `LoanStatus` | Journey mutators + `advanceTrack` |
| `trackStep` | `0…6` | Verify submit → 0; `advanceTrack` |
| `otp` | `string` | KYC mobile field |
| `searchingOffers` | `boolean` | `runOfferSearch` |
| `demoPersona` | `DemoPersona` | `loadPersona`, start/select/advance |
| `sheet` | `JourneySheet` | `openSheet` / `closeSheet` / journey |

---

## Canonical happy-path diagram

```mermaid
flowchart TD
  start[not_started] -->|startLoan home_or_transfer| discover[discover]
  discover -->|submitDiscover| discoverCalc[discover eligibilityCalculated]
  discoverCalc -->|runOfferSearch| offers[offers]
  offers -->|selectBank| apply[apply]
  apply -->|Submit application| kyc[kyc]
  kyc -->|markKycComplete| verify[verify]
  verify -->|Submit verification trackStep0| track[track]
  track -->|advanceTrack to 3| approved[approved]
  approved -->|advanceTrack to 5| disbursed[disbursed]
  disbursed -->|advanceTrack to 6| active[active]
```

### Canonical transition cheat sheet

| Trigger | From (typical) | To `loanStatus` | Sheet / side effects |
|---|---|---|---|
| `startLoan(type)` | `not_started` | `discover` | `loanType` set; persona → mid; sheet null |
| `submitDiscover` | `discover` | `discover` | eligibility calc; sheet `discover` |
| `runOfferSearch` | `discover` | `offers` | searching 900ms; sheet `discover` |
| `selectBank(id)` | `offers` | `apply` | bank selected; sheet null |
| Apply Submit | `apply` | `kyc` | closeSheet |
| `markKycComplete` | `kyc` | stays `kyc` | Flags true; sheet stays on step 6 summary (KYC-7); Continue → `verify` |
| Verify Submit | `verify` | `track` | `trackStep=0`; closeSheet |
| `advanceTrack` | `track`… | `approved` @≥3 / `disbursed` @≥5 / `active` @≥6 | `trackStep++`; persona done at 6 |
| `loadPersona` / `reset` | * | preset | Full state replace |

---

## Implementation notes for backend engineers

1. **Sheets vs routes:** Treat journey steps as a **state machine + modal/sheet**, not separate deep links. Overview is always the loan hub.
2. **KYC reusable identity:** Persist `kyc.*` and identity docs at user level; loan-specific verify docs stay on the loan application.
3. **KYC identity phases:** `kyc.identityPhase` + `panInDigilocker` + `identityPanDraft` drive DigiLocker/manual simulation; StateMachineNav leaves under `User.{residency}.Loan.{type}.KYC.step*` seed these for demos.
4. **Residency switch:** Must redefine required document set and invalidate identity verification (prototype prunes docs). Switch via left StateMachineNav (Resident Indian / NRI), not an in-sheet tab.
5. **Email:** Product assumes pre-verified email in this prototype — do not model OTP for email unless product changes.
6. **Mobile OTP:** Verify CTA disabled until 6 digits (prototype accepts any digits).
7. **Selfie:** Prefer a dedicated capture sub-state (camera permission → preview → confirm). Component exists; wire to `kyc.docs.selfie=uploaded` on confirm.
8. **Tracking:** After verify submit, loan hub becomes status/EMI surface; application checklist is no longer primary.
9. **Personas:** `new` / `mid` / `done` are demo loaders, not production concepts — map to empty / in-progress / funded application fixtures in staging.
